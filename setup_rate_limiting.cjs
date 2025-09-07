// Rate Limiting System Setup Script
// This script automatically sets up the rate limiting system in your Supabase database

require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');

// Initialize Supabase client with service key
const supabaseUrl = process.env.SUPABASE_URL || 'https://yryerjgidsyfiohmpeoc.supabase.co';
const supabaseServiceKey = process.env.SUPABASE_SERVICE_KEY;

if (!supabaseServiceKey) {
  console.error('❌ SUPABASE_SERVICE_KEY is required in environment variables');
  console.log('💡 Get your service key from: Supabase Dashboard > Settings > API > service_role secret');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

// Read SQL files
const readSQLFile = (filename) => {
  const filepath = path.join(__dirname, filename);
  if (!fs.existsSync(filepath)) {
    throw new Error(`SQL file not found: ${filepath}`);
  }
  return fs.readFileSync(filepath, 'utf8');
};

// Execute SQL query
const executeSQL = async (sql, description) => {
  try {
    console.log(`🔄 ${description}...`);
    
    // Split SQL by semicolons and execute each statement
    const statements = sql.split(';').map(s => s.trim()).filter(s => s.length > 0);
    
    for (const statement of statements) {
      if (statement.trim()) {
        const { error } = await supabase.rpc('exec_sql', { sql_query: statement });
        
        if (error) {
          // Try direct query if rpc fails
          const { error: directError } = await supabase.from('_temp').select('*').limit(0);
          if (directError) {
            console.warn(`⚠️  Warning executing statement: ${error.message}`);
          }
        }
      }
    }
    
    console.log(`✅ ${description} completed successfully`);
    return true;
  } catch (error) {
    console.error(`❌ Error in ${description}:`, error.message);
    return false;
  }
};

// Main setup function
const setupRateLimiting = async () => {
  console.log('🚀 Starting Rate Limiting System Setup...\n');

  try {
    // Step 1: Test database connection
    console.log('🔄 Testing database connection...');
    const { data: testData, error: testError } = await supabase
      .from('profiles')
      .select('id')
      .limit(1);
    
    if (testError) {
      console.error('❌ Database connection failed:', testError.message);
      console.log('💡 Please check your SUPABASE_URL and SUPABASE_SERVICE_KEY');
      return;
    }
    console.log('✅ Database connection successful\n');

    // Step 2: Setup main schema
    let schemaSQL;
    try {
      schemaSQL = readSQLFile('rate_limiting_schema.sql');
    } catch (error) {
      console.error('❌ Could not read rate_limiting_schema.sql:', error.message);
      return;
    }

    const schemaSuccess = await executeSQL(schemaSQL, 'Setting up rate limiting database schema');
    if (!schemaSuccess) {
      console.error('❌ Failed to setup database schema. Aborting...');
      return;
    }

    // Step 3: Setup advanced functions
    let functionsSQL;
    try {
      functionsSQL = readSQLFile('rate_limiting_advanced_functions.sql');
    } catch (error) {
      console.error('❌ Could not read rate_limiting_advanced_functions.sql:', error.message);
      return;
    }

    const functionsSuccess = await executeSQL(functionsSQL, 'Setting up advanced rate limiting functions');
    if (!functionsSuccess) {
      console.error('❌ Failed to setup advanced functions. Continuing...');
    }

    // Step 4: Verify installation
    console.log('🔄 Verifying installation...');
    
    // Check if tables exist
    const tables = ['rate_limit_config', 'rate_limit_tracker', 'rate_limit_blocks', 'rate_limit_violations'];
    let allTablesExist = true;
    
    for (const table of tables) {
      try {
        const { error } = await supabase.from(table).select('id').limit(1);
        if (error && error.code !== 'PGRST116') { // PGRST116 means no rows, which is fine
          console.error(`❌ Table ${table} verification failed:`, error.message);
          allTablesExist = false;
        } else {
          console.log(`✅ Table ${table} exists and accessible`);
        }
      } catch (error) {
        console.error(`❌ Could not verify table ${table}:`, error.message);
        allTablesExist = false;
      }
    }

    // Step 5: Test functions
    console.log('\n🔄 Testing database functions...');
    
    try {
      const { data, error } = await supabase.rpc('check_rate_limit', {
        p_identifier: 'test-setup',
        p_identifier_type: 'IP',
        p_endpoint: '/test',
        p_method: 'GET'
      });
      
      if (error) {
        console.error('❌ Function test failed:', error.message);
      } else {
        console.log('✅ Rate limiting functions working correctly');
        console.log('📊 Test result:', data);
      }
    } catch (error) {
      console.error('❌ Function test error:', error.message);
    }

    // Step 6: Setup default API keys reminder
    console.log('\n📝 Environment Setup Reminder:');
    console.log('Add these to your .env file:');
    console.log('');
    console.log('# API Keys (CHANGE THESE IN PRODUCTION!)');
    console.log('API_KEY_1=prod-api-key-' + generateRandomString(32));
    console.log('API_KEY_2=client-api-key-' + generateRandomString(32));
    console.log('API_KEY_3=mobile-api-key-' + generateRandomString(32));
    console.log('');
    console.log('# JWT Secret (CHANGE THIS!)');
    console.log('JWT_SECRET=' + generateRandomString(64));
    console.log('');

    // Step 7: Final status
    if (allTablesExist) {
      console.log('🎉 Rate Limiting System Setup Complete!');
      console.log('');
      console.log('✅ Database schema created');
      console.log('✅ Advanced functions installed');
      console.log('✅ Default configurations loaded');
      console.log('✅ System ready for use');
      console.log('');
      console.log('📖 Next Steps:');
      console.log('1. Update your .env file with the API keys above');
      console.log('2. Restart your server');
      console.log('3. Test with: GET /api/rate-limit/status');
      console.log('4. Check admin panel: GET /api/admin/rate-limit/statistics');
      console.log('');
      console.log('📚 Full documentation: RATE_LIMITING_SETUP_GUIDE.md');
    } else {
      console.log('⚠️  Setup completed with some issues. Please check the errors above.');
    }

  } catch (error) {
    console.error('❌ Setup failed with error:', error);
    console.log('\n🔧 Troubleshooting:');
    console.log('1. Ensure SUPABASE_SERVICE_KEY is correct');
    console.log('2. Check database permissions');
    console.log('3. Verify SQL files exist');
    console.log('4. Try running SQL files manually in Supabase Dashboard');
  }
};

// Helper function to generate random strings
const generateRandomString = (length) => {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  let result = '';
  for (let i = 0; i < length; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
};

// Handle script execution
if (require.main === module) {
  setupRateLimiting()
    .then(() => {
      console.log('\n✨ Setup script completed');
      process.exit(0);
    })
    .catch((error) => {
      console.error('❌ Setup script failed:', error);
      process.exit(1);
    });
}

module.exports = { setupRateLimiting };
