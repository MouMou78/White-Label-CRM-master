import { describe, it, expect } from "vitest";
import {
  calculateFitScore,
  calculateIntentScore,
  calculateCombinedScore,
  calculateFitTier,
  calculateIntentTier,
  scoreContact,
} from "./lead-scoring";
import type { Person, Account } from "../drizzle/schema";

describe("Lead Scoring Engine", () => {
  describe("calculateFitScore", () => {
    it("should score target industry correctly", () => {
      const person: Partial<Person> = {};
      const account: Partial<Account> = {
        industry: "SaaS",
      };

      const { score, reasons } = calculateFitScore(person, account);
      
      expect(score).toBe(25);
      expect(reasons).toContain("Target industry");
    });

    it("should score ideal company size correctly", () => {
      const person: Partial<Person> = {};
      const account: Partial<Account> = {
        employees: "201-500",
      };

      const { score, reasons } = calculateFitScore(person, account);
      
      expect(score).toBe(20);
      expect(reasons).toContain("Ideal company size");
    });

    it("should score decision maker seniority correctly", () => {
      const person: Partial<Person> = {
        seniority: "C-Level",
      };
      const account: Partial<Account> = {};

      const { score, reasons } = calculateFitScore(person, account);
      
      expect(score).toBe(15);
      expect(reasons).toContain("Decision maker seniority");
    });

    it("should score priority region correctly", () => {
      const person: Partial<Person> = {
        region: "UK&I",
      };
      const account: Partial<Account> = {};

      const { score, reasons } = calculateFitScore(person, account);
      
      expect(score).toBe(10);
      expect(reasons).toContain("Priority region");
    });

    it("should combine multiple fit criteria", () => {
      const person: Partial<Person> = {
        seniority: "VP",
        region: "North America",
      };
      const account: Partial<Account> = {
        industry: "Technology",
        employees: "51-200",
      };

      const { score, reasons } = calculateFitScore(person, account);
      
      expect(score).toBe(70); // 25 + 20 + 15 + 10
      expect(reasons).toHaveLength(4);
    });

    it("should cap score at 100", () => {
      const person: Partial<Person> = {
        seniority: "C-Level",
        region: "UK&I",
      };
      const account: Partial<Account> = {
        industry: "SaaS",
        employees: "201-500",
      };

      const { score } = calculateFitScore(person, account);
      
      expect(score).toBeLessThanOrEqual(100);
    });
  });

  describe("calculateIntentScore", () => {
    it("should score recent events correctly", () => {
      const now = new Date();
      const events = [
        { type: "website.pricing_view", timestamp: now },
        { type: "website.demo_view", timestamp: now },
      ];

      const { score } = calculateIntentScore(events);
      
      expect(score).toBe(14); // 8 + 6
    });

    it("should apply decay to old events", () => {
      const now = new Date();
      const oldDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000); // 30 days ago
      
      const events = [
        { type: "website.pricing_view", timestamp: oldDate },
      ];

      const { score } = calculateIntentScore(events);
      
      expect(score).toBeLessThan(8); // Should be less than full points due to decay
      expect(score).toBeGreaterThan(0); // But not zero
    });

    it("should return 0 for no events", () => {
      const { score } = calculateIntentScore([]);
      
      expect(score).toBe(0);
    });

    it("should cap score at 100", () => {
      const now = new Date();
      const manyEvents = Array(100).fill(null).map(() => ({
        type: "sales.meeting_booked",
        timestamp: now,
      }));

      const { score } = calculateIntentScore(manyEvents);
      
      expect(score).toBe(100);
    });
  });

  describe("calculateCombinedScore", () => {
    it("should weight fit 60% and intent 40%", () => {
      const combined = calculateCombinedScore(100, 100);
      expect(combined).toBe(100);
    });

    it("should calculate weighted average correctly", () => {
      const combined = calculateCombinedScore(80, 50);
      expect(combined).toBe(68); // 80 * 0.6 + 50 * 0.4 = 48 + 20 = 68
    });

    it("should round to nearest integer", () => {
      const combined = calculateCombinedScore(75, 75);
      expect(combined).toBe(75);
    });
  });

  describe("calculateFitTier", () => {
    it("should assign tier A for score >= 70", () => {
      expect(calculateFitTier(70)).toBe("A");
      expect(calculateFitTier(85)).toBe("A");
      expect(calculateFitTier(100)).toBe("A");
    });

    it("should assign tier B for score >= 40 and < 70", () => {
      expect(calculateFitTier(40)).toBe("B");
      expect(calculateFitTier(55)).toBe("B");
      expect(calculateFitTier(69)).toBe("B");
    });

    it("should assign tier C for score < 40", () => {
      expect(calculateFitTier(0)).toBe("C");
      expect(calculateFitTier(25)).toBe("C");
      expect(calculateFitTier(39)).toBe("C");
    });
  });

  describe("calculateIntentTier", () => {
    it("should assign Hot for score >= 60", () => {
      expect(calculateIntentTier(60)).toBe("Hot");
      expect(calculateIntentTier(75)).toBe("Hot");
      expect(calculateIntentTier(100)).toBe("Hot");
    });

    it("should assign Warm for score >= 25 and < 60", () => {
      expect(calculateIntentTier(25)).toBe("Warm");
      expect(calculateIntentTier(40)).toBe("Warm");
      expect(calculateIntentTier(59)).toBe("Warm");
    });

    it("should assign Cold for score < 25", () => {
      expect(calculateIntentTier(0)).toBe("Cold");
      expect(calculateIntentTier(15)).toBe("Cold");
      expect(calculateIntentTier(24)).toBe("Cold");
    });
  });

  describe("scoreContact", () => {
    it("should calculate all scores for a contact", async () => {
      const person: Partial<Person> = {
        seniority: "Director",
        region: "Western Europe",
      };
      const account: Partial<Account> = {
        industry: "B2B Software",
        employees: "501-1000",
      };
      const events = [
        { type: "website.pricing_view", timestamp: new Date() },
        { type: "marketing.email_click", timestamp: new Date() },
      ];

      const scores = await scoreContact(person, account, events);

      expect(scores.fitScore).toBe(70); // 25 + 20 + 15 + 10
      expect(scores.intentScore).toBe(13); // 8 + 5
      expect(scores.combinedScore).toBe(47); // 70 * 0.6 + 13 * 0.4 = 42 + 5.2 = 47
      expect(scores.fitTier).toBe("A");
      expect(scores.intentTier).toBe("Cold");
      expect(scores.scoreReasons.length).toBeGreaterThan(0);
    });

    it("should handle contact with no account", async () => {
      const person: Partial<Person> = {
        seniority: "Manager",
      };

      const scores = await scoreContact(person, null, []);

      expect(scores.fitScore).toBe(0); // No fit criteria matched
      expect(scores.intentScore).toBe(0); // No events
      expect(scores.combinedScore).toBe(0);
      expect(scores.fitTier).toBe("C");
      expect(scores.intentTier).toBe("Cold");
    });
  });
});
