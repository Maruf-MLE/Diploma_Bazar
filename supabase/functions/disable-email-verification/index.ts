// Follow this setup guide to integrate the Deno language server with your editor:
// https://deno.land/manual/getting_started/setup_your_environment
// This enables autocomplete, go to definition, etc.

import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

console.log("ইমেইল ভেরিফিকেশন নিষ্ক্রিয়করণ ফাংশন চালু হয়েছে!")

serve(async (req) => {
  try {
    // সুপাবেস ক্লায়েন্ট তৈরি করি
    const supabaseClient = createClient(
      // Supabase API URL - env var exposed by default.
      Deno.env.get('SUPABASE_URL') ?? '',
      // Supabase API ANON KEY - env var exposed by default.
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      // Create client with Auth context of the user that called the function.
      { global: { headers: { Authorization: req.headers.get('Authorization')! } } }
    )
    
    // সার্ভিস রোল ক্লায়েন্ট তৈরি করি যাতে ডাটাবেসে সরাসরি অ্যাকসেস পাই
    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )
    
    // ১. সমস্ত ইউজারের ইমেইল কনফার্ম করি
    const { error: confirmError } = await supabaseAdmin.rpc('confirm_all_emails')
    if (confirmError) {
      console.error('ইমেইল কনফার্ম করার সময় ত্রুটি:', confirmError)
      
      // ফাংশন না থাকলে সরাসরি SQL রান করি
      const { error: sqlError } = await supabaseAdmin.from('auth.users').update({
        email_confirmed_at: new Date().toISOString()
      }).is('email_confirmed_at', null)
      
      if (sqlError) {
        console.error('SQL আপডেট ত্রুটি:', sqlError)
        throw sqlError
      }
    }
    
    // ২. ইমেইল ভেরিফিকেশন নিষ্ক্রিয় করি
    const { error: disableError } = await supabaseAdmin.rpc('disable_email_confirmations')
    if (disableError) {
      console.error('ইমেইল ভেরিফিকেশন নিষ্ক্রিয় করার সময় ত্রুটি:', disableError)
      
      // ফাংশন না থাকলে সরাসরি SQL রান করি
      const { error: configError } = await supabaseAdmin.from('auth.config').update({
        value: { email_confirmations: false }
      }).eq('name', 'auth')
      
      if (configError) {
        console.error('কনফিগ আপডেট ত্রুটি:', configError)
        throw configError
      }
    }
    
    return new Response(
      JSON.stringify({
        success: true,
        message: 'ইমেইল ভেরিফিকেশন নিষ্ক্রিয় করা হয়েছে এবং সমস্ত ইউজারের ইমেইল কনফার্ম করা হয়েছে'
      }),
      { headers: { "Content-Type": "application/json" } }
    )
  } catch (error) {
    return new Response(
      JSON.stringify({ success: false, error: error.message }),
      { headers: { "Content-Type": "application/json" }, status: 400 }
    )
  }
})

/* To invoke locally:

  1. Run `supabase start` (see: https://supabase.com/docs/reference/cli/supabase-start)
  2. Make an HTTP request:

  curl -i --location --request POST 'http://127.0.0.1:54321/functions/v1/disable-email-verification' \
    --header 'Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6ImFub24iLCJleHAiOjE5ODM4MTI5OTZ9.CRXP1A7WOeoJeXxjNni43kdQwgnWNReilDMblYTn_I0' \
    --header 'Content-Type: application/json' \
    --data '{"name":"Functions"}'

*/
