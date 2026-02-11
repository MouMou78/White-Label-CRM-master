import { describe, it, expect, beforeEach } from "vitest";
import { appRouter } from "./routers";
import * as db from "./db";

describe("Calendar Booking Feature", () => {
  const mockContext = {
    user: {
      id: "test-user-1",
      tenantId: "test-tenant-1",
      email: "sdr@test.com",
      name: "Test SDR",
      role: "user" as const,
    },
  };

  const caller = appRouter.createCaller(mockContext);

  describe("listManagers endpoint", () => {
    it("should return users with admin or owner roles", async () => {
      const result = await caller.calendar.listManagers();
      expect(result).toBeDefined();
      expect(Array.isArray(result)).toBe(true);
    });
  });

  describe("getAvailability endpoint", () => {
    it("should return available time slots for a given date", async () => {
      const result = await caller.calendar.getAvailability({
        salesManagerId: "manager-1",
        date: "2026-02-15",
      });

      expect(result).toBeDefined();
      expect(result.slots).toBeDefined();
      expect(Array.isArray(result.slots)).toBe(true);
      expect(result.existingBookings).toBeDefined();
      
      // Check that slots have correct structure
      if (result.slots.length > 0) {
        const slot = result.slots[0];
        expect(slot).toHaveProperty("time");
        expect(slot).toHaveProperty("available");
        expect(typeof slot.time).toBe("string");
        expect(typeof slot.available).toBe("boolean");
      }
    });

    it("should generate slots from 9 AM to 5 PM", async () => {
      const result = await caller.calendar.getAvailability({
        salesManagerId: "manager-1",
        date: "2026-02-15",
      });

      const times = result.slots.map(s => s.time);
      expect(times[0]).toBe("09:00");
      // Last slot should be before 5 PM
      const lastTime = times[times.length - 1];
      const [hours] = lastTime.split(":").map(Number);
      expect(hours).toBeLessThan(17);
    });

    it("should mark slots as unavailable when there are existing bookings", async () => {
      // First, book a demo
      await caller.calendar.bookDemo({
        salesManagerId: "manager-1",
        date: "2026-02-15",
        time: "10:00",
        title: "Test Demo",
        description: "Test booking",
      });

      // Then check availability
      const result = await caller.calendar.getAvailability({
        salesManagerId: "manager-1",
        date: "2026-02-15",
      });

      // The 10:00 slot should be unavailable
      const slot10am = result.slots.find(s => s.time === "10:00");
      expect(slot10am?.available).toBe(false);
    });
  });

  describe("bookDemo endpoint", () => {
    it("should create a demo booking with all required fields", async () => {
      const result = await caller.calendar.bookDemo({
        salesManagerId: "manager-1",
        date: "2026-02-20",
        time: "14:00",
        title: "Product Demo",
        description: "Demo for new client",
      });

      expect(result).toBeDefined();
      expect(result.id).toBeDefined();
      expect(result.salesManagerId).toBe("manager-1");
      expect(result.bookedByUserId).toBe(mockContext.user.id);
      expect(result.title).toBe("Product Demo");
      expect(result.meetLink).toBeDefined();
      expect(result.meetLink).toContain("https://meet.google.com/");
    });

    it("should generate a valid Google Meet link", async () => {
      const result = await caller.calendar.bookDemo({
        salesManagerId: "manager-1",
        date: "2026-02-20",
        time: "15:00",
        title: "Sales Demo",
      });

      expect(result.meetLink).toMatch(/^https:\/\/meet\.google\.com\/[a-z0-9]{3}-[a-z0-9]{4}-[a-z0-9]{3}$/);
    });

    it("should set correct start and end times (30-minute duration)", async () => {
      const result = await caller.calendar.bookDemo({
        salesManagerId: "manager-1",
        date: "2026-02-20",
        time: "11:00",
        title: "Demo",
      });

      const startTime = new Date(result.startTime);
      const endTime = new Date(result.endTime);
      const durationMinutes = (endTime.getTime() - startTime.getTime()) / (1000 * 60);
      
      expect(durationMinutes).toBe(30);
      expect(startTime.getHours()).toBe(11);
      expect(startTime.getMinutes()).toBe(0);
      expect(endTime.getHours()).toBe(11);
      expect(endTime.getMinutes()).toBe(30);
    });
  });
});
