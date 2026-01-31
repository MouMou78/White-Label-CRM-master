import axios from "axios";
import { getDb } from "./db";
import { integrations, people, threads, moments } from "../drizzle/schema";
import { eq, and } from "drizzle-orm";
import { nanoid } from "nanoid";

const APOLLO_API_BASE = "https://api.apollo.io/v1";

interface ApolloContact {
  id: string;
  first_name: string;
  last_name: string;
  email: string;
  title: string;
  organization_name: string;
  linkedin_url?: string;
  phone_numbers?: Array<{ raw_number: string }>;
}

interface ApolloEngagement {
  id: string;
  type: "email" | "call" | "sequence";
  contact_id: string;
  subject?: string;
  body?: string;
  occurred_at: string;
}

export async function connectApollo(tenantId: string, apiKey: string) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  // Verify API key by making a test request
  try {
    await axios.get(`${APOLLO_API_BASE}/auth/health`, {
      headers: { "X-Api-Key": apiKey },
    });
  } catch (error) {
    throw new Error("Invalid Apollo API key");
  }

  // Store integration
  await db.insert(integrations).values({
    id: nanoid(),
    tenantId,
    provider: "apollo",
    status: "connected",
    config: { apiKey },
    lastSyncedAt: new Date(),
  }).onDuplicateKeyUpdate({
    set: {
      status: "connected",
      config: { apiKey },
      lastSyncedAt: new Date(),
    },
  });

  return { success: true };
}

export async function syncApolloContacts(tenantId: string) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  // Get integration
  const [integration] = await db
    .select()
    .from(integrations)
    .where(and(eq(integrations.tenantId, tenantId), eq(integrations.provider, "apollo")))
    .limit(1);

  if (!integration || integration.status !== "connected") {
    throw new Error("Apollo integration not connected");
  }

  const apiKey = (integration.config as any)?.apiKey;
  if (!apiKey) throw new Error("Apollo API key not found");

  // Fetch contacts from Apollo
  const response = await axios.post(
    `${APOLLO_API_BASE}/contacts/search`,
    {
      per_page: 100,
      page: 1,
    },
    {
      headers: { "X-Api-Key": apiKey, "Content-Type": "application/json" },
    }
  );

  const contacts: ApolloContact[] = response.data.contacts || [];
  let syncedCount = 0;

  for (const contact of contacts) {
    // Check if person already exists
    const [existingPerson] = await db
      .select()
      .from(people)
      .where(and(eq(people.tenantId, tenantId), eq(people.primaryEmail, contact.email)))
      .limit(1);

    if (!existingPerson) {
      // Create new person
      await db.insert(people).values({
        id: nanoid(),
        tenantId,
        fullName: `${contact.first_name} ${contact.last_name}`.trim(),
        primaryEmail: contact.email,
        companyName: contact.organization_name,
        roleTitle: contact.title,
        phone: contact.phone_numbers?.[0]?.raw_number,
        tags: ["apollo"],
        enrichmentSource: "apollo",
        enrichmentSnapshot: {
          apolloId: contact.id,
          ...contact,
        },
      });
      syncedCount++;
    }
  }

  // Update last synced timestamp
  await db
    .update(integrations)
    .set({ lastSyncedAt: new Date() })
    .where(and(eq(integrations.tenantId, tenantId), eq(integrations.provider, "apollo")));

  return { syncedCount, totalContacts: contacts.length };
}

export async function enrichPersonWithApollo(tenantId: string, personId: string) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  // Get integration
  const [integration] = await db
    .select()
    .from(integrations)
    .where(and(eq(integrations.tenantId, tenantId), eq(integrations.provider, "apollo")))
    .limit(1);

  if (!integration || integration.status !== "connected") {
    throw new Error("Apollo integration not connected");
  }

  const apiKey = (integration.config as any)?.apiKey;
  if (!apiKey) throw new Error("Apollo API key not found");

  // Get person
  const [person] = await db
    .select()
    .from(people)
    .where(and(eq(people.tenantId, tenantId), eq(people.id, personId)))
    .limit(1);

  if (!person) throw new Error("Person not found");

  // Search for person in Apollo
  const response = await axios.post(
    `${APOLLO_API_BASE}/people/match`,
    {
      email: person.primaryEmail,
    },
    {
      headers: { "X-Api-Key": apiKey, "Content-Type": "application/json" },
    }
  );

  const apolloData = response.data.person;
  if (!apolloData) {
    throw new Error("Person not found in Apollo");
  }

  // Update person with enriched data
  await db
    .update(people)
    .set({
      roleTitle: apolloData.title || person.roleTitle,
      companyName: apolloData.organization_name || person.companyName,
      phone: apolloData.phone_numbers?.[0]?.raw_number || person.phone,
      enrichmentSource: "apollo",
      enrichmentSnapshot: {
        ...(person.enrichmentSnapshot as any),
        apollo: apolloData,
      },
      enrichmentLastSyncedAt: new Date(),
    })
    .where(and(eq(people.tenantId, tenantId), eq(people.id, personId)));

  return { success: true, enrichedData: apolloData };
}
