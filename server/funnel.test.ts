import { describe, expect, it } from "vitest";
import { computeFunnelStage, computeVelocity } from "./funnel";
import type { Thread, Moment, NextAction } from "../drizzle/schema";

describe("Funnel Stage Computation", () => {
  const baseThread: Thread = {
    id: "thread-1",
    tenantId: "tenant-1",
    personId: "person-1",
    source: "manual",
    intent: "sales",
    status: "active",
    title: "Test Thread",
    lastActivityAt: new Date(),
    ownerUserId: 1,
    collaboratorUserIds: null,
    visibility: "private",
    dealSignal: null,
    createdAt: new Date(),
  };

  it("should return 'closed_won' for threads with deal_won moment", () => {
    const moments: Moment[] = [
      {
        id: "m1",
        tenantId: "tenant-1",
        threadId: "thread-1",
        personId: "person-1",
        source: "manual",
        type: "deal_won",
        timestamp: new Date(),
        metadata: {},
        createdAt: new Date(),
      },
    ];
    const nextActions: NextAction[] = [];

    const stage = computeFunnelStage(baseThread, moments, nextActions);
    expect(stage).toBe("closed_won");
  });

  it("should return 'closed_lost' for threads with deal_lost moment", () => {
    const moments: Moment[] = [
      {
        id: "m1",
        tenantId: "tenant-1",
        threadId: "thread-1",
        personId: "person-1",
        source: "manual",
        type: "deal_lost",
        timestamp: new Date(),
        metadata: {},
        createdAt: new Date(),
      },
    ];
    const nextActions: NextAction[] = [];

    const stage = computeFunnelStage(baseThread, moments, nextActions);
    expect(stage).toBe("closed_lost");
  });

  it("should return 'waiting' for threads with waiting status", () => {
    const thread = { ...baseThread, status: "waiting" as const };
    const moments: Moment[] = [];
    const nextActions: NextAction[] = [];

    const stage = computeFunnelStage(thread, moments, nextActions);
    expect(stage).toBe("waiting");
  });

  it("should return 'active' for threads with open actions", () => {
    const moments: Moment[] = [
      {
        id: "m1",
        tenantId: "tenant-1",
        threadId: "thread-1",
        personId: "person-1",
        source: "manual",
        type: "email_sent",
        timestamp: new Date(),
        metadata: {},
        createdAt: new Date(),
      },
    ];
    const nextActions: NextAction[] = [
      {
        id: "a1",
        tenantId: "tenant-1",
        threadId: "thread-1",
        actionType: "follow_up",
        triggerType: "date",
        triggerValue: "now+1d",
        status: "open",
        assignedUserId: null,
        dueAt: null,
        createdAt: new Date(),
        completedAt: null,
      },
    ];

    const stage = computeFunnelStage(baseThread, moments, nextActions);
    expect(stage).toBe("active");
  });

  it("should return 'engaged' for threads with replies or meetings", () => {
    const moments: Moment[] = [
      {
        id: "m1",
        tenantId: "tenant-1",
        threadId: "thread-1",
        personId: "person-1",
        source: "manual",
        type: "email_sent",
        timestamp: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000),
        metadata: {},
        createdAt: new Date(),
      },
      {
        id: "m2",
        tenantId: "tenant-1",
        threadId: "thread-1",
        personId: "person-1",
        source: "manual",
        type: "reply_received",
        timestamp: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000),
        metadata: {},
        createdAt: new Date(),
      },
    ];
    const nextActions: NextAction[] = [];

    const stage = computeFunnelStage(baseThread, moments, nextActions);
    expect(stage).toBe("engaged");
  });

  it("should return 'prospected' for threads with only outreach", () => {
    const moments: Moment[] = [
      {
        id: "m1",
        tenantId: "tenant-1",
        threadId: "thread-1",
        personId: "person-1",
        source: "manual",
        type: "email_sent",
        timestamp: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000),
        metadata: {},
        createdAt: new Date(),
      },
    ];
    const nextActions: NextAction[] = [];

    const stage = computeFunnelStage(baseThread, moments, nextActions);
    expect(stage).toBe("prospected");
  });
});

describe("Velocity Computation", () => {
  it("should compute median days from contact to reply", () => {
    const moments: Moment[] = [
      {
        id: "m1",
        tenantId: "tenant-1",
        threadId: "thread-1",
        personId: "person-1",
        source: "manual",
        type: "email_sent",
        timestamp: new Date("2024-01-01"),
        metadata: {},
        createdAt: new Date(),
      },
      {
        id: "m2",
        tenantId: "tenant-1",
        threadId: "thread-1",
        personId: "person-1",
        source: "manual",
        type: "reply_received",
        timestamp: new Date("2024-01-03"), // 2 days later
        metadata: {},
        createdAt: new Date(),
      },
    ];

    const velocity = computeVelocity(moments);
    expect(velocity.median_days_first_contact_to_reply).toBe(2);
  });

  it("should return null for velocity metrics with no data", () => {
    const moments: Moment[] = [];

    const velocity = computeVelocity(moments);
    expect(velocity.median_days_first_contact_to_reply).toBeNull();
    expect(velocity.median_days_reply_to_meeting).toBeNull();
    expect(velocity.median_days_meeting_to_close_signal).toBeNull();
  });
});
