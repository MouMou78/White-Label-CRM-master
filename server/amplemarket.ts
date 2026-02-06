import axios from "axios";
import { nanoid } from "nanoid";
import { accounts, people, integrations } from "../drizzle/schema";
import { eq, and } from "drizzle-orm";

const AMPLEMARKET_API_BASE = "https://api.amplemarket.com";

/**
 * Create or update account from contact company data
 */
async function syncAccountFromContact(db: any, tenantId: string, contact: any): Promise<string | null> {
  // Skip if no company domain
  if (!contact.company_domain) {
    return null;
  }

  try {
    // Check if account already exists by domain
    const [existingAccount] = await db
      .select()
      .from(accounts)
      .where(and(
        eq(accounts.tenantId, tenantId),
        eq(accounts.domain, contact.company_domain)
      ))
      .limit(1);

    const accountData = {
      name: contact.company_name || contact.company_domain,
      domain: contact.company_domain,
      industry: contact.industry || null,
      employees: contact.company_size ? parseInt(contact.company_size) : null,
      revenue: null,
      technologies: null,
      headquarters: contact.location || null,
      foundingYear: null,
      lastFundingRound: null,
      firstContacted: null,
      linkedinUrl: contact.company_linkedin_url || null,
      enrichmentSource: "amplemarket",
      enrichmentSnapshot: {
        company_name: contact.company_name,
        company_domain: contact.company_domain,
        industry: contact.industry,
        company_size: contact.company_size,
        location: contact.location,
      },
      updatedAt: new Date(),
    };

    if (existingAccount) {
      // Update existing account
      await db
        .update(accounts)
        .set(accountData)
        .where(eq(accounts.id, existingAccount.id));
      return existingAccount.id;
    } else {
      // Create new account
      const accountId = nanoid();
      await db.insert(accounts).values({
        id: accountId,
        tenantId,
        ...accountData,
        createdAt: new Date(),
      });
      return accountId;
    }
  } catch (error: any) {
    console.error("Error syncing account from contact:", error.message);
    return null;
  }
}

/**
 * Sync contacts from Amplemarket lead lists
 */
export async function syncAmplemarketContacts(db: any, tenantId: string, apiKey: string, selectedListIds: string[] = []) {
  let totalSyncedCount = 0;
  
  // If no lists selected, fetch all lists
  if (selectedListIds.length === 0) {
    const listsUrl = `${AMPLEMARKET_API_BASE}/lead-lists`;
    console.log("[Amplemarket Sync] Fetching all lists:", { url: listsUrl });
    
    const listsResponse = await axios.get(listsUrl, {
      headers: { "Authorization": `Bearer ${apiKey}` },
    });
    
    selectedListIds = listsResponse.data.lead_lists?.map((list: any) => list.id) || [];
    console.log("[Amplemarket Sync] Found lists:", { count: selectedListIds.length });
  }
  
  // Fetch contacts from each selected list
  for (const listId of selectedListIds) {
    const requestUrl = `${AMPLEMARKET_API_BASE}/lead-lists/${listId}`;
    console.log("[Amplemarket Sync] Fetching list:", {
      url: requestUrl,
      method: "GET",
      listId,
      hasApiKey: !!apiKey
    });
    
    try {
      const response = await axios.get(requestUrl, {
        headers: { "Authorization": `Bearer ${apiKey}` },
      });
      
      console.log("[Amplemarket Sync] List Response:", {
        status: response.status,
        listName: response.data?.name,
        leadsCount: response.data?.leads?.length || 0
      });

      const leadsList = response.data.leads || [];
      
      for (const lead of leadsList) {
        // Skip if no email
        if (!lead.email) continue;
        
        // Check if person already exists by email
        const [existingPerson] = await db
          .select()
          .from(people)
          .where(and(
            eq(people.tenantId, tenantId),
            eq(people.primaryEmail, lead.email)
          ))
          .limit(1);

        // Create or update account from lead company data
        const accountId = await syncAccountFromContact(db, tenantId, lead);

        const personData = {
          accountId,
          fullName: `${lead.first_name || ""} ${lead.last_name || ""}`.trim() || lead.email,
          firstName: lead.first_name,
          lastName: lead.last_name,
          primaryEmail: lead.email,
          companyName: lead.company_name,
          companyDomain: lead.company_domain,
          companySize: null,
          roleTitle: lead.title,
          simplifiedTitle: null,
          phone: lead.phone_numbers?.[0]?.number || null,
          manuallyAddedNumber: null,
          manuallyAddedNumberDncStatus: null,
          sourcedNumber: null,
          sourcedNumberDncStatus: null,
          mobileNumber: null,
          mobileNumberDncStatus: null,
          workNumber: null,
          workNumberDncStatus: null,
          city: null,
          state: null,
          country: null,
          location: null,
          linkedinUrl: lead.linkedin_url,
          industry: lead.industry,
          status: null,
          numberOfOpens: 0,
          label: null,
          meetingBooked: false,
          owner: null,
          sequenceName: null,
          sequenceTemplateName: null,
          savedSearchOrLeadListName: null,
          mailbox: null,
          contactUrl: null,
          replied: false,
          lastStageExecuted: null,
          lastStageExecutedAt: null,
          notes: null,
          enrichmentSource: "amplemarket",
          enrichmentSnapshot: lead,
          enrichmentLastSyncedAt: new Date(),
          updatedAt: new Date(),
        };

        if (existingPerson) {
          // Update existing person
          await db
            .update(people)
            .set(personData)
            .where(eq(people.id, existingPerson.id));
        } else {
          // Create new person
          await db.insert(people).values({
            id: nanoid(),
            tenantId,
            ...personData,
            createdAt: new Date(),
          });
        }
        totalSyncedCount++;
      }
    } catch (error: any) {
      console.error("[Amplemarket Sync] Error fetching list:", {
        listId,
        url: requestUrl,
        status: error.response?.status,
        statusText: error.response?.statusText,
        responseBody: error.response?.data,
        message: error.message
      });
      // Continue with next list instead of failing entire sync
    }
  }
  
  return totalSyncedCount;
}

/**
 * Full Amplemarket sync: contacts (accounts are derived from contact company data)
 */
export async function syncAmplemarket(db: any, tenantId: string, apiKey: string, selectedListIds: string[] = []) {
  const contactsSynced = await syncAmplemarketContacts(db, tenantId, apiKey, selectedListIds);

  // Update last synced timestamp
  await db
    .update(integrations)
    .set({ lastSyncedAt: new Date() })
    .where(and(
      eq(integrations.tenantId, tenantId),
      eq(integrations.provider, "amplemarket")
    ));

  return { accountsSynced: 0, contactsSynced, totalSynced: contactsSynced };
}
