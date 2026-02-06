import { Request, Response } from "express";
import * as crypto from "crypto";
import * as db from "../db";
import { syncAmplemarket } from "../amplemarket";

/**
 * Verify Amplemarket webhook signature
 * Amplemarket signs webhooks with HMAC-SHA256
 */
function verifyWebhookSignature(
  payload: string,
  signature: string,
  secret: string
): boolean {
  const hmac = crypto.createHmac("sha256", secret);
  hmac.update(payload);
  const expectedSignature = hmac.digest("hex");
  return crypto.timingSafeEqual(
    Buffer.from(signature),
    Buffer.from(expectedSignature)
  );
}

/**
 * Handle Amplemarket webhook events
 * Events: contact.created, contact.updated, contact.deleted, sequence.completed, etc.
 */
export async function handleAmplemarketWebhook(req: Request, res: Response) {
  try {
    const signature = req.headers["x-amplemarket-signature"] as string;
    const payload = JSON.stringify(req.body);
    
    // Get webhook secret from environment or integration config
    const webhookSecret = process.env.AMPLEMARKET_WEBHOOK_SECRET;
    if (!webhookSecret) {
      console.error("[Amplemarket Webhook] No webhook secret configured");
      return res.status(500).json({ error: "Webhook secret not configured" });
    }

    // Verify signature
    if (!signature || !verifyWebhookSignature(payload, signature, webhookSecret)) {
      console.error("[Amplemarket Webhook] Invalid signature");
      return res.status(401).json({ error: "Invalid signature" });
    }

    const event = req.body;
    console.log(`[Amplemarket Webhook] Received event: ${event.type}`);

    // Extract tenant ID from event data (Amplemarket should include custom metadata)
    const tenantId = event.metadata?.tenantId;
    if (!tenantId) {
      console.error("[Amplemarket Webhook] No tenant ID in event");
      return res.status(400).json({ error: "Missing tenant ID" });
    }

    // Get integration config
    const integrations = await db.getIntegrationsByTenant(tenantId);
    const amplemarketIntegration = integrations.find((i: any) => i.provider === "amplemarket");
    if (!amplemarketIntegration) {
      console.error("[Amplemarket Webhook] Integration not found");
      return res.status(404).json({ error: "Integration not found" });
    }

    const apiKey = (amplemarketIntegration.config as any)?.apiKey;
    if (!apiKey) {
      console.error("[Amplemarket Webhook] API key not found");
      return res.status(400).json({ error: "API key not configured" });
    }

    // Handle different event types
    switch (event.type) {
      case "contact.created":
      case "contact.updated":
        await handleContactEvent(tenantId, apiKey, event.data);
        break;

      case "contact.deleted":
        await handleContactDeleted(tenantId, event.data.id);
        break;

      case "sequence.completed":
      case "sequence.updated":
        await handleSequenceEvent(tenantId, apiKey, event.data);
        break;

      case "account.created":
      case "account.updated":
        await handleAccountEvent(tenantId, apiKey, event.data);
        break;

      default:
        console.log(`[Amplemarket Webhook] Unhandled event type: ${event.type}`);
    }

    // Acknowledge receipt
    res.status(200).json({ received: true });
  } catch (error) {
    console.error("[Amplemarket Webhook] Error processing webhook:", error);
    res.status(500).json({ error: "Internal server error" });
  }
}

async function handleContactEvent(tenantId: string, apiKey: string, contactData: any) {
  try {
    // Sync this specific contact
    const dbInstance = await db.getDb();
    if (!dbInstance) return;

    // Upsert person (create or update)
    await db.upsertPerson(tenantId, contactData.email, {
      fullName: contactData.name || contactData.full_name,
      roleTitle: contactData.title,
      companyName: contactData.company?.name,
      phone: contactData.phone,
      linkedinUrl: contactData.linkedin_url,
    });
    console.log(`[Amplemarket Webhook] Synced person: ${contactData.email}`);
  } catch (error) {
    console.error("[Amplemarket Webhook] Error handling contact event:", error);
  }
}

async function handleContactDeleted(tenantId: string, contactId: string) {
  try {
    // Mark person as deleted or remove from CRM
    // Implementation depends on your deletion strategy
    console.log(`[Amplemarket Webhook] Contact deleted: ${contactId}`);
  } catch (error) {
    console.error("[Amplemarket Webhook] Error handling contact deletion:", error);
  }
}

async function handleSequenceEvent(tenantId: string, apiKey: string, sequenceData: any) {
  try {
    // Handle sequence completion or updates
    console.log(`[Amplemarket Webhook] Sequence event: ${sequenceData.id}`);
  } catch (error) {
    console.error("[Amplemarket Webhook] Error handling sequence event:", error);
  }
}

async function handleAccountEvent(tenantId: string, apiKey: string, accountData: any) {
  try {
    // Sync account data
    console.log(`[Amplemarket Webhook] Account event received: ${accountData.name}`);
    // TODO: Implement account sync when account upsert function is available
  } catch (error) {
    console.error("[Amplemarket Webhook] Error handling account event:", error);
  }
}
