import axios from "axios";
import { getDb } from "./db";
import * as schema from "../drizzle/schema";
import { eq } from "drizzle-orm";

interface CalendarEvent {
  id: string;
  summary: string;
  description?: string;
  start: {
    dateTime?: string;
    date?: string;
  };
  end: {
    dateTime?: string;
    date?: string;
  };
  location?: string;
  attendees?: Array<{
    email: string;
    displayName?: string;
    responseStatus?: string;
  }>;
  htmlLink: string;
}

/**
 * Fetch upcoming calendar events from Google Calendar
 */
export async function getUpcomingEvents(
  tenantId: string,
  maxResults: number = 10
): Promise<CalendarEvent[]> {
  try {
    const dbInstance = await getDb();
    if (!dbInstance) {
      throw new Error("Database not available");
    }

    // Get Google Calendar integration for this tenant
    const integrations = await dbInstance
      .select()
      .from(schema.integrations)
      .where(eq(schema.integrations.tenantId, tenantId));

    const googleIntegration = integrations.find(
      (i) => i.provider === "google"
    );

    if (!googleIntegration) {
      throw new Error("Google Calendar not connected");
    }

    const config = googleIntegration.config as any;
    if (!config?.accessToken) {
      throw new Error("No access token found");
    }

    // Fetch events from Google Calendar API
    const response = await axios.get(
      "https://www.googleapis.com/calendar/v3/calendars/primary/events",
      {
        headers: {
          Authorization: `Bearer ${config.accessToken}`,
        },
        params: {
          maxResults,
          orderBy: "startTime",
          singleEvents: true,
          timeMin: new Date().toISOString(),
        },
      }
    );

    return response.data.items || [];
  } catch (error: any) {
    // If token expired, try to refresh
    if (error.response?.status === 401) {
      console.log("[Google Calendar] Access token expired, attempting refresh");
      const refreshed = await refreshAccessToken(tenantId);
      if (refreshed) {
        // Retry with new token
        return getUpcomingEvents(tenantId, maxResults);
      }
    }

    console.error("[Google Calendar] Error fetching events:", error.message);
    throw error;
  }
}

/**
 * Refresh expired access token using refresh token
 */
async function refreshAccessToken(tenantId: string): Promise<boolean> {
  try {
    const dbInstance = await getDb();
    if (!dbInstance) return false;

    // Get integration
    const integrations = await dbInstance
      .select()
      .from(schema.integrations)
      .where(eq(schema.integrations.tenantId, tenantId));

    const googleIntegration = integrations.find(
      (i) => i.provider === "google"
    );

    if (!googleIntegration) return false;

    const config = googleIntegration.config as any;
    if (!config?.refreshToken) {
      console.error("[Google Calendar] No refresh token available");
      return false;
    }

    // Get OAuth credentials from environment
    const clientId = process.env.GOOGLE_CALENDAR_CLIENT_ID;
    const clientSecret = process.env.GOOGLE_CALENDAR_CLIENT_SECRET;

    if (!clientId || !clientSecret) {
      console.error("[Google Calendar] OAuth credentials not configured");
      return false;
    }

    // Request new access token
    const response = await axios.post(
      "https://oauth2.googleapis.com/token",
      {
        client_id: clientId,
        client_secret: clientSecret,
        refresh_token: config.refreshToken,
        grant_type: "refresh_token",
      }
    );

    const newAccessToken = response.data.access_token;

    // Update integration with new access token
    await dbInstance
      .update(schema.integrations)
      .set({
        config: {
          ...config,
          accessToken: newAccessToken,
        },
      })
      .where(eq(schema.integrations.id, googleIntegration.id));

    console.log("[Google Calendar] Access token refreshed successfully");
    return true;
  } catch (error: any) {
    console.error("[Google Calendar] Error refreshing token:", error.message);
    return false;
  }
}

/**
 * Get calendar connection status for a tenant
 */
export async function getCalendarStatus(tenantId: string): Promise<{
  connected: boolean;
  lastSyncedAt?: Date;
  error?: string;
}> {
  try {
    const dbInstance = await getDb();
    if (!dbInstance) {
      return { connected: false, error: "Database not available" };
    }

    const integrations = await dbInstance
      .select()
      .from(schema.integrations)
      .where(eq(schema.integrations.tenantId, tenantId));

    const googleIntegration = integrations.find(
      (i) => i.provider === "google"
    );

    if (!googleIntegration) {
      return { connected: false };
    }

    const config = googleIntegration.config as any;
    if (!config?.accessToken) {
      return { connected: false, error: "No access token" };
    }

    return {
      connected: true,
      lastSyncedAt: googleIntegration.lastSyncedAt || undefined,
    };
  } catch (error: any) {
    return { connected: false, error: error.message };
  }
}
