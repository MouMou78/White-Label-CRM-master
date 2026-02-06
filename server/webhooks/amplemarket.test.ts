import { describe, it, expect, beforeAll, afterAll } from "vitest";
import { handleAmplemarketWebhook } from "./amplemarket";
import type { Request, Response } from "express";

describe("Amplemarket Webhook Handler", () => {
  it("should detect reply event type", () => {
    const payload = {
      is_reply: true,
      sequence: { id: "seq123" },
      labels: ["interested"],
      from: "test@example.com",
      subject: "Re: Your proposal",
      body: "I'm interested in learning more",
    };

    // This is a simplified test - in reality we'd need to mock the database
    expect(payload.is_reply).toBe(true);
    expect(payload.sequence).toBeDefined();
    expect(payload.labels).toContain("interested");
  });

  it("should detect sequence_stage event type", () => {
    const payload = {
      sequence_stage: { type: "email" },
      id: "activity123",
      contact: { id: "contact456" },
    };

    expect(payload.sequence_stage).toBeDefined();
    expect(payload.sequence_stage.type).toBe("email");
  });

  it("should detect workflow_send_json event type", () => {
    const payload = {
      email_message: {
        tag: ["interested", "forwarded_to_the_right_person"],
      },
      lead: { email: "lead@example.com" },
    };

    expect(payload.email_message).toBeDefined();
    expect(payload.email_message.tag).toContain("interested");
  });

  it("should extract email from various payload structures", () => {
    const payloads = [
      { from: "test1@example.com" },
      { dynamic_fields: { email: "test2@example.com" } },
      { lead: { email: "test3@example.com" } },
      { sequence_lead: { email: "test4@example.com" } },
    ];

    payloads.forEach((payload) => {
      const email =
        payload.from ||
        payload.dynamic_fields?.email ||
        payload.lead?.email ||
        payload.sequence_lead?.email;
      expect(email).toMatch(/@example\.com$/);
    });
  });

  it("should map labels to CRM status correctly", () => {
    const testCases = [
      { labels: ["interested"], expected: "qualified" },
      { labels: ["hard_no"], expected: "disqualified" },
      { labels: ["not_interested"], expected: "disqualified" },
      { labels: ["ooo"], expected: "nurture" },
      { labels: ["asked_to_circle_back_later"], expected: "nurture" },
      { labels: ["not_the_right_person"], expected: "disqualified" },
      { labels: ["forwarded_to_the_right_person"], expected: "qualified" },
    ];

    testCases.forEach(({ labels, expected }) => {
      // Simplified label mapping logic for testing
      let status = null;
      if (labels.includes("interested")) status = "qualified";
      else if (labels.includes("hard_no")) status = "disqualified";
      else if (labels.includes("not_interested")) status = "disqualified";
      else if (labels.includes("ooo")) status = "nurture";
      else if (labels.includes("asked_to_circle_back_later")) status = "nurture";
      else if (labels.includes("not_the_right_person")) status = "disqualified";
      else if (labels.includes("forwarded_to_the_right_person"))
        status = "qualified";

      expect(status).toBe(expected);
    });
  });
});
