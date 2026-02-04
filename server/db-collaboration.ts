import { getDb } from "./db";
import { activityFeed, sharedViews } from "../drizzle/schema";
import { eq, and, desc, or, sql } from "drizzle-orm";
import { randomUUID } from "crypto";

/**
 * Log an activity to the feed
 */
export async function logActivity(data: {
  tenantId: string;
  userId: string;
  actionType: string;
  entityType?: string;
  entityId?: string;
  entityName?: string;
  description: string;
  metadata?: Record<string, any>;
}) {
  const db = await getDb();
  if (!db) return;

  await db.insert(activityFeed).values({
    id: randomUUID(),
    tenantId: data.tenantId,
    userId: data.userId,
    actionType: data.actionType as any,
    entityType: data.entityType as any || null,
    entityId: data.entityId || null,
    entityName: data.entityName || null,
    description: data.description,
    metadata: data.metadata || {},
  });
}

/**
 * Get activity feed for a tenant
 */
export async function getActivityFeed(tenantId: string, limit = 50) {
  const db = await getDb();
  if (!db) return [];

  return db
    .select()
    .from(activityFeed)
    .where(eq(activityFeed.tenantId, tenantId))
    .orderBy(desc(activityFeed.createdAt))
    .limit(limit);
}

/**
 * Get activity feed for a specific entity
 */
export async function getEntityActivity(
  tenantId: string,
  entityType: string,
  entityId: string,
  limit = 20
) {
  const db = await getDb();
  if (!db) return [];

  return db
    .select()
    .from(activityFeed)
    .where(
      and(
        eq(activityFeed.tenantId, tenantId),
        eq(activityFeed.entityType, entityType as any),
        eq(activityFeed.entityId, entityId)
      )
    )
    .orderBy(desc(activityFeed.createdAt))
    .limit(limit);
}

/**
 * Get activity feed for a specific user
 */
export async function getUserActivity(tenantId: string, userId: string, limit = 50) {
  const db = await getDb();
  if (!db) return [];

  return db
    .select()
    .from(activityFeed)
    .where(
      and(
        eq(activityFeed.tenantId, tenantId),
        eq(activityFeed.userId, userId)
      )
    )
    .orderBy(desc(activityFeed.createdAt))
    .limit(limit);
}

/**
 * Create a shared view
 */
export async function createSharedView(data: {
  tenantId: string;
  name: string;
  viewType: string;
  filters?: Record<string, any>;
  sortBy?: string;
  sortOrder?: "asc" | "desc";
  createdById: string;
  isPublic?: boolean;
  sharedWithUserIds?: string[];
}) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  const viewId = randomUUID();

  await db.insert(sharedViews).values({
    id: viewId,
    tenantId: data.tenantId,
    name: data.name,
    viewType: data.viewType as any,
    filters: data.filters || {},
    sortBy: data.sortBy || null,
    sortOrder: data.sortOrder || "asc",
    createdById: data.createdById,
    isPublic: data.isPublic || false,
    sharedWithUserIds: data.sharedWithUserIds || [],
  });

  return viewId;
}

/**
 * Get shared views accessible to a user
 */
export async function getSharedViews(tenantId: string, userId: string, viewType?: string) {
  const db = await getDb();
  if (!db) return [];

  const conditions = [
    eq(sharedViews.tenantId, tenantId),
    or(
      eq(sharedViews.isPublic, true),
      eq(sharedViews.createdById, userId),
      sql`JSON_CONTAINS(${sharedViews.sharedWithUserIds}, JSON_QUOTE(${userId}))`
    )
  ];

  if (viewType) {
    conditions.push(eq(sharedViews.viewType, viewType as any));
  }

  return db
    .select()
    .from(sharedViews)
    .where(and(...conditions))
    .orderBy(desc(sharedViews.updatedAt));
}

/**
 * Get a specific shared view
 */
export async function getSharedViewById(viewId: string) {
  const db = await getDb();
  if (!db) return null;

  const results = await db
    .select()
    .from(sharedViews)
    .where(eq(sharedViews.id, viewId))
    .limit(1);

  return results[0] || null;
}

/**
 * Update a shared view
 */
export async function updateSharedView(
  viewId: string,
  data: {
    name?: string;
    filters?: Record<string, any>;
    sortBy?: string;
    sortOrder?: "asc" | "desc";
    isPublic?: boolean;
    sharedWithUserIds?: string[];
  }
) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  await db
    .update(sharedViews)
    .set(data)
    .where(eq(sharedViews.id, viewId));
}

/**
 * Delete a shared view
 */
export async function deleteSharedView(viewId: string) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  await db.delete(sharedViews).where(eq(sharedViews.id, viewId));
}

/**
 * Parse @mentions from text
 */
export function parseMentions(text: string): string[] {
  const mentionRegex = /@(\w+)/g;
  const mentions: string[] = [];
  let match;

  while ((match = mentionRegex.exec(text)) !== null) {
    mentions.push(match[1]);
  }

  return mentions;
}

/**
 * Create notifications for @mentions
 */
export async function notifyMentions(
  tenantId: string,
  text: string,
  messageId: string,
  channelId: string
) {
  const mentions = parseMentions(text);
  if (mentions.length === 0) return;

  // Import notification creation function
  const { createNotification } = await import("./db");

  for (const username of mentions) {
    // In a real implementation, you'd look up the user by username
    // For now, we'll just log it
    console.log(`[Collaboration] Would notify @${username} about message ${messageId}`);
  }
}
