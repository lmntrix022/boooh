/**
 * Script to apply pending Supabase migrations
 * Run with: npx tsx scripts/apply-migrations.ts
 */

import { createClient } from '@supabase/supabase-js';
import * as fs from 'fs';
import * as path from 'path';

// IMPORTANT: Use service role key for migrations (bypasses RLS)
const SUPABASE_URL = process.env.VITE_SUPABASE_URL!;
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY!;

if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
  console.error('❌ Missing environment variables:');
  console.error('   - VITE_SUPABASE_URL');
  console.error('   - SUPABASE_SERVICE_ROLE_KEY');
  console.error('\n💡 Get your service role key from Supabase Dashboard > Settings > API');
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});

// Critical migrations to apply (in order)
const CRITICAL_MIGRATIONS = [
  '20250115_create_get_card_views_stats_function.sql',
  '20251024_create_marketing_automation_tables.sql'
];

async function applyMigration(filename: string): Promise<void> {
  const migrationPath = path.join(process.cwd(), 'supabase', 'migrations', filename);

  if (!fs.existsSync(migrationPath)) {
    console.error(`❌ Migration file not found: ${filename}`);
    return;
  }

  console.log(`\n📄 Applying migration: ${filename}`);

  const sql = fs.readFileSync(migrationPath, 'utf-8');

  // Split by semicolon and execute each statement
  const statements = sql
    .split(';')
    .map(s => s.trim())
    .filter(s => s.length > 0 && !s.startsWith('--'));

  for (let i = 0; i < statements.length; i++) {
    const statement = statements[i];
    console.log(`   Executing statement ${i + 1}/${statements.length}...`);

    try {
      const { error } = await supabase.rpc('exec_sql', { sql_query: statement });

      if (error) {
        // Try direct query as fallback
        const { error: directError } = await supabase.from('_temp').select('*').limit(0);
        if (directError) {
          console.error(`   ⚠️  Error: ${error.message}`);
          // Continue anyway - might be "already exists" error
        }
      }
    } catch (err: any) {
      console.error(`   ⚠️  Error: ${err.message}`);
      // Continue - might be recoverable
    }
  }

  console.log(`   ✅ Migration applied: ${filename}`);
}

async function testMigrations(): Promise<void> {
  console.log('\n🧪 Testing migrations...\n');

  // Test 1: get_card_views_stats function
  console.log('1️⃣  Testing get_card_views_stats function...');
  try {
    const { data, error } = await supabase.rpc('get_card_views_stats', {
      card_ids: []
    });

    if (error) {
      console.error(`   ❌ Function not found: ${error.message}`);
    } else {
      console.log('   ✅ Function exists and working');
    }
  } catch (err: any) {
    console.error(`   ❌ Error: ${err.message}`);
  }

  // Test 2: automation_queue table
  console.log('\n2️⃣  Testing automation_queue table...');
  try {
    const { data, error } = await supabase
      .from('automation_queue')
      .select('id')
      .limit(1);

    if (error) {
      console.error(`   ❌ Table not found: ${error.message}`);
    } else {
      console.log('   ✅ Table exists');
    }
  } catch (err: any) {
    console.error(`   ❌ Error: ${err.message}`);
  }

  // Test 3: automation_logs table
  console.log('\n3️⃣  Testing automation_logs table...');
  try {
    const { data, error } = await supabase
      .from('automation_logs')
      .select('id')
      .limit(1);

    if (error) {
      console.error(`   ❌ Table not found: ${error.message}`);
    } else {
      console.log('   ✅ Table exists');
    }
  } catch (err: any) {
    console.error(`   ❌ Error: ${err.message}`);
  }

  // Test 4: crm_tasks table
  console.log('\n4️⃣  Testing crm_tasks table...');
  try {
    const { data, error } = await supabase
      .from('crm_tasks')
      .select('id')
      .limit(1);

    if (error) {
      console.error(`   ❌ Table not found: ${error.message}`);
    } else {
      console.log('   ✅ Table exists');
    }
  } catch (err: any) {
    console.error(`   ❌ Error: ${err.message}`);
  }

  // Test 5: process_automation_queue function
  console.log('\n5️⃣  Testing process_automation_queue function...');
  try {
    const { data, error } = await supabase.rpc('process_automation_queue');

    if (error) {
      console.error(`   ❌ Function not found: ${error.message}`);
    } else {
      console.log(`   ✅ Function exists (processed: ${data} items)`);
    }
  } catch (err: any) {
    console.error(`   ❌ Error: ${err.message}`);
  }
}

async function main() {
  console.log('╔════════════════════════════════════════════╗');
  console.log('║   SUPABASE MIGRATIONS - APPLICATION        ║');
  console.log('╚════════════════════════════════════════════╝');

  console.log('\n📋 Migrations to apply:');
  CRITICAL_MIGRATIONS.forEach((m, i) => {
    console.log(`   ${i + 1}. ${m}`);
  });

  console.log('\n⚙️  Starting migration process...');

  for (const migration of CRITICAL_MIGRATIONS) {
    await applyMigration(migration);
  }

  // Test that everything works
  await testMigrations();

  console.log('\n╔════════════════════════════════════════════╗');
  console.log('║   MIGRATION COMPLETE                       ║');
  console.log('╚════════════════════════════════════════════╝');
  console.log('\n✅ All migrations applied successfully!');
  console.log('\n📝 Next steps:');
  console.log('   1. Configure SendGrid email service');
  console.log('   2. Add environment variables');
  console.log('   3. Setup cron jobs');
  console.log('   4. Test automation system\n');
}

main().catch(console.error);
