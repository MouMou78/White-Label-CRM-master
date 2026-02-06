import axios from "axios";

const AMPLEMARKET_API_BASE = "https://api.amplemarket.com";

/**
 * Get user-scoped list IDs and sequence IDs for a given Amplemarket user email
 * Returns only lists/sequences owned by or linked to the specified user
 */
export async function getAmplemarketUserScope(
  apiKey: string,
  userEmail: string
): Promise<{
  listIds: string[];
  sequenceIds: string[];
  lists: Array<{ id: string; name: string; owner: string; shared: boolean }>;
  sequences: Array<{ id: string; name: string; createdBy: string }>;
}> {
  console.log("[Amplemarket User Scope] Fetching scope for user:", userEmail);

  const headers = {
    "Authorization": `Bearer ${apiKey}`,
    "Content-Type": "application/json",
  };

  // Fetch all lists
  let userLists: any[] = [];
  try {
    const listsResponse = await axios.get(`${AMPLEMARKET_API_BASE}/lead-lists`, { headers });
    const allLists = listsResponse.data.leadLists || listsResponse.data;
    
    // Filter lists: owned by user OR shared
    userLists = allLists.filter((list: any) => 
      list.owner === userEmail || list.shared === true
    );
    
    console.log("[Amplemarket User Scope] Lists found:", {
      total: allLists.length,
      userOwned: allLists.filter((l: any) => l.owner === userEmail).length,
      shared: allLists.filter((l: any) => l.shared === true).length,
      filtered: userLists.length
    });
  } catch (error: any) {
    console.error("[Amplemarket User Scope] Error fetching lists:", {
      status: error.response?.status,
      message: error.message
    });
    throw new Error(`Failed to fetch Amplemarket lists: ${error.message}`);
  }

  // Fetch all sequences
  let userSequences: any[] = [];
  try {
    const sequencesResponse = await axios.get(`${AMPLEMARKET_API_BASE}/sequences`, { headers });
    const allSequences = sequencesResponse.data.sequences || sequencesResponse.data;
    
    // Filter sequences: created by user
    userSequences = allSequences.filter((seq: any) => 
      seq.created_by_user_email === userEmail
    );
    
    console.log("[Amplemarket User Scope] Sequences found:", {
      total: allSequences.length,
      userCreated: userSequences.length
    });
  } catch (error: any) {
    console.error("[Amplemarket User Scope] Error fetching sequences:", {
      status: error.response?.status,
      message: error.message
    });
    throw new Error(`Failed to fetch Amplemarket sequences: ${error.message}`);
  }

  const result = {
    listIds: userLists.map(l => l.id),
    sequenceIds: userSequences.map(s => s.id),
    lists: userLists.map(l => ({
      id: l.id,
      name: l.name,
      owner: l.owner,
      shared: l.shared || false
    })),
    sequences: userSequences.map(s => ({
      id: s.id,
      name: s.name,
      createdBy: s.created_by_user_email
    }))
  };

  console.log("[Amplemarket User Scope] Scope result:", {
    listIds: result.listIds.length,
    sequenceIds: result.sequenceIds.length
  });

  return result;
}
