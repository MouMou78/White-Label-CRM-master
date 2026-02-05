import { describe, it, expect, beforeEach, vi } from "vitest";
import { enrichContact, batchEnrichContacts, needsEnrichment } from "./enrichment";
import * as db from "./db";

// Mock the database module
vi.mock("./db", () => ({
  getDb: vi.fn(),
}));

describe("Contact Enrichment Service", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("needsEnrichment", () => {
    it("should return true if contact is missing key fields", () => {
      const person = {
        id: "test-1",
        primaryEmail: "test@example.com",
        roleTitle: null,
        companyName: null,
        linkedinUrl: null,
      };

      expect(needsEnrichment(person)).toBe(true);
    });

    it("should return false if contact has all key fields", () => {
      const person = {
        id: "test-1",
        primaryEmail: "test@example.com",
        roleTitle: "Software Engineer",
        companyName: "Example Corp",
        linkedinUrl: "https://linkedin.com/in/test",
      };

      expect(needsEnrichment(person)).toBe(false);
    });

    it("should return false if recently enriched (within 30 days)", () => {
      const person = {
        id: "test-1",
        primaryEmail: "test@example.com",
        roleTitle: null,
        companyName: null,
        linkedinUrl: null,
        enrichmentLastSyncedAt: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000), // 10 days ago
        enrichmentSource: "auto",
      };

      expect(needsEnrichment(person)).toBe(false);
    });

    it("should return true if enrichment is outdated (over 30 days)", () => {
      const person = {
        id: "test-1",
        primaryEmail: "test@example.com",
        roleTitle: null,
        companyName: null,
        linkedinUrl: null,
        enrichmentLastSyncedAt: new Date(Date.now() - 35 * 24 * 60 * 60 * 1000), // 35 days ago
        enrichmentSource: "auto",
      };

      expect(needsEnrichment(person)).toBe(true);
    });

    it("should return false if enrichment failed recently (within 24 hours)", () => {
      const person = {
        id: "test-1",
        primaryEmail: "test@example.com",
        roleTitle: null,
        companyName: null,
        linkedinUrl: null,
        enrichmentLastSyncedAt: new Date(Date.now() - 5 * 60 * 60 * 1000), // 5 hours ago
        enrichmentSource: "failed",
      };

      expect(needsEnrichment(person)).toBe(false);
    });

    it("should return true if enrichment failed over 24 hours ago", () => {
      const person = {
        id: "test-1",
        primaryEmail: "test@example.com",
        roleTitle: null,
        companyName: null,
        linkedinUrl: null,
        enrichmentLastSyncedAt: new Date(Date.now() - 30 * 60 * 60 * 1000), // 30 hours ago
        enrichmentSource: "failed",
      };

      expect(needsEnrichment(person)).toBe(true);
    });
  });

  describe("enrichContact", () => {
    it("should enrich contact with mock data for known domains", async () => {
      const mockDb = {
        update: vi.fn().mockReturnValue({
          set: vi.fn().mockReturnValue({
            where: vi.fn().mockResolvedValue(undefined),
          }),
        }),
      };

      vi.mocked(db.getDb).mockResolvedValue(mockDb as any);

      const result = await enrichContact("test-1", "john@google.com");

      expect(result.success).toBe(true);
      expect(result.enrichedFields).toContain("roleTitle");
      expect(result.enrichedFields).toContain("companyName");
      expect(result.data?.companyName).toBe("Google");
      expect(result.data?.roleTitle).toBe("Software Engineer");
    });

    it("should enrich contact with generic data for unknown domains", async () => {
      const mockDb = {
        update: vi.fn().mockReturnValue({
          set: vi.fn().mockReturnValue({
            where: vi.fn().mockResolvedValue(undefined),
          }),
        }),
      };

      vi.mocked(db.getDb).mockResolvedValue(mockDb as any);

      const result = await enrichContact("test-1", "john@unknowncompany.com");

      expect(result.success).toBe(true);
      expect(result.enrichedFields).toContain("roleTitle");
      expect(result.enrichedFields).toContain("companyName");
      expect(result.data?.companyName).toBe("Unknowncompany");
      expect(result.data?.roleTitle).toBe("Professional");
    });

    it("should handle enrichment errors gracefully", async () => {
      vi.mocked(db.getDb).mockResolvedValue(null);

      const result = await enrichContact("test-1", "john@example.com");

      expect(result.success).toBe(false);
      expect(result.error).toBeDefined();
    });
  });

  describe("batchEnrichContacts", () => {
    it("should enrich multiple contacts", async () => {
      const mockDb = {
        select: vi.fn().mockReturnValue({
          from: vi.fn().mockReturnValue({
            where: vi.fn().mockReturnValue({
              limit: vi.fn()
                .mockResolvedValueOnce([{ id: "test-1", primaryEmail: "john@google.com" }])
                .mockResolvedValueOnce([{ id: "test-2", primaryEmail: "jane@microsoft.com" }]),
            }),
          }),
        }),
        update: vi.fn().mockReturnValue({
          set: vi.fn().mockReturnValue({
            where: vi.fn().mockResolvedValue(undefined),
          }),
        }),
      };

      vi.mocked(db.getDb).mockResolvedValue(mockDb as any);

      const result = await batchEnrichContacts(["test-1", "test-2"]);

      expect(result.total).toBe(2);
      expect(result.successful).toBe(2);
      expect(result.failed).toBe(0);
      expect(result.results).toHaveLength(2);
    });

    it("should handle contacts without email", async () => {
      const mockDb = {
        select: vi.fn().mockReturnValue({
          from: vi.fn().mockReturnValue({
            where: vi.fn().mockReturnValue({
              limit: vi.fn().mockResolvedValueOnce([{ id: "test-1", primaryEmail: null }]),
            }),
          }),
        }),
      };

      vi.mocked(db.getDb).mockResolvedValue(mockDb as any);

      const result = await batchEnrichContacts(["test-1"]);

      expect(result.total).toBe(1);
      expect(result.successful).toBe(0);
      expect(result.failed).toBe(1);
      expect(result.results[0].error).toBe("No email found");
    });

    it("should handle database unavailability", async () => {
      vi.mocked(db.getDb).mockResolvedValue(null);

      const result = await batchEnrichContacts(["test-1"]);

      expect(result.total).toBe(1);
      expect(result.successful).toBe(0);
      expect(result.failed).toBe(1);
      expect(result.results[0].error).toBe("Database not available");
    });
  });
});
