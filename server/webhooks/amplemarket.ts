import { Router, json } from "express";
import type { Request, Response } from "express";
import { getDb } from "../db";
import { eq, and } from "drizzle-orm";
import * as schema from "../../drizzle/schema";

const router = Router();

// Middleware to parse JSON and enforce size limits
router.use(json({ limit: "1mb" }));

// Webhook event logging table will store raw payloads
interface WebhookEvent {
  id: string;
  provider: string;
  eventType: string;
  payload: any;
  headers: any;
  processedAt: Date | null;
  error: string | null;
  createdAt: Date;
}

// Detect event type from payload shape
function detectEventType(payload: any): string {
  if (payload.is_reply && payload.sequence && payload.labels) {
    return "reply";
  }
  if (payload.sequence_stage?.type && payload.id) {
    return "sequence_stage";
  }
  if (payload.email_message?.tag) {
    return "workflow_send_json";
  }
  return "unknown";
}

// Extract contact email from various payload structures
function extractContactEmail(payload: any): string | null {
  // Try contact.id first (if we have a mapping)
  if (payload.contact?.id) {
    // We'll need to look this up in our database
    return null; // Will be handled by contact.id lookup
  }
  
  // Try dynamic_fields
  if (payload.dynamic_fields?.email) {
    return payload.dynamic_fields.email;
  }
  
  // Try lead.email
  if (payload.lead?.email) {
    return payload.lead.email;
  }
  
  // Try sequence_lead.email
  if (payload.sequence_lead?.email) {
    return payload.sequence_lead.email;
  }
  
  // Try from field (for replies)
  if (payload.from) {
    return payload.from;
  }
  
  return null;
}

// Map webhook labels/tags to CRM contact status
function mapLabelToStatus(labels: string[] | undefined, tags: string[] | undefined): string | null {
  const allTags = [...(labels || []), ...(tags || [])];
  
  if (allTags.includes("interested")) return "qualified";
  if (allTags.includes("hard_no")) return "disqualified";
  if (allTags.includes("not_interested")) return "disqualified";
  if (allTags.includes("ooo")) return "nurture";
  if (allTags.includes("asked_to_circle_back_later")) return "nurture";
  if (allTags.includes("not_the_right_person")) return "disqualified";
  if (allTags.includes("forwarded_to_the_right_person")) return "qualified";
  
  return null;
}

// Process webhook event asynchronously
async function processWebhookEvent(eventId: string, eventType: string, payload: any, tenantId: string) {
  try {
    const email = extractContactEmail(payload);
    const contactId = payload.contact?.id;
    
    // Find or create contact by email
    let person = null;
    if (email) {
      // Try to find by email
      const dbInstance = await getDb();
      if (!dbInstance) return;
      const existing = await dbInstance
        .select()
        .from(schema.people)
        .where(and(
          eq(schema.people.tenantId, tenantId),
          eq(schema.people.primaryEmail, email)
        ))
        .limit(1);
      
      if (existing.length > 0) {
        person = existing[0];
      } else {
        // Create new contact
        const newPerson = {
          id: crypto.randomUUID(),
          tenantId,
          fullName: payload.dynamic_fields?.name || payload.lead?.name || email.split("@")[0],
          primaryEmail: email,
          status: "new",
          createdAt: new Date(),
          updatedAt: new Date(),
        };
        
        await dbInstance.insert(schema.people).values([newPerson]);
        person = newPerson;
      }
    }
    
    if (!person) {
      console.warn(`Could not find or create contact for webhook event ${eventId}`);
      return;
    }
    
    // Update contact status based on labels/tags
    const newStatus = mapLabelToStatus(payload.labels, payload.email_message?.tag);
    if (newStatus && person.status !== newStatus) {
      const dbInstance = await getDb();
      if (!dbInstance) return;
      await dbInstance
        .update(schema.people)
        .set({ status: newStatus, updatedAt: new Date() })
        .where(eq(schema.people.id, person.id));
    }
    
    // Create activity record
    const activityId = crypto.randomUUID();
    const externalId = payload.id || `webhook-${eventId}`;
    
    const activityType: "email" | "note" | "call" | "meeting" | "task" | "deal_stage_change" | "tag_added" | "assignment_changed" = eventType === "reply" ? "email" : "note";
    const activity = {
      id: activityId,
      tenantId,
      personId: person.id,
      activityType,
      title: payload.subject || `Amplemarket ${eventType}`,
      description: payload.body || JSON.stringify(payload),
      metadata: payload,
      timestamp: payload.date ? new Date(payload.date) : new Date(),
    };
    
    const dbInstance = await getDb();
    if (!dbInstance) {
      console.error("Database connection failed during activity creation");
      return;
    }
    
    // Create activity (no externalId check since activities table doesn't have that field)
    await dbInstance.insert(schema.activities).values([activity]);
    
    // Mark webhook event as processed
    await dbInstance
      .update(schema.webhookEvents)
      .set({ processedAt: new Date() })
      .where(eq(schema.webhookEvents.id, eventId));
    
    console.log(`Successfully processed webhook event ${eventId} for contact ${person.primaryEmail}`);
  } catch (error: any) {
    console.error(`Error processing webhook event ${eventId}:`, error);
    
    // Mark webhook event as failed
    const dbInstance = await getDb();
    if (dbInstance) {
      await dbInstance
        .update(schema.webhookEvents)
        .set({ error: error.message })
        .where(eq(schema.webhookEvents.id, eventId));
    }
  }
}

// POST /api/webhooks/amplemarket
export async function handleAmplemarketWebhook(req: Request, res: Response) {
  try {
    // Respond quickly with 200 OK
    res.status(200).json({ received: true });
    
    // Get tenant ID from integration mapping
    // For now, we'll use the first tenant that has Amplemarket connected
    // In production, you might want to use a shared secret or subdomain to identify the tenant
    const dbInstance = await getDb();
    if (!dbInstance) {
      console.error("Database connection failed");
      return;
    }
    
    const integrations = await dbInstance
      .select()
      .from(schema.integrations)
      .where(and(
        eq(schema.integrations.provider, "amplemarket"),
        eq(schema.integrations.status, "connected")
      ))
      .limit(1);
    
    if (integrations.length === 0) {
      console.warn("Received Amplemarket webhook but no connected integration found");
      return;
    }
    
    const tenantId = integrations[0].tenantId;
    
    // Log webhook event
    const eventId = crypto.randomUUID();
    const eventType = detectEventType(req.body);
    
    await dbInstance.insert(schema.webhookEvents).values({
      id: eventId,
      tenantId,
      provider: "amplemarket",
      eventType,
      payload: req.body,
      headers: req.headers,
      processedAt: null,
      error: null,
      createdAt: new Date(),
    });
    
    // Process asynchronously (don't await)
    processWebhookEvent(eventId, eventType, req.body, tenantId).catch(err => {
      console.error("Async webhook processing error:", err);
    });
    
  } catch (error: any) {
    console.error("Webhook endpoint error:", error);
    // Already sent 200 OK, so just log the error
  }
}
