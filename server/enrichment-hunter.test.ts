import { describe, it, expect, beforeAll } from "vitest";

describe("Hunter.io API Integration", () => {
  beforeAll(() => {
    // Ensure API key is set
    if (!process.env.HUNTER_API_KEY) {
      throw new Error("HUNTER_API_KEY environment variable is not set");
    }
  });

  it("should validate Hunter.io API key with account info endpoint", async () => {
    const apiKey = process.env.HUNTER_API_KEY;
    
    // Use Hunter.io account endpoint to validate API key
    const response = await fetch(`https://api.hunter.io/v2/account?api_key=${apiKey}`);
    
    expect(response.ok).toBe(true);
    
    const data = await response.json();
    
    // Check that we got valid account data back
    expect(data).toHaveProperty("data");
    expect(data.data).toHaveProperty("email");
    expect(data.data).toHaveProperty("requests");
    
    console.log("Hunter.io API key validated successfully");
    console.log(`Account email: ${data.data.email}`);
    console.log(`Requests used: ${data.data.requests.searches?.used || 0}/${data.data.requests.searches?.available || 0} searches`);
    console.log(`Verifications used: ${data.data.requests.verifications?.used || 0}/${data.data.requests.verifications?.available || 0} verifications`);
  }, 10000); // 10 second timeout for API call

  it("should test email enrichment with a known email", async () => {
    const apiKey = process.env.HUNTER_API_KEY;
    
    // Test with a well-known public email
    const testEmail = "elon@tesla.com";
    
    const response = await fetch(
      `https://api.hunter.io/v2/email-enrichment?email=${encodeURIComponent(testEmail)}&api_key=${apiKey}`
    );
    
    // Check content type before parsing
    const contentType = response.headers.get("content-type");
    if (!contentType || !contentType.includes("application/json")) {
      console.log(`API returned non-JSON response (${response.status}): ${contentType}`);
      // Non-JSON response is acceptable as long as it's not 401
      expect(response.status).not.toBe(401);
      return;
    }
    
    const data = await response.json();
    
    // Check if we got a valid response (either success or a known error)
    // The API key is valid as long as we don't get authentication errors
    if (response.ok) {
      console.log("Enrichment test successful - API returned data");
      if (data.data) {
        console.log(`Company: ${data.data.company || "N/A"}`);
        console.log(`Position: ${data.data.position || "N/A"}`);
      }
      expect(data.errors).toBeUndefined();
    } else {
      // Check if it's an authentication error (401) or other error
      if (response.status === 401) {
        throw new Error("Invalid Hunter.io API key");
      }
      // Other errors (like 404 for email not found) are acceptable
      console.log(`API returned ${response.status} - API key is valid but no data found`);
      expect(response.status).not.toBe(401);
    }
  }, 10000); // 10 second timeout for API call
});
