#!/usr/bin/env node
/**
 * Clear all test data from the database
 * This script will delete all contacts, companies, deals, activities, and notes
 * Use with caution - this cannot be undone!
 */

import { drizzle } from 'drizzle-orm/mysql2';
import mysql from 'mysql2/promise';
import { people, accounts, deals, activities, notes, dealStages, moments, nextActions, threads, tasks } from '../drizzle/schema.ts';

async function clearTestData() {
  console.log('🗑️  Starting database cleanup...\n');

  // Create database connection
  const connection = await mysql.createConnection(process.env.DATABASE_URL);
  const db = drizzle(connection);

  try {
    // Delete in order to respect foreign key constraints
    console.log('Deleting activities...');
    const activitiesResult = await db.delete(activities);
    console.log(`✅ Deleted ${activitiesResult[0].affectedRows || 0} activities`);

    console.log('Deleting notes...');
    const notesResult = await db.delete(notes);
    console.log(`✅ Deleted ${notesResult[0].affectedRows || 0} notes`);

    console.log('Deleting deals...');
    const dealsResult = await db.delete(deals);
    console.log(`✅ Deleted ${dealsResult[0].affectedRows || 0} deals`);

    console.log('Deleting contacts (people)...');
    const peopleResult = await db.delete(people);
    console.log(`✅ Deleted ${peopleResult[0].affectedRows || 0} contacts`);

    console.log('Deleting tasks...');
    const tasksResult = await db.delete(tasks);
    console.log(`✅ Deleted ${tasksResult[0].affectedRows || 0} tasks`);

    console.log('Deleting next actions...');
    const nextActionsResult = await db.delete(nextActions);
    console.log(`✅ Deleted ${nextActionsResult[0].affectedRows || 0} next actions`);

    console.log('Deleting moments...');
    const momentsResult = await db.delete(moments);
    console.log(`✅ Deleted ${momentsResult[0].affectedRows || 0} moments`);

    console.log('Deleting threads...');
    const threadsResult = await db.delete(threads);
    console.log(`✅ Deleted ${threadsResult[0].affectedRows || 0} threads`);

    console.log('Deleting accounts (companies)...');
    const accountsResult = await db.delete(accounts);
    console.log(`✅ Deleted ${accountsResult[0].affectedRows || 0} accounts`);

    console.log('Deleting deal stages...');
    const stagesResult = await db.delete(dealStages);
    console.log(`✅ Deleted ${stagesResult[0].affectedRows || 0} deal stages`);

    console.log('\n✨ Database cleanup complete! All test data has been removed.');
    console.log('💡 You can now start fresh with your own data.\n');

  } catch (error) {
    console.error('❌ Error during cleanup:', error);
    throw error;
  } finally {
    await connection.end();
  }
}

// Run the cleanup
clearTestData()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error('Fatal error:', error);
    process.exit(1);
  });
