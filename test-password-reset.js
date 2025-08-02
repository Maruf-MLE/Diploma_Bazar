import { createClient } from '@supabase/supabase-js'

const supabaseUrl = 'https://yryerjgidsyfiohmpeoc.supabase.co'
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InlyeWVyamdpZHN5ZmlvaG1wZW9jIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTA5NjA1NTIsImV4cCI6MjA2NjUzNjU1Mn0.S2ki-0QyFabstnVnTh9qFiHoz7sqBZgkfPThn77wTno'

// Create Supabase client with same config as the app
const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: true,
    flowType: 'pkce',
    debug: true,
    storageKey: 'supabase-auth',
  }
})

async function testPasswordReset() {
  console.log('Testing Password Reset Functionality...\n')
  
  // Test email - change this to your test email
  const testEmail = 'test@example.com'
  
  try {
    console.log(`Sending password reset email to: ${testEmail}`)
    console.log('Redirect URL: http://localhost:8080/reset-password\n')
    
    const { data, error } = await supabase.auth.resetPasswordForEmail(
      testEmail,
      {
        redirectTo: 'http://localhost:8080/reset-password',
      }
    )
    
    if (error) {
      console.error('❌ Error sending password reset email:', error)
      console.error('Error details:', error.message)
      
      if (error.message.includes('rate limit')) {
        console.log('\n📧 Rate limit reached. Wait a moment before trying again.')
      } else if (error.message.includes('not found')) {
        console.log('\n📧 Email not registered in the system.')
      }
    } else {
      console.log('✅ Password reset email sent successfully!')
      console.log('Data:', data)
      
      console.log('\n📧 Check your email for the reset link.')
      console.log('The link should look like:')
      console.log('https://yryerjgidsyfiohmpeoc.supabase.co/auth/v1/verify?token=xxx&type=recovery&redirect_to=http://localhost:8080/reset-password')
      
      console.log('\n🔧 When you click the link, it should redirect to:')
      console.log('http://localhost:8080/reset-password?token=xxx&type=recovery')
      
      console.log('\n✨ Our updated ResetPasswordPage should now handle this correctly!')
    }
    
  } catch (error) {
    console.error('❌ Unexpected error:', error)
  }
}

// Run the test
testPasswordReset()
