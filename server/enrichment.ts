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

interface HunterEnrichmentResponse {
  data?: {
    first_name?: string;
    last_name?: string;
    email?: string;
    position?: string;
    company?: string;
    city?: string;
    state?: string;
    country?: string;
    linkedin?: string;
    twitter?: string;
    phone_number?: string;
  };
  errors?: Array<{ id: string; details: string }>;
}

/**
 * Enrich contact data using Hunter.io API
 */
export async function enrichContact(personId: string, email: string): Promise<EnrichmentResult> {
  try {
    const enrichedData = await hunterEnrichmentAPI(email);
    
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
      updateData.enrichmentSource = 'hunter';
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
 * Call Hunter.io Email Enrichment API
 */
async function hunterEnrichmentAPI(email: string): Promise<any> {
  const apiKey = process.env.HUNTER_API_KEY;
  
  if (!apiKey) {
    throw new Error('HUNTER_API_KEY not configured');
  }

  try {
    const url = `https://api.hunter.io/v2/email-enrichment?email=${encodeURIComponent(email)}&api_key=${apiKey}`;
    const response = await fetch(url);
    
    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Hunter.io API error: ${response.status} - ${errorText}`);
    }

    const data: HunterEnrichmentResponse = await response.json();
    
    // Check for API errors
    if (data.errors && data.errors.length > 0) {
      throw new Error(`Hunter.io API error: ${data.errors[0].details}`);
    }

    if (!data.data) {
      return null;
    }

    // Transform Hunter.io response to our format
    const enrichedData: any = {};

    if (data.data.position) {
      enrichedData.roleTitle = data.data.position;
    }

    if (data.data.company) {
      enrichedData.companyName = data.data.company;
    }

    if (data.data.linkedin) {
      enrichedData.linkedinUrl = data.data.linkedin;
    }

    // Combine location fields
    const locationParts = [
      data.data.city,
      data.data.state,
      data.data.country
    ].filter(Boolean);
    
    if (locationParts.length > 0) {
      enrichedData.location = locationParts.join(', ');
    }

    if (data.data.phone_number) {
      enrichedData.phone = data.data.phone_number;
    }

    return Object.keys(enrichedData).length > 0 ? enrichedData : null;
  } catch (error) {
    console.error('Hunter.io API call failed:', error);
    throw error;
  }
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

    // Rate limiting - wait between requests to respect Hunter.io rate limits
    await new Promise(resolve => setTimeout(resolve, 1000));
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
