import { getDb } from "./db";
import { people } from "../drizzle/schema";
import { eq } from "drizzle-orm";

interface EnrichmentResult {
  success: boolean;
  enrichedFields: string[];
  data?: {
    roleTitle?: string;
    companyName?: string;
    linkedinUrl?: string;
    location?: string;
    phone?: string;
  };
  error?: string;
}

/**
 * Enrich contact data using email lookup
 * This is a mock implementation - in production, integrate with services like:
 * - Clearbit API
 * - Hunter.io
 * - Apollo.io
 * - ZoomInfo
 */
export async function enrichContact(personId: string, email: string): Promise<EnrichmentResult> {
  try {
    // Mock enrichment data based on email domain
    const domain = email.split('@')[1];
    const enrichedData = await mockEnrichmentAPI(email, domain);
    
    if (!enrichedData) {
      return {
        success: false,
        enrichedFields: [],
        error: 'No enrichment data found',
      };
    }

    // Update contact with enriched data
    const updateData: any = {};
    const enrichedFields: string[] = [];

    if (enrichedData.roleTitle) {
      updateData.roleTitle = enrichedData.roleTitle;
      enrichedFields.push('roleTitle');
    }
    if (enrichedData.companyName) {
      updateData.companyName = enrichedData.companyName;
      enrichedFields.push('companyName');
    }
    if (enrichedData.linkedinUrl) {
      updateData.linkedinUrl = enrichedData.linkedinUrl;
      enrichedFields.push('linkedinUrl');
    }
    if (enrichedData.location) {
      updateData.location = enrichedData.location;
      enrichedFields.push('location');
    }
    if (enrichedData.phone) {
      updateData.phone = enrichedData.phone;
      enrichedFields.push('phone');
    }

    if (Object.keys(updateData).length > 0) {
      updateData.enrichmentLastSyncedAt = new Date();
      updateData.enrichmentSource = 'auto';
      updateData.enrichmentSnapshot = enrichedData;
      
      const db = await getDb();
      if (!db) throw new Error('Database not available');
      
      await db.update(people)
        .set(updateData)
        .where(eq(people.id, personId));
    }

    return {
      success: true,
      enrichedFields,
      data: enrichedData,
    };
  } catch (error) {
    console.error('Enrichment error:', error);
    
    // Mark enrichment as failed
    const db = await getDb();
    if (db) {
      await db.update(people)
        .set({
          enrichmentSource: 'failed',
          enrichmentLastSyncedAt: new Date(),
        })
        .where(eq(people.id, personId));
    }

    return {
      success: false,
      enrichedFields: [],
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

/**
 * Mock enrichment API - replace with real API integration
 */
async function mockEnrichmentAPI(email: string, domain: string): Promise<any> {
  // Simulate API delay
  await new Promise(resolve => setTimeout(resolve, 500));

  // Mock data based on common domains
  const mockDatabase: Record<string, any> = {
    'google.com': {
      roleTitle: 'Software Engineer',
      companyName: 'Google',
      linkedinUrl: 'https://linkedin.com/in/example',
      location: 'Mountain View, CA',
    },
    'microsoft.com': {
      roleTitle: 'Product Manager',
      companyName: 'Microsoft',
      linkedinUrl: 'https://linkedin.com/in/example',
      location: 'Redmond, WA',
    },
    'apple.com': {
      roleTitle: 'Senior Designer',
      companyName: 'Apple',
      linkedinUrl: 'https://linkedin.com/in/example',
      location: 'Cupertino, CA',
    },
    'amazon.com': {
      roleTitle: 'Solutions Architect',
      companyName: 'Amazon',
      linkedinUrl: 'https://linkedin.com/in/example',
      location: 'Seattle, WA',
    },
  };

  // Return mock data if domain matches
  if (mockDatabase[domain]) {
    return mockDatabase[domain];
  }

  // Generate generic mock data for unknown domains
  const companyName = domain.split('.')[0];
  return {
    roleTitle: 'Professional',
    companyName: companyName.charAt(0).toUpperCase() + companyName.slice(1),
    location: 'United States',
  };
}

/**
 * Batch enrich multiple contacts
 */
export async function batchEnrichContacts(personIds: string[]): Promise<{
  total: number;
  successful: number;
  failed: number;
  results: EnrichmentResult[];
}> {
  const results: EnrichmentResult[] = [];
  let successful = 0;
  let failed = 0;

  for (const personId of personIds) {
    // Get person email
    const db = await getDb();
    if (!db) {
      results.push({
        success: false,
        enrichedFields: [],
        error: 'Database not available',
      });
      failed++;
      continue;
    }
    
    const result = await db.select().from(people).where(eq(people.id, personId)).limit(1);
    const person = result[0];

    if (!person || !person.primaryEmail) {
      results.push({
        success: false,
        enrichedFields: [],
        error: 'No email found',
      });
      failed++;
      continue;
    }

    const enrichResult = await enrichContact(personId, person.primaryEmail);
    results.push(enrichResult);

    if (enrichResult.success) {
      successful++;
    } else {
      failed++;
    }

    // Rate limiting - wait between requests
    await new Promise(resolve => setTimeout(resolve, 100));
  }

  return {
    total: personIds.length,
    successful,
    failed,
    results,
  };
}

/**
 * Check if contact needs enrichment
 */
export function needsEnrichment(person: any): boolean {
  // Skip if already enriched recently (within 30 days)
  if (person.enrichmentLastSyncedAt) {
    const daysSinceEnrichment = (Date.now() - new Date(person.enrichmentLastSyncedAt).getTime()) / (1000 * 60 * 60 * 24);
    if (daysSinceEnrichment < 30 && person.enrichmentSource !== 'failed') {
      return false;
    }
  }

  // Skip if enrichment failed recently (within 24 hours)
  if (person.enrichmentSource === 'failed' && person.enrichmentLastSyncedAt) {
    const hoursSinceFailure = (Date.now() - new Date(person.enrichmentLastSyncedAt).getTime()) / (1000 * 60 * 60);
    if (hoursSinceFailure < 24) {
      return false;
    }
  }

  // Needs enrichment if missing key fields
  return !person.roleTitle || !person.companyName || !person.linkedinUrl;
}
