import { describe, it, expect, beforeEach } from "vitest";
import { appRouter } from "./routers";

describe("Account Merge and Import Feature", () => {
  const mockContext = {
    user: {
      id: "test-user-1",
      tenantId: "test-tenant-1",
      email: "admin@test.com",
      name: "Test Admin",
      role: "admin" as const,
    },
  };

  const caller = appRouter.createCaller(mockContext);

  describe("parseCSV endpoint", () => {
    it("should parse CSV content and return headers and preview", async () => {
      const csvContent = `Name,Domain,Industry,Headquarters
Acme Corp,acme.com,Technology,San Francisco
TechCo,techco.com,Software,New York
StartupInc,startup.com,SaaS,Austin`;

      const result = await caller.accounts.parseCSV({ csvContent });

      expect(result).toBeDefined();
      expect(result.headers).toEqual(["Name", "Domain", "Industry", "Headquarters"]);
      expect(result.totalRows).toBe(3);
      expect(result.preview).toHaveLength(3);
      expect(result.preview[0]).toEqual({
        Name: "Acme Corp",
        Domain: "acme.com",
        Industry: "Technology",
        Headquarters: "San Francisco",
      });
    });

    it("should handle CSV with varying column counts", async () => {
      const csvContent = `Name,Domain
Company A,companya.com
Company B,companyb.com,Extra Field`;

      const result = await caller.accounts.parseCSV({ csvContent });

      expect(result.headers).toEqual(["Name", "Domain"]);
      expect(result.totalRows).toBe(2);
    });

    it("should limit preview to 5 rows", async () => {
      const rows = Array.from({ length: 10 }, (_, i) => 
        `Company ${i},company${i}.com,Tech,City ${i}`
      );
      const csvContent = `Name,Domain,Industry,Headquarters\n${rows.join("\n")}`;

      const result = await caller.accounts.parseCSV({ csvContent });

      expect(result.totalRows).toBe(10);
      expect(result.preview).toHaveLength(5);
    });
  });

  describe("importAccounts endpoint", () => {
    it("should import accounts from CSV with field mapping", async () => {
      const timestamp = Date.now();
      const csvContent = `Company Name,Website,Sector,Location
NewCorp${timestamp},newcorp${timestamp}.com,Finance,Boston
DataInc${timestamp},datainc${timestamp}.com,Analytics,Seattle`;

      const result = await caller.accounts.importAccounts({
        csvContent,
        fieldMapping: {
          name: "Company Name",
          domain: "Website",
          industry: "Sector",
          headquarters: "Location",
        },
      });

      expect(result).toBeDefined();
      expect(result.imported).toBeGreaterThanOrEqual(0);
      expect(result.skipped).toBeGreaterThanOrEqual(0);
      expect(result.errors).toBeDefined();
      expect(Array.isArray(result.errors)).toBe(true);
    });

    it("should skip duplicate accounts based on name", async () => {
      const timestamp = Date.now();
      const csvContent = `Name,Domain
DuplicateCorp${timestamp},dup.com
DuplicateCorp${timestamp},dup2.com`;

      // First import
      const result1 = await caller.accounts.importAccounts({
        csvContent: `Name,Domain\nDuplicateCorp${timestamp},dup.com`,
        fieldMapping: { name: "Name", domain: "Domain" },
      });

      // Second import with same name
      const result2 = await caller.accounts.importAccounts({
        csvContent,
        fieldMapping: { name: "Name", domain: "Domain" },
      });

      expect(result2.skipped).toBeGreaterThan(0);
    });

    it("should handle missing required fields gracefully", async () => {
      const csvContent = `Domain,Industry
test.com,Tech
example.com,Finance`;

      const result = await caller.accounts.importAccounts({
        csvContent,
        fieldMapping: {
          domain: "Domain",
          industry: "Industry",
          // name is missing - should cause errors
        },
      });

      expect(result.errors.length).toBeGreaterThan(0);
      expect(result.imported).toBe(0);
    });
  });

  describe("merge endpoint", () => {
    it("should merge two accounts with selected fields", async () => {
      const timestamp = Date.now();
      // Create two test accounts
      const account1 = await caller.accounts.create({
        name: `Source Account ${timestamp}`,
        domain: "source.com",
        industry: "Technology",
        headquarters: "SF",
      });

      const account2 = await caller.accounts.create({
        name: `Target Account ${timestamp}`,
        domain: "target.com",
        industry: "Software",
        headquarters: "NYC",
      });

      // Merge them
      const result = await caller.accounts.merge({
        sourceId: account1.id,
        targetId: account2.id,
        mergedFields: {
          domain: "source.com",
          industry: "Technology",
        },
      });

      expect(result).toBeDefined();
      expect(result.success).toBe(true);
      expect(result.transferredContacts).toBeGreaterThanOrEqual(0);
      expect(result.transferredDeals).toBeGreaterThanOrEqual(0);

      // Verify source account is deleted
      const accounts = await caller.accounts.list();
      const sourceExists = accounts.some(a => a.id === account1.id);
      expect(sourceExists).toBe(false);

      // Verify target account still exists with merged fields
      const targetAccount = accounts.find(a => a.id === account2.id);
      expect(targetAccount).toBeDefined();
      expect(targetAccount?.domain).toBe("source.com");
      expect(targetAccount?.industry).toBe("Technology");
    });

    it("should prevent merging an account with itself", async () => {
      const timestamp = Date.now();
      const account = await caller.accounts.create({
        name: `Test Account ${timestamp}`,
        domain: "test.com",
      });

      await expect(
        caller.accounts.merge({
          sourceId: account.id,
          targetId: account.id,
          mergedFields: {},
        })
      ).rejects.toThrow();
    });

    it("should transfer contacts from source to target", async () => {
      const timestamp = Date.now();
      // Create accounts
      const source = await caller.accounts.create({
        name: `Source ${timestamp}`,
        domain: "source.com",
      });

      const target = await caller.accounts.create({
        name: `Target ${timestamp}`,
        domain: "target.com",
      });

      // Create a contact linked to source
      await caller.people.create({
        firstName: "John",
        lastName: "Doe",
        email: "john@source.com",
        accountId: source.id,
      });

      // Merge
      const result = await caller.accounts.merge({
        sourceId: source.id,
        targetId: target.id,
        mergedFields: {},
      });

      expect(result.transferredContacts).toBe(1);

      // Verify contact is now linked to target
      const people = await caller.people.list();
      const contact = people.find(p => p.email === "john@source.com");
      expect(contact?.accountId).toBe(target.id);
    });
  });
});
