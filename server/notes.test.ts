import { describe, it, expect, beforeAll } from "vitest";
import * as db from "./db";
import { nanoid } from "nanoid";

describe("Notes Feature", () => {
  let tenantId: string;
  let userId: string;
  let contactId: string;

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

    // Create test contact
    const contact = await db.createPerson({
      tenantId,
      fullName: "Test Contact",
      primaryEmail: "contact@test.com",
    });
    contactId = contact.id;
  });

  it("should create a note with user attribution", async () => {
    const note = await db.createNote({
      tenantId,
      content: "This is a test note",
      entityType: "contact",
      entityId: contactId,
      createdBy: userId,
      createdByName: "Test User",
    });

    expect(note).toBeDefined();
    expect(note.content).toBe("This is a test note");
    expect(note.createdBy).toBe(userId);
    expect(note.createdByName).toBe("Test User");
    expect(note.createdAt).toBeDefined();
  });

  it("should update a note and track editor", async () => {
    const note = await db.createNote({
      tenantId,
      content: "Original content",
      entityType: "contact",
      entityId: contactId,
      createdBy: userId,
      createdByName: "Test User",
    });

    const updated = await db.updateNote(
      note.id,
      "Updated content",
      userId,
      "Test User"
    );

    expect(updated.content).toBe("Updated content");
    expect(updated.updatedBy).toBe(userId);
    expect(updated.updatedByName).toBe("Test User");
    expect(updated.updatedAt).toBeDefined();
  });

  it("should retrieve notes by entity", async () => {
    await db.createNote({
      tenantId,
      content: "Note 1",
      entityType: "contact",
      entityId: contactId,
      createdBy: userId,
      createdByName: "Test User",
    });

    await db.createNote({
      tenantId,
      content: "Note 2",
      entityType: "contact",
      entityId: contactId,
      createdBy: userId,
      createdByName: "Test User",
    });

    const notes = await db.getNotesByEntity(tenantId, "contact", contactId);
    expect(notes.length).toBeGreaterThanOrEqual(2);
  });

  it("should delete a note", async () => {
    const note = await db.createNote({
      tenantId,
      content: "To be deleted",
      entityType: "contact",
      entityId: contactId,
      createdBy: userId,
      createdByName: "Test User",
    });

    await db.deleteNote(note.id, tenantId);

    const notes = await db.getNotesByEntity(tenantId, "contact", contactId);
    const deletedNote = notes.find((n: any) => n.id === note.id);
    expect(deletedNote).toBeUndefined();
  });
});
