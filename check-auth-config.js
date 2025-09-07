const { createClient } = require('@supabase/supabase-js')
require('dotenv').config()

const supabaseUrl = process.env.SUPABASE_URL
const supabaseKey = process.env.SUPABASE_SERVICE_KEY

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Missing Supabase credentials in environment variables')
  console.error('Please set SUPABASE_URL and SUPABASE_SERVICE_KEY in your .env file')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseKey)

async function checkAuthConfig() {
  console.log('Checking Supabase Auth Configuration...')
  
  try {
    // Check if we can connect to Supabase
    const { data: { session }, error } = await supabase.auth.getSession()
    
    if (error) {
      console.error('Error getting session:', error)
    } else {
      console.log('✓ Supabase connection successful')
    }
    
    // Check auth settings
    console.log('\n--- Supabase Client Configuration ---')
    console.log('URL:', supabaseUrl)
    console.log('Auth flow type:', 'pkce') // From lib/supabase.ts
    console.log('Auto refresh token:', true)
    console.log('Persist session:', true)
    console.log('Detect session in URL:', true)
    
    console.log('\n--- Password Reset Configuration ---')
    console.log('Development redirect URL: http://localhost:8080/reset-password')
    console.log('Production redirect URL: {origin}/reset-password')
    
    console.log('\n--- Expected URL Parameters ---')
    console.log('PKCE Flow: ?token=xxx&type=recovery&redirect_to=xxx')
    console.log('Traditional Flow: ?access_token=xxx&refresh_token=xxx&type=recovery')
    
    console.log('\n--- Recommendations ---')
    console.log('1. Make sure your Supabase dashboard has the correct Site URL configured')
    console.log('2. Add http://localhost:8080 to redirect URLs in Supabase Auth settings')
    console.log('3. Ensure PKCE flow is enabled in Supabase Auth settings')
    
  } catch (error) {
    console.error('Error checking auth config:', error)
  }
}

checkAuthConfig()
