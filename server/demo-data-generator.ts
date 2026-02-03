import * as db from "./db";
import { nanoid } from "nanoid";

const DEMO_COMPANIES = [
  { name: "Acme Corp", domain: "acme.com", industry: "Technology", employees: "50-200", revenue: "$5M-$10M" },
  { name: "TechStart Inc", domain: "techstart.io", industry: "Software", employees: "10-50", revenue: "$1M-$5M" },
  { name: "Global Solutions", domain: "globalsolutions.com", industry: "Consulting", employees: "200-500", revenue: "$10M-$50M" },
  { name: "Innovate Labs", domain: "innovatelabs.com", industry: "R&D", employees: "10-50", revenue: "$1M-$5M" },
  { name: "DataFlow Systems", domain: "dataflow.io", industry: "Data Analytics", employees: "50-200", revenue: "$5M-$10M" },
  { name: "CloudNine Services", domain: "cloudnine.com", industry: "Cloud Computing", employees: "100-500", revenue: "$10M-$50M" },
  { name: "NextGen Marketing", domain: "nextgenmarketing.com", industry: "Marketing", employees: "20-50", revenue: "$1M-$5M" },
  { name: "Velocity Partners", domain: "velocitypartners.com", industry: "Consulting", employees: "50-100", revenue: "$5M-$10M" },
];

const FIRST_NAMES = ["John", "Sarah", "Michael", "Emily", "David", "Jessica", "Robert", "Jennifer", "William", "Lisa", "James", "Mary", "Thomas", "Patricia", "Christopher", "Nancy", "Daniel", "Linda", "Matthew", "Elizabeth"];
const LAST_NAMES = ["Smith", "Johnson", "Williams", "Brown", "Jones", "Garcia", "Miller", "Davis", "Rodriguez", "Martinez", "Hernandez", "Lopez", "Gonzalez", "Wilson", "Anderson", "Thomas", "Taylor", "Moore", "Jackson", "Martin"];
const TITLES = ["CEO", "CTO", "VP of Sales", "Head of Marketing", "Product Manager", "Engineering Manager", "Sales Director", "Marketing Director", "Operations Manager", "Business Development Manager"];

const FUNNEL_STAGES = ["prospected", "engaged", "active", "waiting", "dormant", "closedWon", "closedLost"];

const MOMENT_TYPES = ["email", "call", "meeting", "note"];

function randomElement<T>(array: T[]): T {
  return array[Math.floor(Math.random() * array.length)]!;
}

function randomDate(daysAgo: number): Date {
  const now = Date.now();
  const randomDays = Math.floor(Math.random() * daysAgo);
  return new Date(now - randomDays * 24 * 60 * 60 * 1000);
}

export async function generateDemoData(tenantId: string) {
  console.log("[Demo] Starting demo data generation for tenant:", tenantId);

  // Generate contacts
  const people: any[] = [];
  for (let i = 0; i < 25; i++) {
    const firstName = randomElement(FIRST_NAMES);
    const lastName = randomElement(LAST_NAMES);
    const company = randomElement(DEMO_COMPANIES);
    const email = `${firstName.toLowerCase()}.${lastName.toLowerCase()}@${company.domain}`;
    
    const person = await db.createPerson({
      tenantId,
      fullName: `${firstName} ${lastName}`,
      firstName,
      lastName,
      primaryEmail: email,
      secondaryEmails: [],
      companyName: company.name,
      roleTitle: randomElement(TITLES),
      manuallyAddedNumber: `+1${Math.floor(Math.random() * 9000000000 + 1000000000)}`,
      linkedinUrl: `https://linkedin.com/in/${firstName.toLowerCase()}-${lastName.toLowerCase()}`,
      tags: ["demo-data"],
    });
    
    people.push(person);
    console.log(`[Demo] Created person: ${person.fullName}`);
  }

  // Generate threads (deals)
  const threads: any[] = [];
  for (let i = 0; i < 15; i++) {
    const person = randomElement(people);
    const stage = randomElement(FUNNEL_STAGES);
    
    const thread = await db.createThread({
      tenantId,
      personId: person.id,
      source: "demo",
      intent: `${randomElement(["Partnership", "Sales", "Consulting", "Project"])} Discussion with ${person.company}`,
      title: `${randomElement(["Partnership", "Sales", "Consulting", "Project"])} Discussion with ${person.company}`,
      status: stage === "closedWon" || stage === "closedLost" ? "closed" : "active",
      dealSignal: {
        value_estimate: Math.floor(Math.random() * 100000) + 10000,
        confidence: randomElement(["low", "medium", "high"] as const),
      },
    });
    
    threads.push(thread);
    console.log(`[Demo] Created thread: ${thread.title} (${thread.status})`);
  }

  // Generate moments
  for (const thread of threads) {
    const momentCount = Math.floor(Math.random() * 5) + 2;
    
    for (let i = 0; i < momentCount; i++) {
      const type = randomElement(MOMENT_TYPES);
      const timestamp = randomDate(60);
      
      let momentType: "email_sent" | "email_received" | "reply_received" | "call_completed" | "meeting_held" | "note_added" = "note_added";
      let summary = "";
      
      switch (type) {
        case "email":
          momentType = "email_sent";
          summary = `Sent email about ${randomElement(["proposal", "follow-up", "introduction", "demo request"])}`;
          break;
        case "call":
          momentType = "call_completed";
          summary = `${randomElement(["Discovery", "Follow-up", "Demo", "Closing"])} call - Discussed ${randomElement(["requirements", "timeline", "pricing", "next steps"])}`;
          break;
        case "meeting":
          momentType = "meeting_held";
          summary = `${randomElement(["Initial", "Follow-up", "Demo", "Closing"])} meeting - Met to discuss ${randomElement(["partnership opportunities", "project scope", "implementation plan", "contract terms"])}`;
          break;
        case "note":
          momentType = "note_added";
          summary = `Note: ${randomElement(["Interested in Q2", "Budget approved", "Waiting for decision", "Strong fit"])}`;
          break;
      }
      
      await db.createMoment({
        tenantId,
        threadId: thread.id,
        personId: thread.personId,
        source: "demo",
        type: momentType,
        timestamp,
        metadata: { summary },
      });
    }
  }

  // Generate next actions
  for (const thread of threads) {
    if (["prospected", "engaged", "active", "waiting"].includes(thread.funnelStage)) {
      const daysFromNow = Math.floor(Math.random() * 14) - 7; // -7 to +7 days
      const dueAt = new Date(Date.now() + daysFromNow * 24 * 60 * 60 * 1000);
      
      await db.createNextAction({
        tenantId,
        threadId: thread.id,
        actionType: "manual",
        triggerType: "manual",
        triggerValue: `${randomElement(["Follow up on", "Schedule", "Send", "Review"])} ${randomElement(["proposal", "demo", "contract", "pricing"])}`,
        dueAt,
        status: "open",
      });
    }
  }

  console.log("[Demo] Demo data generation complete!");
  console.log(`[Demo] Created ${people.length} contacts, ${threads.length} threads, and ${threads.length * 3} moments`);
  
  return {
    peopleCount: people.length,
    threadsCount: threads.length,
    momentsCount: threads.length * 3,
  };
}

export async function clearDemoData(tenantId: string) {
  console.log("[Demo] Clearing demo data for tenant:", tenantId);
  console.log("[Demo] Note: Demo data clearing requires manual database cleanup or delete functions to be implemented");
  
  // Get all demo-tagged items for counting
  const people = await db.getPeopleBySource(tenantId, "demo");
  const threads = await db.getThreadsByTenant(tenantId);
  const demoThreads = threads.filter((t: any) => t.tags?.includes("demo-data"));
  
  console.log("[Demo] Found demo data to clear:");
  console.log(`[Demo] - ${people.length} people`);
  console.log(`[Demo] - ${demoThreads.length} threads`);
  
  // TODO: Implement delete functions in db.ts or use direct SQL
  // For now, return counts without deleting
  
  return {
    peopleFound: people.length,
    threadsFound: demoThreads.length,
    message: "Delete functions not yet implemented. Use database UI to clear demo data.",
  };
}
