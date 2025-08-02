// This script helps run the database migration to fix message sending issues
const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');
const readline = require('readline');

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

console.log('\n=== বই-চাপা-বাজার ডাটাবেস মাইগ্রেশন টুল ===\n');
console.log('এই স্ক্রিপ্টটি আপনার ডাটাবেসে প্রয়োজনীয় পরিবর্তন করবে যাতে মেসেজিং সিস্টেম সঠিকভাবে কাজ করে।\n');

// Check if Supabase CLI is installed
try {
  execSync('supabase --version', { stdio: 'ignore' });
  console.log('✅ Supabase CLI পাওয়া গেছে।');
} catch (error) {
  console.error('❌ Supabase CLI পাওয়া যায়নি। দয়া করে এটি ইনস্টল করুন:');
  console.log('   npm install -g supabase');
  process.exit(1);
}

// Check if the migration file exists
const migrationFile = path.join(__dirname, 'supabase', 'migrations', '20250630100000_add_message_status.sql');
if (!fs.existsSync(migrationFile)) {
  console.error('❌ মাইগ্রেশন ফাইল পাওয়া যায়নি।');
  process.exit(1);
}

console.log('✅ মাইগ্রেশন ফাইল পাওয়া গেছে।');

// Ask for confirmation
rl.question('\nআপনি কি মাইগ্রেশন রান করতে চান? (y/n): ', (answer) => {
  if (answer.toLowerCase() === 'y' || answer.toLowerCase() === 'yes') {
    console.log('\nমাইগ্রেশন রান করা হচ্ছে...\n');
    
    try {
      // Run the migration
      execSync('supabase db push', { stdio: 'inherit' });
      console.log('\n✅ মাইগ্রেশন সফলভাবে সম্পন্ন হয়েছে।');
      console.log('\nএখন আপনি মেসেজিং সিস্টেম ব্যবহার করতে পারবেন।');
    } catch (error) {
      console.error('\n❌ মাইগ্রেশন রান করতে সমস্যা হয়েছে।');
      console.error('সমস্যার বিবরণ:', error.message);
      console.log('\nম্যানুয়ালি মাইগ্রেশন রান করতে নিম্নলিখিত কমান্ড ব্যবহার করুন:');
      console.log('   supabase db push');
    }
  } else {
    console.log('\nমাইগ্রেশন বাতিল করা হয়েছে।');
  }
  
  rl.close();
}); 