// টোকেন এক্সপায়ার টাইম আপডেট করার জন্য JavaScript কোড
// এটি আপনার ব্রাউজার কনসোলে রান করতে পারেন

// আপনার Supabase URL এবং Service Role Key দিয়ে আপডেট করুন
const SUPABASE_URL = 'https://yryerjgidsyfiohmpeoc.supabase.co';
const SUPABASE_SERVICE_KEY = 'YOUR_SUPABASE_SERVICE_ROLE_KEY'; // Service Role Key দিয়ে রিপ্লেস করুন

// API কল
fetch(`${SUPABASE_URL}/rest/v1/rpc/set_auth_config`, {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'apikey': SUPABASE_SERVICE_KEY,
    'Authorization': `Bearer ${SUPABASE_SERVICE_KEY}`
  },
  body: JSON.stringify({
    config_key: 'security.email_confirmation_token_expiration_time',
    config_value: 86400
  })
})
.then(response => response.json())
.then(data => console.log('Success:', data))
.catch(error => console.error('Error:', error));

// অথবা, যদি আপনি Node.js ব্যবহার করেন:
/*
const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  'https://yryerjgidsyfiohmpeoc.supabase.co',
  'YOUR_SUPABASE_SERVICE_ROLE_KEY',
  { auth: { persistSession: false } }
);

async function updateTokenExpiration() {
  const { data, error } = await supabase.rpc('set_auth_config', {
    config_key: 'security.email_confirmation_token_expiration_time',
    config_value: 86400
  });
  
  if (error) {
    console.error('Error updating token expiration:', error);
  } else {
    console.log('Token expiration updated successfully:', data);
  }
}

updateTokenExpiration();
*/ 