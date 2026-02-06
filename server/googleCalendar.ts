import axios from "axios";
import { getDb } from "./db";
import * as schema from "../drizzle/schema";
import { eq } from "drizzle-orm";
import { decryptToken } from "./googleOAuth";

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

    // Verify scope includes calendar.readonly
    const requiredScope = "https://www.googleapis.com/auth/calendar.readonly";
    if (config.scope && !config.scope.includes(requiredScope)) {
      throw new Error(`Missing required scope: ${requiredScope}. Please reconnect Google Calendar.`);
    }

    // Decrypt access token
    let accessToken: string;
    try {
      accessToken = decryptToken(config.accessToken);
    } catch (error) {
      console.error("[Google Calendar] Failed to decrypt access token:", error);
      throw new Error("Invalid access token. Please reconnect Google Calendar.");
    }

    // Check token expiry before making API call
    const tokenRefreshed = await checkAndRefreshToken(tenantId, config);
    
    // Get fresh config if token was refreshed
    if (tokenRefreshed) {
      const freshDb = await getDb();
      if (freshDb) {
        const updatedIntegrations = await freshDb
          .select()
          .from(schema.integrations)
          .where(eq(schema.integrations.tenantId, tenantId));
        const updated = updatedIntegrations.find((i) => i.provider === "google");
        if (updated?.config) {
          const freshConfig = updated.config as any;
          try {
            accessToken = decryptToken(freshConfig.accessToken);
          } catch (error) {
            console.error("[Google Calendar] Failed to decrypt refreshed token:", error);
          }
        }
      }
    }

    const endpoint = "https://www.googleapis.com/calendar/v3/calendars/primary/events";
    const params = {
      maxResults,
      orderBy: "startTime",
      singleEvents: true,
      timeMin: new Date().toISOString(),
    };

    console.log("[Google Calendar API] Outbound Request:", {
      method: "GET",
      endpoint,
      params,
      hasAccessToken: !!accessToken,
      tokenRefreshed,
    });

    // Fetch events from Google Calendar API
    const response = await axios.get(endpoint, {
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
      params,
    });

    console.log("[Google Calendar API] Response:", {
      status: response.status,
      itemCount: response.data.items?.length || 0,
    });

    return response.data.items || [];
  } catch (error: any) {
    console.error("[Google Calendar API] Error:", {
      status: error.response?.status,
      statusText: error.response?.statusText,
      data: error.response?.data,
      message: error.message,
    });

    // If token expired, try to refresh
    if (error.response?.status === 401) {
      console.log("[Google Calendar] Access token expired, attempting refresh");
      const refreshed = await refreshAccessToken(tenantId);
      if (refreshed) {
        // Retry with new token
        return getUpcomingEvents(tenantId, maxResults);
      }
      throw new Error("Google Calendar authentication failed. Please reconnect your Google Calendar.");
    }

    // Map other errors to actionable messages
    if (error.response?.status === 403) {
      throw new Error("Google Calendar access denied. Please check calendar permissions and reconnect.");
    }
    if (error.response?.status === 404) {
      throw new Error("Calendar not found. Please reconnect your Google Calendar.");
    }

    throw new Error(`Failed to load calendar events: ${error.message}`);
  }
}

/**
 * Check if token is expired and refresh if needed
 */
async function checkAndRefreshToken(
  tenantId: string,
  config: any
): Promise<boolean> {
  try {
    // Check if token has expiry information
    if (config.expiresAt) {
      const expiryTime = new Date(config.expiresAt).getTime();
      const now = Date.now();
      const bufferTime = 5 * 60 * 1000; // 5 minutes buffer

      if (now + bufferTime >= expiryTime) {
        console.log("[Google Calendar] Token expiring soon, refreshing...");
        return await refreshAccessToken(tenantId);
      }
    }
    return false;
  } catch (error: any) {
    console.error("[Google Calendar] Error checking token expiry:", error.message);
    return false;
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

    // Decrypt refresh token
    let refreshToken: string;
    try {
      refreshToken = decryptToken(config.refreshToken);
    } catch (error) {
      console.error("[Google Calendar] Failed to decrypt refresh token:", error);
      return false;
    }

    // Get OAuth credentials from environment
    const clientId = process.env.GOOGLE_OAUTH_CLIENT_ID;
    const clientSecret = process.env.GOOGLE_OAUTH_CLIENT_SECRET;

    if (!clientId || !clientSecret) {
      console.error("[Google Calendar] OAuth credentials not configured");
      return false;
    }

    console.log("[Google Calendar] Requesting new access token from Google...");

    // Request new access token
    const response = await axios.post(
      "https://oauth2.googleapis.com/token",
      {
        client_id: clientId,
        client_secret: clientSecret,
        refresh_token: refreshToken,
        grant_type: "refresh_token",
      }
    );

    const newAccessToken = response.data.access_token;
    const expiresIn = response.data.expires_in || 3600;
    const expiresAt = new Date(Date.now() + expiresIn * 1000);

    // Encrypt new access token
    const { encryptToken } = await import("./googleOAuth");
    const encryptedAccessToken = encryptToken(newAccessToken);

    // Update integration with new access token
    await dbInstance
      .update(schema.integrations)
      .set({
        config: {
          ...config,
          accessToken: encryptedAccessToken,
          expiresAt: expiresAt.toISOString(),
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
