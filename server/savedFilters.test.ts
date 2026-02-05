import { describe, it, expect, beforeAll } from "vitest";
import * as db from "./db";
import { nanoid } from "nanoid";

describe("Saved Filters Feature", () => {
  let tenantId: string;
  let userId: string;

  beforeAll(async () => {
    // Create test tenant
    tenantId = nanoid();
    await db.createTenant({
      name: "Test Tenant",
      domain: "test.com",
    });

    // Create test user
    const user = await db.createUser({
      tenantId,
      email: "test@test.com",
      passwordHash: "hash",
      name: "Test User",
    });
    userId = user.id;
  });

  it("should create a saved filter", async () => {
    const filter = await db.createSavedFilter({
      tenantId,
      name: "Hot Leads",
      viewType: "contacts",
      filters: { intentTier: "Hot", fitTier: "A" },
      sortBy: "combinedScore",
      sortOrder: "desc",
      createdById: userId,
      isPublic: false,
    });

    expect(filter).toBeDefined();
    expect(filter.name).toBe("Hot Leads");
    expect(filter.viewType).toBe("contacts");
    expect(filter.filters).toEqual({ intentTier: "Hot", fitTier: "A" });
  });

  it("should retrieve saved filters for a user", async () => {
    await db.createSavedFilter({
      tenantId,
      name: "My Deals",
      viewType: "deals",
      filters: { stage: "negotiation" },
      createdById: userId,
      isPublic: false,
    });

    const filters = await db.getSavedFilters(tenantId, userId, "deals");
    expect(filters.length).toBeGreaterThanOrEqual(1);
    const myDealsFilter = filters.find((f: any) => f.name === "My Deals");
    expect(myDealsFilter).toBeDefined();
  });

  it("should update a saved filter", async () => {
    const filter = await db.createSavedFilter({
      tenantId,
      name: "Original Name",
      viewType: "contacts",
      filters: { status: "active" },
      createdById: userId,
    });

    const updated = await db.updateSavedFilter(filter.id, tenantId, {
      name: "Updated Name",
      filters: { status: "active", tier: "A" },
    });

    expect(updated.name).toBe("Updated Name");
    expect(updated.filters).toEqual({ status: "active", tier: "A" });
  });

  it("should delete a saved filter", async () => {
    const filter = await db.createSavedFilter({
      tenantId,
      name: "To Delete",
      viewType: "contacts",
      filters: {},
      createdById: userId,
    });

    await db.deleteSavedFilter(filter.id, tenantId);

    const filters = await db.getSavedFilters(tenantId, userId);
    const deletedFilter = filters.find((f: any) => f.id === filter.id);
    expect(deletedFilter).toBeUndefined();
  });

  it("should share public filters with team", async () => {
    const publicFilter = await db.createSavedFilter({
      tenantId,
      name: "Team Filter",
      viewType: "contacts",
      filters: { teamVisible: true },
      createdById: userId,
      isPublic: true,
    });

    // Create another user in the same tenant
    const otherUser = await db.createUser({
      tenantId,
      email: "other@test.com",
      passwordHash: "hash",
      name: "Other User",
    });

    // Other user should see the public filter
    const filters = await db.getSavedFilters(tenantId, otherUser.id);
    const sharedFilter = filters.find((f: any) => f.id === publicFilter.id);
    expect(sharedFilter).toBeDefined();
    expect(sharedFilter.name).toBe("Team Filter");
  });
});
