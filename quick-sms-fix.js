// Quick SMS Fix - Common Issues Resolver
// This script will fix the most common SMS issues automatically

import fs from 'fs';
import path from 'path';

console.log('🔧 Quick SMS Fix');
console.log('================\n');

// Fix 1: Ensure .env file has correct format
function fixEnvFile() {
  console.log('📝 Checking .env file...');
  
  const envPath = '.env';
  let envContent = '';
  
  try {
    envContent = fs.readFileSync(envPath, 'utf8');
  } catch (error) {
    console.log('❌ .env file not found, creating one...');
  }
  
  // Required environment variables
  const requiredVars = {
    'VITE_SUPABASE_URL': 'https://yryerjgidsyfiohmpeoc.supabase.co',
    'VITE_SUPABASE_ANON_KEY': 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InlyeWVyamdpZHN5ZmlvaG1wZW9jIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTA5NjA1NTIsImV4cCI6MjA2NjUzNjU1Mn0.S2ki-0QyFabstnVnTh9qFiHoz7sqBZgkfPThn77wTno',
    'VITE_TWILIO_ACCOUNT_SID': 'ACa720c01d7e884945bbfbbb318206972c',
    'VITE_TWILIO_AUTH_TOKEN': 'a4c83d43958b7466c4793c20a3331e46',
    'VITE_TWILIO_PHONE_NUMBER': '+16193323473',
    'VITE_ENABLE_SMS': 'true',
    'TEST_PHONE_NUMBER': '+8801324069583'
  };
  
  let needsUpdate = false;
  let newEnvContent = envContent;
  
  // Add missing variables
  Object.entries(requiredVars).forEach(([key, defaultValue]) => {
    const regex = new RegExp(`^${key}=.*$`, 'm');
    
    if (!regex.test(envContent)) {
      console.log(`➕ Adding missing ${key}`);
      newEnvContent += `\n${key}=${defaultValue}`;
      needsUpdate = true;
    } else if (key === 'VITE_ENABLE_SMS') {
      // Ensure SMS is enabled
      const currentMatch = envContent.match(regex);
      if (currentMatch && !currentMatch[0].includes('true')) {
        console.log(`🔄 Updating ${key} to true`);
        newEnvContent = newEnvContent.replace(regex, `${key}=true`);
        needsUpdate = true;
      }
    }
  });
  
  if (needsUpdate) {
    fs.writeFileSync(envPath, newEnvContent);
    console.log('✅ .env file updated');
  } else {
    console.log('✅ .env file looks good');
  }
}

// Fix 2: Create a browser test file
function createBrowserTest() {
  console.log('\n📱 Creating browser SMS test...');
  
  const testHtml = `<!DOCTYPE html>
<html>
<head>
    <title>SMS Test</title>
    <style>
        body { font-family: Arial, sans-serif; max-width: 800px; margin: 50px auto; padding: 20px; }
        .result { margin: 20px 0; padding: 15px; border-radius: 5px; }
        .success { background: #d4edda; border: 1px solid #c3e6cb; color: #155724; }
        .error { background: #f8d7da; border: 1px solid #f5c6cb; color: #721c24; }
        .warning { background: #fff3cd; border: 1px solid #ffeaa7; color: #856404; }
        button { background: #007bff; color: white; border: none; padding: 10px 20px; border-radius: 5px; cursor: pointer; margin: 5px; }
        button:hover { background: #0056b3; }
        input { width: 200px; padding: 8px; margin: 5px; border: 1px solid #ddd; border-radius: 3px; }
        .debug { background: #e2e3e5; padding: 15px; border-radius: 5px; margin: 10px 0; font-family: monospace; }
    </style>
</head>
<body>
    <h1>🔍 SMS Debug Test</h1>
    
    <div class="warning">
        <strong>⚠️ Instructions:</strong>
        <ol>
            <li>Make sure your development server is running (npm run dev)</li>
            <li>Open browser console (F12) to see detailed logs</li>
            <li>Enter your phone number in +8801XXXXXXXXX format</li>
        </ol>
    </div>
    
    <div>
        <label>Test Phone Number:</label>
        <input type="tel" id="phoneInput" placeholder="+8801324069583" value="+8801324069583">
        <button onclick="testSMS()">Send Test SMS</button>
        <button onclick="checkEnvVars()">Check Environment</button>
        <button onclick="clearResults()">Clear Results</button>
    </div>
    
    <div id="results"></div>
    
    <script>
        // SMS Test Functions
        async function testSMS() {
            const phoneNumber = document.getElementById('phoneInput').value;
            const resultsDiv = document.getElementById('results');
            
            addResult('📤 Starting SMS test...', 'warning');
            
            // Check environment variables first
            const envCheck = checkEnvironmentVars();
            if (!envCheck.success) {
                addResult('❌ Environment check failed: ' + envCheck.error, 'error');
                return;
            }
            
            try {
                // Simulate the SMS sending logic from your app
                const accountSid = import.meta.env.VITE_TWILIO_ACCOUNT_SID;
                const authToken = import.meta.env.VITE_TWILIO_AUTH_TOKEN;
                const fromNumber = import.meta.env.VITE_TWILIO_PHONE_NUMBER;
                
                const url = \`https://api.twilio.com/2010-04-01/Accounts/\${accountSid}/Messages.json\`;
                const body = new URLSearchParams({
                    To: phoneNumber,
                    From: fromNumber,
                    Body: \`🔢 SMS Test from বই চাপা বাজার\\n\\nTime: \${new Date().toLocaleString()}\\n\\nThis is a test message!\`
                });

                const response = await fetch(url, {
                    method: 'POST',
                    headers: {
                        'Authorization': \`Basic \${btoa(\`\${accountSid}:\${authToken}\`)}\`,
                        'Content-Type': 'application/x-www-form-urlencoded'
                    },
                    body: body.toString()
                });

                const result = await response.json();
                
                if (response.ok && result.sid) {
                    addResult(\`✅ SMS sent successfully!\\nMessage SID: \${result.sid}\\nStatus: \${result.status}\\nPrice: \${result.price || 'Free'}\`, 'success');
                } else {
                    addResult(\`❌ SMS failed!\\nError: \${result.message}\\nCode: \${result.code}\`, 'error');
                    
                    // Add specific error solutions
                    if (result.code === 21408) {
                        addResult('💡 Solution: For trial accounts, verify your phone number at: https://console.twilio.com/us1/develop/phone-numbers/manage/verified', 'warning');
                    }
                }
                
            } catch (error) {
                addResult(\`❌ Network error: \${error.message}\`, 'error');
            }
        }
        
        function checkEnvVars() {
            const check = checkEnvironmentVars();
            if (check.success) {
                addResult('✅ Environment variables look good!\\n' + check.details, 'success');
            } else {
                addResult('❌ Environment issues found:\\n' + check.error, 'error');
            }
        }
        
        function checkEnvironmentVars() {
            const required = [
                'VITE_TWILIO_ACCOUNT_SID',
                'VITE_TWILIO_AUTH_TOKEN', 
                'VITE_TWILIO_PHONE_NUMBER',
                'VITE_ENABLE_SMS'
            ];
            
            const missing = [];
            const details = [];
            
            required.forEach(key => {
                const value = import.meta.env[key];
                if (!value) {
                    missing.push(key);
                } else {
                    if (key.includes('TOKEN')) {
                        details.push(\`\${key}: \${value.substring(0, 8)}...\`);
                    } else {
                        details.push(\`\${key}: \${value}\`);
                    }
                }
            });
            
            if (missing.length > 0) {
                return {
                    success: false,
                    error: 'Missing variables: ' + missing.join(', ') + '\\n\\nMake sure to restart your dev server after updating .env'
                };
            }
            
            if (import.meta.env.VITE_ENABLE_SMS !== 'true') {
                return {
                    success: false,
                    error: 'VITE_ENABLE_SMS is not set to "true"'
                };
            }
            
            return {
                success: true,
                details: details.join('\\n')
            };
        }
        
        function addResult(message, type) {
            const resultsDiv = document.getElementById('results');
            const resultDiv = document.createElement('div');
            resultDiv.className = \`result \${type}\`;
            resultDiv.innerHTML = message.replace(/\\n/g, '<br>');
            resultsDiv.appendChild(resultDiv);
            console.log(message);
        }
        
        function clearResults() {
            document.getElementById('results').innerHTML = '';
        }
        
        // Auto-check environment on page load
        window.onload = function() {
            checkEnvVars();
        };
    </script>
</body>
</html>`;

  fs.writeFileSync('sms-test.html', testHtml);
  console.log('✅ Created sms-test.html');
  console.log('   Open this file in your browser to test SMS');
}

// Fix 3: Show next steps
function showNextSteps() {
  console.log('\n📋 Next Steps:');
  console.log('=============');
  console.log('1. Restart your development server:');
  console.log('   npm run dev');
  console.log('');
  console.log('2. Open the test file in browser:');
  console.log('   - Open sms-test.html in your browser');
  console.log('   - Click "Check Environment" to verify settings');
  console.log('   - Click "Send Test SMS" to test actual SMS sending');
  console.log('');
  console.log('3. Check your phone verification page:');
  console.log('   - Go to http://localhost:5173/phone-verification');
  console.log('   - Open browser console (F12) for detailed logs');
  console.log('');
  console.log('4. Common issues to check:');
  console.log('   ❓ Twilio trial account? Verify your phone number first');
  console.log('   ❓ CORS blocked? Try disabling VPN/proxy');
  console.log('   ❓ Wrong phone format? Use +8801XXXXXXXXX');
  console.log('');
  console.log('5. If still having issues, run:');
  console.log('   npm run debug:sms');
}

// Main execution
function runQuickFix() {
  fixEnvFile();
  createBrowserTest(); 
  showNextSteps();
  
  console.log('\n🎉 Quick fix completed!');
  console.log('💡 If SMS still doesn\'t work, it\'s likely a Twilio account issue.');
}

runQuickFix();
