import { getDb } from "./db";
import { templateReviews, templateAnalytics, userTemplates } from "../drizzle/schema";
import { eq, and, desc, sql } from "drizzle-orm";
import { randomUUID } from "crypto";

// Template Reviews
export async function createTemplateReview(data: {
  templateId: string;
  userId: string;
  tenantId: string;
  rating: number;
  review?: string;
}) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  const id = randomUUID();
  await db.insert(templateReviews).values({ id, ...data });
  return id;
}

export async function getTemplateReviews(templateId: string) {
  const db = await getDb();
  if (!db) return [];
  return db
    .select()
    .from(templateReviews)
    .where(eq(templateReviews.templateId, templateId))
    .orderBy(desc(templateReviews.createdAt));
}

export async function getTemplateRating(templateId: string) {
  const db = await getDb();
  if (!db) return { avgRating: 0, reviewCount: 0 };
  const result = await db
    .select({
      avgRating: sql<number>`AVG(${templateReviews.rating})`,
      reviewCount: sql<number>`COUNT(*)`,
    })
    .from(templateReviews)
    .where(eq(templateReviews.templateId, templateId));
  
  return {
    avgRating: result[0]?.avgRating || 0,
    reviewCount: result[0]?.reviewCount || 0,
  };
}

// Template Analytics
export async function getTemplateAnalytics(templateId: string) {
  const db = await getDb();
  if (!db) return null;
  const result = await db
    .select()
    .from(templateAnalytics)
    .where(eq(templateAnalytics.templateId, templateId));
  
  return result[0] || null;
}

export async function incrementTemplateInstall(templateId: string) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  const existing = await getTemplateAnalytics(templateId);
  
  if (existing) {
    await db
      .update(templateAnalytics)
      .set({
        installCount: sql`${templateAnalytics.installCount} + 1`,
        lastInstalledAt: new Date(),
      })
      .where(eq(templateAnalytics.id, existing.id));
  } else {
    const id = randomUUID();
    await db.insert(templateAnalytics).values({
      id,
      templateId,
      installCount: 1,
      lastInstalledAt: new Date(),
    });
  }
}

export async function updateTemplateSuccess(templateId: string, success: boolean) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  const existing = await getTemplateAnalytics(templateId);
  if (!existing) return;
  
  if (success) {
    await db
      .update(templateAnalytics)
      .set({
        successCount: sql`${templateAnalytics.successCount} + 1`,
      })
      .where(eq(templateAnalytics.id, existing.id));
  } else {
    await db
      .update(templateAnalytics)
      .set({
        failureCount: sql`${templateAnalytics.failureCount} + 1`,
      })
      .where(eq(templateAnalytics.id, existing.id));
  }
}

export async function getTrendingTemplates(limit: number = 10) {
  const db = await getDb();
  if (!db) return [];
  return db
    .select()
    .from(templateAnalytics)
    .orderBy(desc(templateAnalytics.lastInstalledAt))
    .limit(limit);
}

// User Templates
export async function createUserTemplate(data: {
  userId: string;
  tenantId: string;
  name: string;
  description?: string;
  category: string;
  triggerType: string;
  triggerConfig: Record<string, any>;
  actionType: string;
  actionConfig: Record<string, any>;
  conditions: any;
  priority: number;
  isPublic: boolean;
  baseTemplateId?: string;
}) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  const id = randomUUID();
  await db.insert(userTemplates).values({ id, ...data } as any);
  return id;
}

export async function getUserTemplates(userId: string, tenantId: string) {
  const db = await getDb();
  if (!db) return [];
  return db
    .select()
    .from(userTemplates)
    .where(
      and(
        eq(userTemplates.userId, userId),
        eq(userTemplates.tenantId, tenantId)
      )
    )
    .orderBy(desc(userTemplates.createdAt));
}

export async function getPublicUserTemplates() {
  const db = await getDb();
  if (!db) return [];
  return db
    .select()
    .from(userTemplates)
    .where(eq(userTemplates.isPublic, true))
    .orderBy(desc(userTemplates.createdAt));
}

export async function getUserTemplateById(id: string) {
  const db = await getDb();
  if (!db) return null;
  const result = await db
    .select()
    .from(userTemplates)
    .where(eq(userTemplates.id, id));
  
  return result[0] || null;
}

export async function updateUserTemplate(
  id: string,
  data: Partial<{
    name: string;
    description: string;
    isPublic: boolean;
  }>
) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await db
    .update(userTemplates)
    .set(data)
    .where(eq(userTemplates.id, id));
}

export async function deleteUserTemplate(id: string) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await db.delete(userTemplates).where(eq(userTemplates.id, id));
}


// Template Version Management
export async function saveTemplateVersion(templateId: string) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  // Get current template data
  const template = await db
    .select()
    .from(userTemplates)
    .where(eq(userTemplates.id, templateId))
    .limit(1);
  
  if (!template[0]) throw new Error("Template not found");
  
  const { templateVersions } = await import("../drizzle/schema");
  
  // Save current version to history
  const versionId = randomUUID();
  await db.insert(templateVersions).values({
    id: versionId,
    templateId,
    version: template[0].version,
    name: template[0].name,
    description: template[0].description,
    category: template[0].category,
    triggerType: template[0].triggerType,
    triggerConfig: template[0].triggerConfig,
    actionType: template[0].actionType,
    actionConfig: template[0].actionConfig,
    conditions: template[0].conditions,
    priority: template[0].priority,
    changelog: template[0].changelog,
  });
  
  return versionId;
}

export async function getTemplateVersionHistory(templateId: string) {
  const db = await getDb();
  if (!db) return [];
  
  const { templateVersions } = await import("../drizzle/schema");
  
  return db
    .select()
    .from(templateVersions)
    .where(eq(templateVersions.templateId, templateId))
    .orderBy(desc(templateVersions.version));
}

export async function rollbackTemplateToVersion(templateId: string, versionId: string) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  const { templateVersions } = await import("../drizzle/schema");
  
  // Get the version data
  const versionData = await db
    .select()
    .from(templateVersions)
    .where(eq(templateVersions.id, versionId))
    .limit(1);
  
  if (!versionData[0]) throw new Error("Version not found");
  
  // Save current state before rollback
  await saveTemplateVersion(templateId);
  
  // Update template with version data
  await db
    .update(userTemplates)
    .set({
      name: versionData[0].name,
      description: versionData[0].description,
      category: versionData[0].category,
      triggerType: versionData[0].triggerType,
      triggerConfig: versionData[0].triggerConfig,
      actionType: versionData[0].actionType,
      actionConfig: versionData[0].actionConfig,
      conditions: versionData[0].conditions,
      priority: versionData[0].priority,
      version: sql`${userTemplates.version} + 1`,
      changelog: `Rolled back to version ${versionData[0].version}`,
      updatedAt: new Date(),
    })
    .where(eq(userTemplates.id, templateId));
  
  return true;
}

export async function updateTemplateWithVersion(
  templateId: string,
  updates: Partial<typeof userTemplates.$inferInsert>,
  changelog?: string
) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  // Save current version before updating
  await saveTemplateVersion(templateId);
  
  // Update template with new version
  await db
    .update(userTemplates)
    .set({
      ...updates,
      version: sql`${userTemplates.version} + 1`,
      changelog,
      updatedAt: new Date(),
    })
    .where(eq(userTemplates.id, templateId));
  
  return true;
}
