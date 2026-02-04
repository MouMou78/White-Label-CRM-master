import { getDb } from "./db";
import { automationRules, automationExecutions, deals, tasks } from "../drizzle/schema";
import { eq, and } from "drizzle-orm";
import { randomUUID } from "crypto";

export type TriggerType =
  | "email_opened"
  | "email_replied"
  | "no_reply_after_days"
  | "meeting_held"
  | "stage_entered"
  | "deal_value_threshold";

export type ActionType =
  | "move_stage"
  | "send_notification"
  | "create_task"
  | "enroll_sequence"
  | "update_field";

export type TriggerContext = {
  tenantId: string;
  personId?: string;
  threadId?: string;
  dealId?: string;
  eventType: TriggerType;
  eventData: Record<string, any>;
};

/**
 * Evaluate and execute automation rules based on a trigger event
 */
export async function processAutomationTrigger(context: TriggerContext): Promise<void> {
  const db = await getDb();
  if (!db) {
    console.error("[Automation] Database not available");
    return;
  }

  // Find active automation rules for this trigger type
  const rules = await db
    .select()
    .from(automationRules)
    .where(
      and(
        eq(automationRules.tenantId, context.tenantId),
        eq(automationRules.triggerType, context.eventType),
        eq(automationRules.status, "active")
      )
    );

  console.log(`[Automation] Found ${rules.length} rules for trigger ${context.eventType}`);

  // Execute each matching rule
  for (const rule of rules) {
    try {
      // Evaluate trigger conditions
      const shouldExecute = evaluateTriggerConditions(rule.triggerConfig || {}, context);

      if (!shouldExecute) {
        await logExecution(context.tenantId, rule.id, context, "skipped", "Conditions not met");
        continue;
      }

      // Execute the action
      await executeAction(rule.actionType, rule.actionConfig || {}, context);

      await logExecution(context.tenantId, rule.id, context, "success");
      console.log(`[Automation] Successfully executed rule ${rule.name}`);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : "Unknown error";
      await logExecution(context.tenantId, rule.id, context, "failed", errorMessage);
      console.error(`[Automation] Failed to execute rule ${rule.name}:`, error);
    }
  }
}

/**
 * Evaluate trigger conditions
 */
function evaluateTriggerConditions(
  triggerConfig: Record<string, any>,
  context: TriggerContext
): boolean {
  // If no conditions specified, always execute
  if (!triggerConfig || Object.keys(triggerConfig).length === 0) {
    return true;
  }

  // Check deal value threshold
  if (triggerConfig.minDealValue && context.eventData.dealValue) {
    if (context.eventData.dealValue < triggerConfig.minDealValue) {
      return false;
    }
  }

  // Check days threshold for no_reply_after_days
  if (triggerConfig.days && context.eventData.daysSinceLastReply) {
    if (context.eventData.daysSinceLastReply < triggerConfig.days) {
      return false;
    }
  }

  // Check stage ID for stage_entered
  if (triggerConfig.stageId && context.eventData.stageId) {
    if (context.eventData.stageId !== triggerConfig.stageId) {
      return false;
    }
  }

  return true;
}

/**
 * Execute automation action
 */
async function executeAction(
  actionType: ActionType,
  actionConfig: Record<string, any>,
  context: TriggerContext
): Promise<void> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  switch (actionType) {
    case "move_stage":
      await executeMoveStage(actionConfig, context);
      break;

    case "send_notification":
      await executeSendNotification(actionConfig, context);
      break;

    case "create_task":
      await executeCreateTask(actionConfig, context);
      break;

    case "enroll_sequence":
      await executeEnrollSequence(actionConfig, context);
      break;

    case "update_field":
      await executeUpdateField(actionConfig, context);
      break;

    default:
      throw new Error(`Unknown action type: ${actionType}`);
  }
}

/**
 * Move deal to a different stage
 */
async function executeMoveStage(
  config: Record<string, any>,
  context: TriggerContext
): Promise<void> {
  if (!context.dealId || !config.targetStageId) {
    throw new Error("Missing dealId or targetStageId for move_stage action");
  }

  const db = await getDb();
  if (!db) throw new Error("Database not available");

  await db
    .update(deals)
    .set({ stageId: config.targetStageId })
    .where(eq(deals.id, context.dealId));

  console.log(`[Automation] Moved deal ${context.dealId} to stage ${config.targetStageId}`);
}

/**
 * Send notification to user
 */
async function executeSendNotification(
  config: Record<string, any>,
  context: TriggerContext
): Promise<void> {
  // Import notification helper
  const { notifyOwner } = await import("./_core/notification");

  const title = config.title || "Automation Notification";
  const content = config.content || "An automation rule was triggered";

  await notifyOwner({ title, content });
  console.log(`[Automation] Sent notification: ${title}`);
}

/**
 * Create a task
 */
async function executeCreateTask(
  config: Record<string, any>,
  context: TriggerContext
): Promise<void> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  const taskId = randomUUID();
  const dueDate = config.daysUntilDue
    ? new Date(Date.now() + config.daysUntilDue * 24 * 60 * 60 * 1000)
    : null;

  await db.insert(tasks).values({
    id: taskId,
    tenantId: context.tenantId,
    title: config.title || "Automated Task",
    description: config.description || "",
    status: "todo",
    priority: config.priority || "medium",
    dueDate,
    assignedToId: config.assignedToId || null,
    createdById: config.createdById || context.tenantId, // Use tenantId as fallback
    linkedEntityType: context.dealId ? "deal" : context.personId ? "contact" : null,
    linkedEntityId: context.dealId || context.personId || null,
  });

  console.log(`[Automation] Created task ${taskId}: ${config.title}`);
}

/**
 * Enroll person in email sequence
 */
async function executeEnrollSequence(
  config: Record<string, any>,
  context: TriggerContext
): Promise<void> {
  if (!context.personId || !config.sequenceId) {
    throw new Error("Missing personId or sequenceId for enroll_sequence action");
  }

  // Import sequence enrollment function
  const { enrollInSequence } = await import("./sequence-processor");

  await enrollInSequence(context.tenantId, context.personId, config.sequenceId);
  console.log(`[Automation] Enrolled person ${context.personId} in sequence ${config.sequenceId}`);
}

/**
 * Update a field on a record
 */
async function executeUpdateField(
  config: Record<string, any>,
  context: TriggerContext
): Promise<void> {
  if (!config.entityType || !config.fieldName || !config.fieldValue) {
    throw new Error("Missing entityType, fieldName, or fieldValue for update_field action");
  }

  const db = await getDb();
  if (!db) throw new Error("Database not available");

  // This is a simplified implementation
  // In production, you'd want more robust field updating logic
  console.log(
    `[Automation] Would update ${config.entityType}.${config.fieldName} to ${config.fieldValue}`
  );
}

/**
 * Log automation execution
 */
async function logExecution(
  tenantId: string,
  ruleId: string,
  context: TriggerContext,
  status: "success" | "failed" | "skipped",
  errorMessage?: string
): Promise<void> {
  const db = await getDb();
  if (!db) return;

  await db.insert(automationExecutions).values({
    id: randomUUID(),
    tenantId,
    ruleId,
    threadId: context.threadId || null,
    personId: context.personId || null,
    status,
    errorMessage: errorMessage || null,
    metadata: context.eventData,
  });
}

/**
 * Check for time-based triggers (called by cron)
 */
export async function processTimedTriggers(tenantId: string): Promise<void> {
  const db = await getDb();
  if (!db) return;

  // Find rules with time-based triggers
  const rules = await db
    .select()
    .from(automationRules)
    .where(
      and(
        eq(automationRules.tenantId, tenantId),
        eq(automationRules.triggerType, "no_reply_after_days"),
        eq(automationRules.status, "active")
      )
    );

  // Process each rule
  for (const rule of rules) {
    // Find threads that haven't had replies within the threshold
    // This would require querying moments/threads and checking last reply time
    // Implementation would be similar to sequence processor
    console.log(`[Automation] Processing timed trigger for rule ${rule.name}`);
  }
}
