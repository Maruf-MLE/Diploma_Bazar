// Debug SMS Issue - Comprehensive Check
// This will help identify exactly why SMS is failing

import 'dotenv/config';

console.log('🔍 SMS Issue Debug Report');
console.log('==========================\n');

// Step 1: Check Environment Variables
console.log('📋 Environment Variables Check:');
console.log('-------------------------------');

const envVars = {
  'VITE_ENABLE_SMS': process.env.VITE_ENABLE_SMS,
  'VITE_TWILIO_ACCOUNT_SID': process.env.VITE_TWILIO_ACCOUNT_SID,
  'VITE_TWILIO_AUTH_TOKEN': process.env.VITE_TWILIO_AUTH_TOKEN,
  'VITE_TWILIO_PHONE_NUMBER': process.env.VITE_TWILIO_PHONE_NUMBER,
  'NODE_ENV': process.env.NODE_ENV,
  'TEST_PHONE_NUMBER': process.env.TEST_PHONE_NUMBER
};

let envIssues = [];

Object.entries(envVars).forEach(([key, value]) => {
  if (key.includes('TOKEN') && value) {
    console.log(`${key}: ${value.substring(0, 8)}...`);
  } else {
    console.log(`${key}: ${value || '❌ MISSING'}`);
  }
  
  if (!value && key !== 'NODE_ENV') {
    envIssues.push(key);
  }
});

if (envIssues.length > 0) {
  console.log('\n❌ Missing Environment Variables:', envIssues.join(', '));
} else {
  console.log('\n✅ All environment variables are set');
}

// Step 2: Check Twilio Account Status
console.log('\n📞 Twilio Account Check:');
console.log('-------------------------');

async function checkTwilioAccount() {
  try {
    const accountSid = process.env.VITE_TWILIO_ACCOUNT_SID;
    const authToken = process.env.VITE_TWILIO_AUTH_TOKEN;
    
    if (!accountSid || !authToken) {
      console.log('❌ Twilio credentials missing');
      return false;
    }
    
    const url = `https://api.twilio.com/2010-04-01/Accounts/${accountSid}.json`;
    const response = await fetch(url, {
      headers: {
        'Authorization': `Basic ${btoa(`${accountSid}:${authToken}`)}`
      }
    });
    
    if (response.ok) {
      const data = await response.json();
      console.log('✅ Twilio Account Status:', data.status);
      console.log('💰 Account Balance:', data.balance || 'Unknown');
      console.log('🏷️  Account Type:', data.type || 'Trial');
      
      if (data.status !== 'active') {
        console.log('⚠️  Account is not active!');
        return false;
      }
      
      return true;
    } else {
      const error = await response.json();
      console.log('❌ Twilio API Error:', error.message);
      console.log('🔧 Error Code:', error.code);
      return false;
    }
    
  } catch (error) {
    console.log('❌ Network Error:', error.message);
    return false;
  }
}

// Step 3: Test SMS Sending
console.log('\n📱 SMS Sending Test:');
console.log('--------------------');

async function testSMSSending() {
  try {
    const accountSid = process.env.VITE_TWILIO_ACCOUNT_SID;
    const authToken = process.env.VITE_TWILIO_AUTH_TOKEN;
    const fromNumber = process.env.VITE_TWILIO_PHONE_NUMBER;
    const testNumber = process.env.TEST_PHONE_NUMBER;
    
    if (!testNumber || testNumber === '+8801700000000') {
      console.log('⚠️  No real test number provided. Using default.');
      console.log('   Add TEST_PHONE_NUMBER=+8801XXXXXXXXX to .env file');
      return false;
    }
    
    console.log('📤 Attempting to send test SMS...');
    console.log('📱 To:', testNumber);
    console.log('📞 From:', fromNumber);
    
    const url = `https://api.twilio.com/2010-04-01/Accounts/${accountSid}/Messages.json`;
    const body = new URLSearchParams({
      To: testNumber,
      From: fromNumber,
      Body: `🔢 Test SMS from বই চাপা বাজার\n\nTime: ${new Date().toLocaleString()}\n\nIf you receive this, SMS is working!`
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
      console.log('💰 Price:', result.price || 'Free (Trial)');
      return true;
    } else {
      console.log('❌ SMS sending failed!');
      console.log('🔧 Error:', result.message);
      console.log('🔢 Error Code:', result.code);
      
      // Detailed error analysis
      switch (result.code) {
        case 21211:
          console.log('💡 Issue: Invalid phone number format');
          console.log('   Solution: Use +8801XXXXXXXXX format');
          break;
        case 21408:
          console.log('💡 Issue: Permission to send to this number');
          console.log('   Solution: For trial accounts, verify the number at:');
          console.log('   https://console.twilio.com/us1/develop/phone-numbers/manage/verified');
          break;
        case 21614:
          console.log('💡 Issue: Invalid "From" number');
          console.log('   Solution: Check VITE_TWILIO_PHONE_NUMBER in .env');
          break;
        case 20003:
          console.log('💡 Issue: Authentication failed');
          console.log('   Solution: Check VITE_TWILIO_ACCOUNT_SID and VITE_TWILIO_AUTH_TOKEN');
          break;
        case 21602:
          console.log('💡 Issue: Message body is required');
          console.log('   Solution: Ensure message content is not empty');
          break;
        case 21604:
          console.log('💡 Issue: Insufficient account balance');
          console.log('   Solution: Add credits to your Twilio account');
          break;
        default:
          console.log('💡 Check Twilio Console: https://console.twilio.com/');
          console.log('   Look for more details in the error logs');
      }
      
      return false;
    }
    
  } catch (error) {
    console.log('❌ Network/Code Error:', error.message);
    return false;
  }
}

// Step 4: Check Browser Environment (simulated)
console.log('\n🌐 Browser Environment Check:');
console.log('------------------------------');

function checkBrowserEnvironment() {
  console.log('📋 Note: This script runs in Node.js, not browser');
  console.log('   In browser, check these:');
  console.log('   - Open F12 > Console tab');
  console.log('   - Look for CORS errors');
  console.log('   - Look for "Mixed Content" errors (HTTP/HTTPS)');
  console.log('   - Check if import.meta.env.VITE_ENABLE_SMS is "true"');
  console.log('   - Check if Twilio credentials are loaded in browser');
}

// Step 5: Common Solutions
function printCommonSolutions() {
  console.log('\n🔧 Common Solutions:');
  console.log('====================');
  console.log('1. Twilio Trial Account Issues:');
  console.log('   - Verify your phone number in Twilio Console');
  console.log('   - Go to: https://console.twilio.com/us1/develop/phone-numbers/manage/verified');
  console.log('   - Add your Bangladeshi number there first');
  
  console.log('\n2. Environment Variable Issues:');
  console.log('   - Make sure all VITE_ prefixed variables are set');
  console.log('   - Restart your development server after .env changes');
  console.log('   - Clear browser cache and reload');
  
  console.log('\n3. Network/CORS Issues:');
  console.log('   - Check if your internet allows requests to api.twilio.com');
  console.log('   - Try disabling any VPN or proxy');
  console.log('   - Check firewall settings');
  
  console.log('\n4. Twilio Account Issues:');
  console.log('   - Check account balance');
  console.log('   - Ensure account is active');
  console.log('   - Check if SMS service is enabled for your region');
  
  console.log('\n5. Phone Number Format:');
  console.log('   - Use international format: +8801XXXXXXXXX');
  console.log('   - Make sure the number is active and can receive SMS');
  console.log('   - Try with a different number');
}

// Main execution
async function runDebug() {
  const twilioOk = await checkTwilioAccount();
  const smsOk = await testSMSSending();
  
  checkBrowserEnvironment();
  
  console.log('\n📊 Debug Summary:');
  console.log('=================');
  console.log('Environment Variables:', envIssues.length === 0 ? '✅ PASS' : '❌ FAIL');
  console.log('Twilio Account:', twilioOk ? '✅ PASS' : '❌ FAIL');
  console.log('SMS Sending:', smsOk ? '✅ PASS' : '❌ FAIL');
  
  if (twilioOk && smsOk) {
    console.log('\n🎉 SMS is working! The issue might be in your app code or browser.');
    console.log('💡 Try refreshing your webpage and check browser console for errors.');
  } else {
    console.log('\n⚠️  SMS system has issues. Check the details above.');
    printCommonSolutions();
  }
  
  console.log('\n📋 Next Steps:');
  console.log('1. Fix any issues found above');
  console.log('2. Run this script again to verify fixes');
  console.log('3. Test in your website after fixes');
  console.log('4. Check browser console (F12) for additional errors');
}

runDebug().catch(console.error);
