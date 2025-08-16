// Debug script to test phone verification
// Open browser console and run this code

console.log('🔍 Phone Verification Debug Script');

// Check if we're in development mode
console.log('Environment:', process.env.NODE_ENV || 'development');

// Test phone number validation
const testPhoneNumber = '01712345678';
console.log('📱 Testing phone number:', testPhoneNumber);

// Clean phone number (same logic as in phoneVerification.ts)
function cleanPhoneNumber(phoneNumber) {
  let cleaned = phoneNumber.replace(/[^\d+]/g, '');
  
  if (cleaned.startsWith('01')) {
    cleaned = '+880' + cleaned;
  } else if (cleaned.startsWith('8801')) {
    cleaned = '+' + cleaned;
  } else if (!cleaned.startsWith('+880') && cleaned.startsWith('880')) {
    cleaned = '+' + cleaned;
  }
  
  return cleaned;
}

// Validate Bangladeshi phone number
function isValidBangladeshiPhoneNumber(phoneNumber) {
  const pattern = /^\+8801[3-9]\d{8}$/;
  return pattern.test(phoneNumber);
}

const cleanedPhone = cleanPhoneNumber(testPhoneNumber);
console.log('📞 Cleaned phone number:', cleanedPhone);
console.log('✅ Is valid:', isValidBangladeshiPhoneNumber(cleanedPhone));

// Test database connection (if supabase is available)
if (typeof supabase !== 'undefined') {
  console.log('🗄️ Supabase client found');
  
  // Test auth status
  supabase.auth.getUser().then(({ data: { user }, error }) => {
    if (error) {
      console.error('❌ Auth error:', error);
    } else if (user) {
      console.log('👤 User authenticated:', user.id);
      
      // Test RPC function call
      supabase.rpc('generate_phone_otp', {
        p_phone_number: cleanedPhone
      }).then(({ data, error }) => {
        if (error) {
          console.error('❌ RPC error:', error);
        } else {
          console.log('✅ OTP generated:', data);
          alert(`🔢 Debug OTP Generated: ${data}`);
        }
      });
      
    } else {
      console.log('❌ User not authenticated');
    }
  });
} else {
  console.log('❌ Supabase client not found');
}

console.log('🔍 Debug script completed');
