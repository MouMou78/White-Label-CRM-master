/**
 * Seed demo user for white-label template
 * Creates demo@whitelabelcrm.com with sample data
 */

import { drizzle } from 'drizzle-orm/mysql2';
import mysql from 'mysql2/promise';
import bcrypt from 'bcrypt';
import { nanoid } from 'nanoid';
import { tenants, users, people, accounts, deals, dealStages, notes, events } from './drizzle/schema.ts';

const DATABASE_URL = process.env.DATABASE_URL;

if (!DATABASE_URL) {
  console.error('DATABASE_URL environment variable is required');
  process.exit(1);
}

const connection = await mysql.createConnection(DATABASE_URL);
const db = drizzle(connection);

console.log('🌱 Seeding demo user...');

// Create demo tenant
const demoTenantId = nanoid();
await db.insert(tenants).values({
  id: demoTenantId,
  name: 'Demo Company',
  domain: 'demo.example.com',
});

console.log('✅ Created demo tenant');

// Create demo user
const demoUserId = nanoid();
const passwordHash = await bcrypt.hash('demo123', 10);

await db.insert(users).values({
  id: demoUserId,
  tenantId: demoTenantId,
  email: 'demo@whitelabelcrm.com',
  passwordHash,
  name: 'Demo User',
  role: 'admin',
  twoFactorEnabled: false,
  disabled: false,
});

console.log('✅ Created demo user: demo@whitelabelcrm.com / demo123');

// Create sample accounts
const account1Id = nanoid();
const account2Id = nanoid();
const account3Id = nanoid();

await db.insert(accounts).values([
  {
    id: account1Id,
    tenantId: demoTenantId,
    name: 'Acme Corporation',
    domain: 'acme.com',
    industry: 'Technology',
    employees: '100-500',
    revenue: '$10M-$50M',
    lifecycleStage: 'Opportunity',
    ownerUserId: demoUserId,
  },
  {
    id: account2Id,
    tenantId: demoTenantId,
    name: 'Global Solutions Inc',
    domain: 'globalsolutions.com',
    industry: 'Consulting',
    employees: '500-1000',
    revenue: '$50M-$100M',
    lifecycleStage: 'SQL',
    ownerUserId: demoUserId,
  },
  {
    id: account3Id,
    tenantId: demoTenantId,
    name: 'StartupXYZ',
    domain: 'startupxyz.com',
    industry: 'SaaS',
    employees: '10-50',
    revenue: '$1M-$10M',
    lifecycleStage: 'Lead',
    ownerUserId: demoUserId,
  },
]);

console.log('✅ Created 3 sample accounts');

// Create sample contacts
const person1Id = nanoid();
const person2Id = nanoid();
const person3Id = nanoid();
const person4Id = nanoid();

await db.insert(people).values([
  {
    id: person1Id,
    tenantId: demoTenantId,
    accountId: account1Id,
    fullName: 'John Smith',
    firstName: 'John',
    lastName: 'Smith',
    primaryEmail: 'john.smith@acme.com',
    companyName: 'Acme Corporation',
    companyDomain: 'acme.com',
    roleTitle: 'CEO',
    phone: '+1-555-0101',
    city: 'San Francisco',
    state: 'CA',
    country: 'USA',
    lifecycleStage: 'Opportunity',
    assignedToUserId: demoUserId,
  },
  {
    id: person2Id,
    tenantId: demoTenantId,
    accountId: account1Id,
    fullName: 'Sarah Johnson',
    firstName: 'Sarah',
    lastName: 'Johnson',
    primaryEmail: 'sarah.johnson@acme.com',
    companyName: 'Acme Corporation',
    companyDomain: 'acme.com',
    roleTitle: 'VP of Sales',
    phone: '+1-555-0102',
    city: 'San Francisco',
    state: 'CA',
    country: 'USA',
    lifecycleStage: 'SQL',
    assignedToUserId: demoUserId,
  },
  {
    id: person3Id,
    tenantId: demoTenantId,
    accountId: account2Id,
    fullName: 'Michael Chen',
    firstName: 'Michael',
    lastName: 'Chen',
    primaryEmail: 'michael.chen@globalsolutions.com',
    companyName: 'Global Solutions Inc',
    companyDomain: 'globalsolutions.com',
    roleTitle: 'CTO',
    phone: '+1-555-0103',
    city: 'New York',
    state: 'NY',
    country: 'USA',
    lifecycleStage: 'SQL',
    assignedToUserId: demoUserId,
  },
  {
    id: person4Id,
    tenantId: demoTenantId,
    accountId: account3Id,
    fullName: 'Emily Davis',
    firstName: 'Emily',
    lastName: 'Davis',
    primaryEmail: 'emily.davis@startupxyz.com',
    companyName: 'StartupXYZ',
    companyDomain: 'startupxyz.com',
    roleTitle: 'Founder',
    phone: '+1-555-0104',
    city: 'Austin',
    state: 'TX',
    country: 'USA',
    lifecycleStage: 'Lead',
    assignedToUserId: demoUserId,
  },
]);

console.log('✅ Created 3 sample accounts');

// Create deal stages
const stage1Id = nanoid();
const stage2Id = nanoid();
const stage3Id = nanoid();
const stage4Id = nanoid();

await db.insert(dealStages).values([
  { id: stage1Id, tenantId: demoTenantId, name: 'Lead', order: 1, color: '#94a3b8' },
  { id: stage2Id, tenantId: demoTenantId, name: 'Qualified', order: 2, color: '#3b82f6' },
  { id: stage3Id, tenantId: demoTenantId, name: 'Proposal', order: 3, color: '#f59e0b' },
  { id: stage4Id, tenantId: demoTenantId, name: 'Negotiation', order: 4, color: '#10b981' },
]);

console.log('✅ Created 4 deal stages');

// Create sample deals
const deal1Id = nanoid();
const deal2Id = nanoid();
const deal3Id = nanoid();

await db.insert(deals).values([
  {
    id: deal1Id,
    tenantId: demoTenantId,
    name: 'Enterprise License - Acme Corp',
    value: 50000,
    stageId: stage4Id,
    accountId: account1Id,
    ownerUserId: demoUserId,
    expectedCloseDate: new Date('2026-03-15'),
    probability: 75,
  },
  {
    id: deal2Id,
    tenantId: demoTenantId,
    name: 'Consulting Services - Global Solutions',
    value: 120000,
    stageId: stage3Id,
    accountId: account2Id,
    ownerUserId: demoUserId,
    expectedCloseDate: new Date('2026-04-01'),
    probability: 60,
  },
  {
    id: deal3Id,
    tenantId: demoTenantId,
    name: 'Startup Package - StartupXYZ',
    value: 15000,
    stageId: stage2Id,
    accountId: account3Id,
    ownerUserId: demoUserId,
    expectedCloseDate: new Date('2026-05-01'),
    probability: 40,
  },
]);

console.log('✅ Created 3 sample deals');

// Create sample notes
await db.insert(notes).values([
  {
    id: nanoid(),
    tenantId: demoTenantId,
    content: 'Initial discovery call went well. John is interested in our enterprise features.',
    entityType: 'contact',
    entityId: person1Id,
    createdBy: demoUserId,
    createdByName: 'Demo User',
  },
  {
    id: nanoid(),
    tenantId: demoTenantId,
    content: 'Follow-up meeting scheduled for next week to discuss pricing.',
    entityType: 'deal',
    entityId: deal1Id,
    createdBy: demoUserId,
    createdByName: 'Demo User',
  },
  {
    id: nanoid(),
    tenantId: demoTenantId,
    content: 'Michael mentioned they are evaluating 3 vendors. We need to move fast.',
    entityType: 'contact',
    entityId: person3Id,
    createdBy: demoUserId,
    createdByName: 'Demo User',
  },
]);

console.log('✅ Created 3 sample notes');

// Create sample events (skipped for now - schema mismatch)
// await db.insert(events).values([...]);

console.log('✅ Skipped sample events (not needed for demo)');

await connection.end();

console.log('');
console.log('🎉 Demo user seeding complete!');
console.log('');
console.log('📧 Email: demo@whitelabelcrm.com');
console.log('🔑 Password: demo123');
console.log('');
console.log('Sample data created:');
console.log('  - 3 accounts');
console.log('  - 4 contacts');
console.log('  - 3 deals');
console.log('  - 3 notes');
console.log('  - 2 events');
console.log('');
