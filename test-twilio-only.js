// Simple Twilio SMS Test (no Supabase required)
// Run this to test your Twilio configuration only

import 'dotenv/config';

console.log('🚀 Testing Twilio SMS Configuration');
console.log('=====================================\n');

// Check Environment Variables
console.log('📋 Environment Variables Check:');
console.log('TWILIO_ACCOUNT_SID:', process.env.TWILIO_ACCOUNT_SID ? '✅ Set' : '❌ Missing');
console.log('TWILIO_AUTH_TOKEN:', process.env.TWILIO_AUTH_TOKEN ? '✅ Set' : '❌ Missing');
console.log('TWILIO_PHONE_NUMBER:', process.env.TWILIO_PHONE_NUMBER || '❌ Missing');
console.log('VITE_ENABLE_SMS:', process.env.VITE_ENABLE_SMS);
console.log('');

const accountSid = process.env.TWILIO_ACCOUNT_SID;
const authToken = process.env.TWILIO_AUTH_TOKEN;
const fromNumber = process.env.TWILIO_PHONE_NUMBER;

if (!accountSid || !authToken || !fromNumber) {
  console.error('❌ Missing Twilio credentials in .env file');
  console.log('\n📋 Please add these to your .env file:');
  console.log('TWILIO_ACCOUNT_SID=your_account_sid');
  console.log('TWILIO_AUTH_TOKEN=your_auth_token');
  console.log('TWILIO_PHONE_NUMBER=+1XXXXXXXXXX');
  process.exit(1);
}

// Test Twilio API Connection
async function testTwilioConnection() {
  console.log('🔍 Testing Twilio API Connection...');
  
  try {
    const url = `https://api.twilio.com/2010-04-01/Accounts/${accountSid}.json`;
    const response = await fetch(url, {
      headers: {
        'Authorization': `Basic ${btoa(`${accountSid}:${authToken}`)}`
      }
    });
    
    if (response.ok) {
      const data = await response.json();
      console.log('✅ Twilio connection successful!');
      console.log('📞 Account SID:', data.sid);
      console.log('📊 Account Status:', data.status);
      console.log('💰 Account Balance:', data.balance || 'Unknown');
      console.log('🏢 Account Type:', data.type || 'Unknown');
      return true;
    } else {
      const error = await response.json();
      console.error('❌ Twilio connection failed:', error.message);
      console.log('🔧 Please check your TWILIO_ACCOUNT_SID and TWILIO_AUTH_TOKEN');
      return false;
    }
  } catch (error) {
    console.error('❌ Connection error:', error.message);
    return false;
  }
}

// Test SMS Sending (if enabled and test number provided)
async function testSMSSending() {
  console.log('\n📱 Testing SMS Sending...');
  
  const enableSMS = process.env.VITE_ENABLE_SMS;
  const testPhone = process.env.TEST_PHONE_NUMBER;
  
  if (enableSMS !== 'true') {
    console.log('⚠️  SMS sending is disabled (VITE_ENABLE_SMS != true)');
    console.log('   To test real SMS, set VITE_ENABLE_SMS=true in .env');
    return true;
  }
  
  if (!testPhone) {
    console.log('⚠️  No test phone number provided.');
    console.log('   Add TEST_PHONE_NUMBER=+8801XXXXXXXXX to .env to test SMS sending');
    return true;
  }
  
  console.log('📤 Attempting to send test SMS...');
  console.log('📱 To:', testPhone);
  console.log('📞 From:', fromNumber);
  
  try {
    const url = `https://api.twilio.com/2010-04-01/Accounts/${accountSid}/Messages.json`;
    const body = new URLSearchParams({
      To: testPhone,
      From: fromNumber,
      Body: `🔢 Test SMS from বই চাপা বাজার\n\nThis is a test message to verify SMS functionality.\n\nTime: ${new Date().toLocaleString()}`
    });

    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Authorization': `Basic ${btoa(`${accountSid}:${authToken}`)}`,
        'Content-Type': 'application/x-www-form-urlencoded'
      },
      body: body.toString()
    });

    const result = await response.json();
    
    if (response.ok && result.sid) {
      console.log('✅ SMS sent successfully!');
      console.log('📨 Message SID:', result.sid);
      console.log('📊 Status:', result.status);
      console.log('💰 Price:', result.price || 'Unknown');
      console.log('🏷️  Price Unit:', result.price_unit || 'Unknown');
      console.log('\n📱 Please check your phone for the test message!');
      return true;
    } else {
      console.error('❌ SMS sending failed:', result.message);
      console.log('🔧 Error Code:', result.code);
      
      // Common error explanations
      switch (result.code) {
        case 21211:
          console.log('💡 Solution: Invalid phone number format. Use +8801XXXXXXXXX format');
          break;
        case 21408:
          console.log('💡 Solution: Permission denied. For trial accounts, verify the phone number first');
          console.log('   Go to Twilio Console > Phone Numbers > Verified Caller IDs');
          break;
        case 21614:
          console.log('💡 Solution: Invalid "From" number. Check TWILIO_PHONE_NUMBER in .env');
          break;
        case 20003:
          console.log('💡 Solution: Authentication failed. Check TWILIO_ACCOUNT_SID and TWILIO_AUTH_TOKEN');
          break;
        default:
          console.log('💡 Check Twilio Console for more details: https://console.twilio.com/');
      }
      
      return false;
    }
  } catch (error) {
    console.error('❌ SMS test failed:', error.message);
    return false;
  }
}

// Main Test Function
async function runTwilioTest() {
  const connectionOk = await testTwilioConnection();
  const smsOk = await testSMSSending();
  
  console.log('\n📊 Test Results:');
  console.log('================');
  console.log('Twilio Connection:', connectionOk ? '✅ PASS' : '❌ FAIL');
  console.log('SMS Sending:', smsOk ? '✅ PASS' : '❌ FAIL');
  
  if (connectionOk && smsOk) {
    console.log('\n🎉 All Twilio tests passed!');
    console.log('📱 Your SMS configuration should work properly.');
  } else if (connectionOk && !smsOk) {
    console.log('\n⚠️  Twilio connection works but SMS sending failed.');
    console.log('🔧 Check the error messages above for solutions.');
  } else {
    console.log('\n❌ Twilio connection failed.');
    console.log('🔧 Please check your Twilio credentials in .env file.');
  }
  
  console.log('\n📋 Next Steps:');
  console.log('1. If connection failed: Check TWILIO_ACCOUNT_SID and TWILIO_AUTH_TOKEN');
  console.log('2. If SMS failed: Add TEST_PHONE_NUMBER and verify it in Twilio Console');
  console.log('3. For trial accounts: Verify recipient phone numbers first');
  console.log('4. For production: Upgrade your Twilio account');
}

runTwilioTest().catch(console.error);
