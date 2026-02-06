import { people } from "../drizzle/schema";
import { eq, and, isNotNull } from "drizzle-orm";

/**
 * Cleanup wrong-owner Amplemarket imports
 * Removes contacts that were imported with wrong amplemarketUserId
 */
export async function cleanupWrongOwnerImports(
  db: any,
  tenantId: string,
  integrationId: string,
  correctAmplemarketUserEmail: string
): Promise<{ deletedContacts: number; deletedAccounts: number }> {
  console.log("[Amplemarket Cleanup] Starting wrong-owner cleanup:", {
    tenantId,
    integrationId,
    correctOwner: correctAmplemarketUserEmail
  });

  // Find all Amplemarket contacts for this tenant/integration
  const amplemarketContacts = await db
    .select()
    .from(people)
    .where(and(
      eq(people.tenantId, tenantId),
      eq(people.integrationId, integrationId),
      eq(people.enrichmentSource, "amplemarket")
    ));

  console.log("[Amplemarket Cleanup] Found Amplemarket contacts:", amplemarketContacts.length);

  // Filter to find wrong-owner contacts
  // Check enrichmentSnapshot.owner field
  const wrongOwnerContacts = amplemarketContacts.filter((contact: any) => {
    const snapshot = contact.enrichmentSnapshot;
    if (!snapshot || !snapshot.owner) {
      console.warn("[Amplemarket Cleanup] Contact missing owner in snapshot:", contact.primaryEmail);
      return false; // Keep contacts without owner info (legacy data)
    }
    return snapshot.owner !== correctAmplemarketUserEmail;
  });

  console.log("[Amplemarket Cleanup] Wrong-owner contacts to delete:", {
    total: wrongOwnerContacts.length,
    correctOwner: correctAmplemarketUserEmail,
    wrongOwners: Array.from(new Set(wrongOwnerContacts.map((c: any) => c.enrichmentSnapshot?.owner)))
  });

  if (wrongOwnerContacts.length === 0) {
    return { deletedContacts: 0, deletedAccounts: 0 };
  }

  // Delete wrong-owner contacts
  const contactIdsToDelete = wrongOwnerContacts.map((c: any) => c.id);
  const accountIdsToCheck = Array.from(new Set(wrongOwnerContacts.map((c: any) => c.accountId).filter(Boolean)));

  // Delete contacts
  for (const contactId of contactIdsToDelete) {
    await db.delete(people).where(eq(people.id, contactId));
  }

  // Check and delete orphaned accounts (accounts with no remaining contacts)
  const { accounts: accountsTable } = await import("../drizzle/schema");
  let deletedAccountsCount = 0;
  
  for (const accountId of accountIdsToCheck) {
    const remainingContacts = await db
      .select()
      .from(people)
      .where(eq(people.accountId, accountId as string))
      .limit(1);

    if (remainingContacts.length === 0) {
      await db.delete(accountsTable).where(eq(accountsTable.id, accountId as string));
      deletedAccountsCount++;
    }
  }

  console.log("[Amplemarket Cleanup] Cleanup completed:", {
    deletedContacts: contactIdsToDelete.length,
    deletedAccounts: deletedAccountsCount
  });

  return {
    deletedContacts: contactIdsToDelete.length,
    deletedAccounts: deletedAccountsCount
  };
}
