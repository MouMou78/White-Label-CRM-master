import axios from "axios";
import { nanoid } from "nanoid";
import { accounts, people, integrations } from "../drizzle/schema";
import { eq, and } from "drizzle-orm";

const AMPLEMARKET_API_BASE = "https://api.amplemarket.com/v1";

/**
 * Sync accounts from Amplemarket
 */
export async function syncAmplemarketAccounts(db: any, tenantId: string, apiKey: string) {
  try {
    const response = await axios.get(`${AMPLEMARKET_API_BASE}/accounts`, {
      headers: { "X-Api-Key": apiKey },
      params: {
        per_page: 100,
        page: 1,
      },
    });

    const accountsList = response.data.accounts || [];
    let syncedCount = 0;

    for (const ampAccount of accountsList) {
      // Check if account already exists by domain
      const [existingAccount] = await db
        .select()
        .from(accounts)
        .where(and(
          eq(accounts.tenantId, tenantId),
          eq(accounts.domain, ampAccount.domain)
        ))
        .limit(1);

      const accountData = {
        name: ampAccount.name || ampAccount.company_name,
        domain: ampAccount.domain,
        industry: ampAccount.industry,
        employees: ampAccount.employees || ampAccount.employee_count,
        revenue: ampAccount.revenue,
        technologies: ampAccount.technologies ? JSON.parse(JSON.stringify(ampAccount.technologies)) : null,
        headquarters: ampAccount.headquarters || ampAccount.location,
        foundingYear: ampAccount.founding_year ? parseInt(ampAccount.founding_year) : null,
        lastFundingRound: ampAccount.last_funding_round,
        firstContacted: ampAccount.first_contacted ? new Date(ampAccount.first_contacted) : null,
        linkedinUrl: ampAccount.linkedin_url,
        enrichmentSource: "amplemarket",
        enrichmentSnapshot: ampAccount,
        updatedAt: new Date(),
      };

      if (existingAccount) {
        // Update existing account
        await db
          .update(accounts)
          .set(accountData)
          .where(eq(accounts.id, existingAccount.id));
      } else {
        // Create new account
        await db.insert(accounts).values({
          id: nanoid(),
          tenantId,
          ...accountData,
          createdAt: new Date(),
        });
      }
      syncedCount++;
    }

    return syncedCount;
  } catch (error: any) {
    console.error("Error syncing Amplemarket accounts:", error.message);
    throw new Error(`Failed to sync Amplemarket accounts: ${error.message}`);
  }
}

/**
 * Sync contacts from Amplemarket with all fields
 */
export async function syncAmplemarketContacts(db: any, tenantId: string, apiKey: string) {
  try {
    const response = await axios.get(`${AMPLEMARKET_API_BASE}/contacts`, {
      headers: { "X-Api-Key": apiKey },
      params: {
        per_page: 100,
        page: 1,
      },
    });

    const contactsList = response.data.contacts || [];
    let syncedCount = 0;

    for (const contact of contactsList) {
      // Check if person already exists by email
      const [existingPerson] = await db
        .select()
        .from(people)
        .where(and(
          eq(people.tenantId, tenantId),
          eq(people.primaryEmail, contact.email)
        ))
        .limit(1);

      // Find or create linked account
      let accountId = null;
      if (contact.company_domain) {
        const [account] = await db
          .select()
          .from(accounts)
          .where(and(
            eq(accounts.tenantId, tenantId),
            eq(accounts.domain, contact.company_domain)
          ))
          .limit(1);
        
        if (account) {
          accountId = account.id;
        }
      }

      const personData = {
        accountId,
        fullName: `${contact.first_name || ""} ${contact.last_name || ""}`.trim() || contact.email,
        firstName: contact.first_name,
        lastName: contact.last_name,
        primaryEmail: contact.email,
        companyName: contact.company_name,
        companyDomain: contact.company_domain,
        companySize: contact.company_size,
        roleTitle: contact.title,
        simplifiedTitle: contact.simplified_title,
        phone: contact.phone_number,
        manuallyAddedNumber: contact.manually_added_number,
        manuallyAddedNumberDncStatus: contact.manually_added_number_dnc_status,
        sourcedNumber: contact.sourced_number,
        sourcedNumberDncStatus: contact.sourced_number_dnc_status,
        mobileNumber: contact.mobile_number,
        mobileNumberDncStatus: contact.mobile_number_dnc_status,
        workNumber: contact.work_number,
        workNumberDncStatus: contact.work_number_dnc_status,
        city: contact.city,
        state: contact.state,
        country: contact.country,
        location: contact.location,
        linkedinUrl: contact.linkedin_url,
        industry: contact.industry,
        status: contact.status,
        numberOfOpens: contact.number_of_opens || 0,
        label: contact.label,
        meetingBooked: contact.meeting_booked || false,
        owner: contact.owner,
        sequenceName: contact.sequence_name,
        sequenceTemplateName: contact.sequence_template_name,
        savedSearchOrLeadListName: contact.saved_search_or_lead_list_name,
        mailbox: contact.mailbox,
        contactUrl: contact.contact_url,
        replied: contact.replied || false,
        lastStageExecuted: contact.last_stage_executed,
        lastStageExecutedAt: contact.last_stage_executed_at ? new Date(contact.last_stage_executed_at) : null,
        notes: contact.notes,
        enrichmentSource: "amplemarket",
        enrichmentSnapshot: contact,
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
      syncedCount++;
    }

    return syncedCount;
  } catch (error: any) {
    console.error("Error syncing Amplemarket contacts:", error.message);
    throw new Error(`Failed to sync Amplemarket contacts: ${error.message}`);
  }
}

/**
 * Full Amplemarket sync: accounts + contacts
 */
export async function syncAmplemarket(db: any, tenantId: string, apiKey: string) {
  const accountsSynced = await syncAmplemarketAccounts(db, tenantId, apiKey);
  const contactsSynced = await syncAmplemarketContacts(db, tenantId, apiKey);

  // Update last synced timestamp
  await db
    .update(integrations)
    .set({ lastSyncedAt: new Date() })
    .where(and(
      eq(integrations.tenantId, tenantId),
      eq(integrations.provider, "amplemarket")
    ));

  return { accountsSynced, contactsSynced, totalSynced: accountsSynced + contactsSynced };
}
