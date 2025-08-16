#!/usr/bin/env node

/**
 * Phone Verification System Disable Script
 * 
 * এই স্ক্রিপ্ট phone verification সিস্টেম বন্ধ করে দিবে এবং
 * শুধুমাত্র email verification রেখে দিবে
 */

const fs = require('fs');
const path = require('path');

console.log('🔧 Phone Verification সিস্টেম বন্ধ করা হচ্ছে...\n');

// Phone verification related files to remove or disable
const filesToCheck = [
  'src/lib/phoneVerification.ts',
  'src/lib/twilioSMS.ts',
  'src/pages/PhoneVerificationPage.tsx',
  'supabase/functions/send-sms/index.ts'
];

const scriptsToRemoveFromPackageJson = [
  'test:phone-verification',
  'test:twilio',
  'test:twilio-only',
  'fix:phone-verification'
];

try {
  // 1. Check and rename phone verification files
  console.log('1. Phone verification ফাইলগুলো রিনেম করা হচ্ছে...');
  
  filesToCheck.forEach(filePath => {
    const fullPath = path.join(__dirname, filePath);
    const disabledPath = fullPath + '.disabled';
    
    if (fs.existsSync(fullPath)) {
      try {
        fs.renameSync(fullPath, disabledPath);
        console.log(`   ✅ ${filePath} -> ${filePath}.disabled`);
      } catch (error) {
        console.log(`   ⚠️  ${filePath} রিনেম করা যায়নি: ${error.message}`);
      }
    } else {
      console.log(`   ⏭️  ${filePath} পাওয়া যায়নি (ইতিমধ্যে সরানো হয়েছে)`);
    }
  });

  // 2. Update package.json to remove phone verification scripts
  console.log('\n2. package.json থেকে phone verification scripts সরানো হচ্ছে...');
  
  const packageJsonPath = path.join(__dirname, 'package.json');
  if (fs.existsSync(packageJsonPath)) {
    const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf8'));
    
    let scriptsRemoved = 0;
    scriptsToRemoveFromPackageJson.forEach(script => {
      if (packageJson.scripts && packageJson.scripts[script]) {
        delete packageJson.scripts[script];
        scriptsRemoved++;
        console.log(`   ✅ Script সরানো হয়েছে: ${script}`);
      }
    });
    
    if (scriptsRemoved > 0) {
      fs.writeFileSync(packageJsonPath, JSON.stringify(packageJson, null, 2));
      console.log(`   📦 package.json আপডেট হয়েছে (${scriptsRemoved} scripts সরানো)`);
    } else {
      console.log('   ⏭️  কোন phone verification scripts পাওয়া যায়নি');
    }
  }

  // 3. Create a summary file
  console.log('\n3. সামারি ফাইল তৈরি করা হচ্ছে...');
  
  const summaryContent = `# Phone Verification সিস্টেম বন্ধ করা হয়েছে

## যা পরিবর্তন হয়েছে:

### ✅ ফাইল পরিবর্তন:
- AuthContext থেকে phone verification কোড সরানো হয়েছে
- VerifyEmailPage থেকে phone verification redirect সরানো হয়েছে  
- App.tsx থেকে phone verification route সরানো হয়েছে
- Phone verification related ফাইলগুলো .disabled এক্সটেনশন দিয়ে রিনেম করা হয়েছে

### ✅ কনফিগারেশন পরিবর্তন:
- supabase/config.toml এ email verification enable করা হয়েছে
- package.json থেকে phone verification scripts সরানো হয়েছে

### ✅ এখন যা হবে:
1. Registration এর পর শুধুমাত্র email verification লাগবে
2. Email verify করার পর সরাসরি home page এ redirect হবে
3. Phone verification এর কোন step নেই

### 🔄 যদি আবার phone verification চান:
1. .disabled ফাইলগুলো রিনেম করুন (extension সরান)
2. AuthContext, App.tsx, VerifyEmailPage এ phone verification code add করুন
3. supabase/config.toml এ sms enable করুন

তারিখ: ${new Date().toLocaleDateString('bn-BD')}
সময়: ${new Date().toLocaleTimeString('bn-BD')}
`;

  fs.writeFileSync(path.join(__dirname, 'PHONE_VERIFICATION_DISABLED.md'), summaryContent);
  console.log('   📄 PHONE_VERIFICATION_DISABLED.md ফাইল তৈরি হয়েছে');

  // 4. Final message
  console.log('\n🎉 সফলভাবে Phone Verification সিস্টেম বন্ধ করা হয়েছে!\n');
  console.log('📝 এখন থেকে:');
  console.log('   • Registration এর পর শুধু email verification লাগবে');
  console.log('   • Email verify হওয়ার পর সরাসরি home page এ যাবে');
  console.log('   • Phone number verification নেই\n');
  
  console.log('🚀 পরবর্তী ধাপ:');
  console.log('   1. npm run dev চালান');
  console.log('   2. একটি নতুন account দিয়ে test করুন');
  console.log('   3. Email verification এর পর home page এ যাচ্ছে কিনা দেখুন\n');

} catch (error) {
  console.error('❌ Error occurred:', error.message);
  process.exit(1);
}
