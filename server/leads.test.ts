import { describe, it, expect, beforeAll } from "vitest";
import * as db from "./db";
import { nanoid } from "nanoid";

describe("Lead Database Operations", () => {
  let testTenantId: string;
  let testLeadId: string;

  beforeAll(async () => {
    // Create a test tenant
    testTenantId = nanoid();
    await db.createTenant({
      name: "Test Tenant for Leads",
      domain: "test-leads.example.com",
    });
  });

  it("should create and retrieve a lead", async () => {
    const database = await db.getDb();
    if (!database) throw new Error("Database not available");

    const { leads } = await import("../drizzle/schema");

    // Create a test lead
    testLeadId = nanoid();
    await database.insert(leads).values({
      id: testLeadId,
      tenantId: testTenantId,
      source: "amplemarket",
      sourceType: "lead",
      amplemarketLeadId: "amp_test_123",
      ownerEmail: "owner@example.com",
      email: "lead@example.com",
      firstName: "Test",
      lastName: "Lead",
      company: "Test Company",
      title: "CEO",
      syncedAt: new Date(),
    });

    // Retrieve the lead
    const lead = await db.getLeadById(testTenantId, testLeadId);

    expect(lead).toBeDefined();
    expect(lead?.email).toBe("lead@example.com");
    expect(lead?.firstName).toBe("Test");
    expect(lead?.lastName).toBe("Lead");
    expect(lead?.company).toBe("Test Company");
    expect(lead?.source).toBe("amplemarket");
  });

  it("should list leads with owner filtering", async () => {
    const database = await db.getDb();
    if (!database) throw new Error("Database not available");

    const { leads } = await import("../drizzle/schema");

    // Create multiple leads with different owners
    const lead1Id = nanoid();
    const lead2Id = nanoid();

    await database.insert(leads).values([
      {
        id: lead1Id,
        tenantId: testTenantId,
        source: "amplemarket",
        sourceType: "lead",
        amplemarketLeadId: "amp_test_456",
        ownerEmail: "owner1@example.com",
        email: "lead1@example.com",
        firstName: "Lead",
        lastName: "One",
        syncedAt: new Date(),
      },
      {
        id: lead2Id,
        tenantId: testTenantId,
        source: "amplemarket",
        sourceType: "lead",
        amplemarketLeadId: "amp_test_789",
        ownerEmail: "owner2@example.com",
        email: "lead2@example.com",
        firstName: "Lead",
        lastName: "Two",
        syncedAt: new Date(),
      },
    ]);

    // Get all leads
    const allLeads = await db.getLeads(testTenantId);
    expect(allLeads.length).toBeGreaterThanOrEqual(3);

    // Filter by owner
    const owner1Leads = await db.getLeads(testTenantId, {
      ownerEmail: "owner1@example.com",
    });
    expect(owner1Leads.length).toBeGreaterThanOrEqual(1);
    expect(owner1Leads.every((l) => l.ownerEmail === "owner1@example.com")).toBe(true);
  });

  it("should search leads by email, name, or company", async () => {
    const database = await db.getDb();
    if (!database) throw new Error("Database not available");

    const { leads } = await import("../drizzle/schema");

    // Create a lead with distinctive search terms
    const searchLeadId = nanoid();
    await database.insert(leads).values({
      id: searchLeadId,
      tenantId: testTenantId,
      source: "amplemarket",
      sourceType: "lead",
      amplemarketLeadId: "amp_search_test",
      ownerEmail: "owner@example.com",
      email: "unique-search@example.com",
      firstName: "UniqueFirst",
      lastName: "UniqueLast",
      company: "UniqueCompany",
      syncedAt: new Date(),
    });

    // Search by email
    const emailResults = await db.searchLeads(testTenantId, "unique-search");
    expect(emailResults.length).toBeGreaterThanOrEqual(1);
    expect(emailResults.some((l) => l.email === "unique-search@example.com")).toBe(true);

    // Search by first name
    const firstNameResults = await db.searchLeads(testTenantId, "UniqueFirst");
    expect(firstNameResults.length).toBeGreaterThanOrEqual(1);
    expect(firstNameResults.some((l) => l.firstName === "UniqueFirst")).toBe(true);

    // Search by company
    const companyResults = await db.searchLeads(testTenantId, "UniqueCompany");
    expect(companyResults.length).toBeGreaterThanOrEqual(1);
    expect(companyResults.some((l) => l.company === "UniqueCompany")).toBe(true);
  });

  it("should count leads by owner", async () => {
    const count = await db.getLeadCountByOwner(testTenantId, "owner1@example.com");
    expect(count).toBeGreaterThanOrEqual(1);
  });

  it("should delete a lead", async () => {
    const database = await db.getDb();
    if (!database) throw new Error("Database not available");

    const { leads } = await import("../drizzle/schema");

    // Create a lead to delete
    const deleteLeadId = nanoid();
    await database.insert(leads).values({
      id: deleteLeadId,
      tenantId: testTenantId,
      source: "amplemarket",
      sourceType: "lead",
      amplemarketLeadId: "amp_delete_test",
      ownerEmail: "owner@example.com",
      email: "delete@example.com",
      firstName: "Delete",
      lastName: "Me",
      syncedAt: new Date(),
    });

    // Verify it exists
    const beforeDelete = await db.getLeadById(testTenantId, deleteLeadId);
    expect(beforeDelete).toBeDefined();

    // Delete it
    await db.deleteLead(testTenantId, deleteLeadId);

    // Verify it's gone
    const afterDelete = await db.getLeadById(testTenantId, deleteLeadId);
    expect(afterDelete).toBeNull();
  });

  it("should enforce tenant isolation", async () => {
    const database = await db.getDb();
    if (!database) throw new Error("Database not available");

    const { leads } = await import("../drizzle/schema");

    // Create another tenant
    const otherTenantId = nanoid();
    await db.createTenant({
      name: "Other Tenant",
      domain: "other.example.com",
    });

    // Create a lead in the other tenant
    const otherLeadId = nanoid();
    await database.insert(leads).values({
      id: otherLeadId,
      tenantId: otherTenantId,
      source: "amplemarket",
      sourceType: "lead",
      amplemarketLeadId: "amp_other_tenant",
      ownerEmail: "owner@example.com",
      email: "other@example.com",
      firstName: "Other",
      lastName: "Tenant",
      syncedAt: new Date(),
    });

    // Try to retrieve it from the test tenant
    const lead = await db.getLeadById(testTenantId, otherLeadId);
    expect(lead).toBeNull();

    // Verify it exists in the other tenant
    const otherLead = await db.getLeadById(otherTenantId, otherLeadId);
    expect(otherLead).toBeDefined();
  });
});

describe("Lead Sync Logic", () => {
  it("should use amplemarketLeadId as external key", async () => {
    const database = await db.getDb();
    if (!database) throw new Error("Database not available");

    const { leads } = await import("../drizzle/schema");
    const { eq, and } = await import("drizzle-orm");

    const testTenantId = nanoid();
    await db.createTenant({
      name: "Sync Test Tenant",
      domain: "sync-test.example.com",
    });

    const amplemarketLeadId = "amp_sync_test_123";

    // First sync: create
    const leadId1 = nanoid();
    await database.insert(leads).values({
      id: leadId1,
      tenantId: testTenantId,
      source: "amplemarket",
      sourceType: "lead",
      amplemarketLeadId,
      ownerEmail: "owner@example.com",
      email: "sync@example.com",
      firstName: "Original",
      lastName: "Name",
      syncedAt: new Date(),
    });

    // Second sync: update (simulating upsert by external key)
    const existing = await database
      .select()
      .from(leads)
      .where(
        and(
          eq(leads.tenantId, testTenantId),
          eq(leads.amplemarketLeadId, amplemarketLeadId)
        )
      )
      .limit(1);

    expect(existing.length).toBe(1);
    expect(existing[0].firstName).toBe("Original");

    // Update the existing lead
    await database
      .update(leads)
      .set({
        firstName: "Updated",
        lastName: "Name",
        syncedAt: new Date(),
      })
      .where(eq(leads.id, existing[0].id));

    // Verify update
    const updated = await db.getLeadById(testTenantId, existing[0].id);
    expect(updated?.firstName).toBe("Updated");
    expect(updated?.amplemarketLeadId).toBe(amplemarketLeadId);
  });
});
