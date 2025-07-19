#!/usr/bin/env node

/**
 * Data Retention Cron Job
 * Run this script daily to perform automated data cleanup according to retention policies
 * 
 * Usage:
 *   node scripts/data-retention-cron.js
 * 
 * Cron Schedule Example (run daily at 2 AM):
 *   0 2 * * * cd /path/to/app && node scripts/data-retention-cron.js
 */

import dotenv from 'dotenv';
import { DataRetentionService } from '../api/services/dataRetentionService.js';

// Load environment variables
dotenv.config();

async function runDataRetentionCleanup() {
  console.log('=== Data Retention Cleanup Job Started ===');
  console.log(`Timestamp: ${new Date().toISOString()}`);
  
  try {
    // Run all cleanup tasks
    const results = await DataRetentionService.scheduleCleanup();
    
    console.log('\n=== Cleanup Results ===');
    console.log(`Total tasks: ${Object.keys(results.tasks).length}`);
    
    let totalCleaned = 0;
    let successfulTasks = 0;
    
    for (const [taskName, result] of Object.entries(results.tasks)) {
      console.log(`\n${taskName}:`);
      console.log(`  Success: ${result.success}`);
      console.log(`  Records cleaned: ${result.cleaned_records || 0}`);
      
      if (result.error) {
        console.log(`  Error: ${result.error}`);
      }
      
      if (result.success) {
        successfulTasks++;
        totalCleaned += result.cleaned_records || 0;
      }
    }
    
    console.log('\n=== Summary ===');
    console.log(`Successful tasks: ${successfulTasks}/${Object.keys(results.tasks).length}`);
    console.log(`Total records cleaned: ${totalCleaned}`);
    
    // Exit with appropriate code
    if (successfulTasks === Object.keys(results.tasks).length) {
      console.log('✅ All cleanup tasks completed successfully');
      process.exit(0);
    } else {
      console.log('⚠️  Some cleanup tasks failed');
      process.exit(1);
    }
    
  } catch (error) {
    console.error('❌ Data retention cleanup job failed:', error);
    console.error('Stack trace:', error.stack);
    process.exit(1);
  }
}

// Handle process signals
process.on('SIGINT', () => {
  console.log('\n🛑 Data retention cleanup job interrupted');
  process.exit(1);
});

process.on('SIGTERM', () => {
  console.log('\n🛑 Data retention cleanup job terminated');
  process.exit(1);
});

// Run the cleanup
runDataRetentionCleanup();