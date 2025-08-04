import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import fs from 'fs';

// Load environment variables
dotenv.config({ path: '.env.production' });

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Missing Supabase environment variables');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

console.log('🔧 Setting up Push Subscriptions Table');
console.log('====================================');

async function setupPushSubscriptionsTable() {
  try {
    console.log('📋 Reading SQL file...');
    const sqlContent = fs.readFileSync('./create_push_subscriptions_table.sql', 'utf8');
    
    console.log('📤 Executing SQL commands...');
    
    // Split SQL into individual commands
    const sqlCommands = sqlContent
      .split(';')
      .map(cmd => cmd.trim())
      .filter(cmd => cmd.length > 0 && !cmd.startsWith('--'));
    
    console.log(`📊 Found ${sqlCommands.length} SQL commands to execute`);
    
    for (let i = 0; i < sqlCommands.length; i++) {
      const command = sqlCommands[i];
      if (command) {
        console.log(`⚡ Executing command ${i + 1}/${sqlCommands.length}...`);
        
        const { error } = await supabase.rpc('exec_sql', { 
          sql: command + ';' 
        });
        
        if (error) {
          console.error(`❌ Command ${i + 1} failed:`, error);
          // Don't exit, continue with other commands
        } else {
          console.log(`✅ Command ${i + 1} completed successfully`);
        }
      }
    }
    
    console.log('\n🎉 Push Subscriptions Table setup completed!');
    
    // Test the table creation
    console.log('\n📋 Testing table creation...');
    const { data, error } = await supabase
      .from('push_subscriptions')
      .select('count(*)')
      .limit(1);
    
    if (error) {
      console.error('❌ Table test failed:', error);
    } else {
      console.log('✅ Table created successfully and accessible');
    }
    
  } catch (error) {
    console.error('❌ Setup failed:', error);
  }
}

// Run the setup
setupPushSubscriptionsTable();
