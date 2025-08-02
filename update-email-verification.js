import { createClient } from '@supabase/supabase-js'

const supabaseUrl = 'https://yryerjgidsyfiohmpeoc.supabase.co'
const supabaseKey = process.env.SUPABASE_SERVICE_KEY || 'YOUR_SERVICE_KEY' // Service key needed for auth tables

const supabase = createClient(supabaseUrl, supabaseKey)

async function updateEmailVerification() {
  try {
    // Confirm all unconfirmed emails
    const { data: confirmData, error: confirmError } = await supabase.rpc(
      'confirm_all_emails'
    )
    
    if (confirmError) {
      console.error('Error confirming emails:', confirmError)
    } else {
      console.log('Emails confirmed successfully:', confirmData)
    }
    
    // Disable email confirmations
    const { data: configData, error: configError } = await supabase.rpc(
      'disable_email_confirmations'
    )
    
    if (configError) {
      console.error('Error disabling email confirmations:', configError)
    } else {
      console.log('Email confirmations disabled successfully:', configData)
    }
  } catch (error) {
    console.error('Unexpected error:', error)
  }
}

updateEmailVerification() 