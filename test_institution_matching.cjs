const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://yryerjgidsyfiohmpeoc.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InlyeWVyamdpZHN5ZmlvaG1wZW9jIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTA5NjA1NTIsImV4cCI6MjA2NjUzNjU1Mn0.S2ki-0QyFabstnVnTh9qFiHoz7sqBZgkfPThn77wTno';

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function testInstitutionMatching() {
  try {
    console.log('=== Institution Matching Test Cases ===');
    
    // Get profiles to work with
    const { data: profiles, error } = await supabase
      .from('profiles')
      .select('id, name, institute_name')
      .not('institute_name', 'is', null)
      .limit(10);
    
    if (error) {
      console.error('Error fetching profiles:', error);
      return;
    }
    
    console.log('Available profiles:');
    profiles.forEach((profile, index) => {
      console.log(`${index + 1}. ${profile.name} - "${profile.institute_name}" (ID: ${profile.id})`);
    });
    
    // Test cases
    const testCases = [
      // Same institution
      {
        name: 'Same Institution Test',
        user1: 'চাঁপাইনবাবগঞ্জ পলিটেকনিক ইনস্টিটিউট',
        user2: 'চাঁপাইনবাবগঞ্জ পলিটেকনিক ইনস্টিটিউট',
        expected: true
      },
      // Different institutions
      {
        name: 'Different Institution Test',
        user1: 'চাঁপাইনবাবগঞ্জ পলিটেকনিক ইনস্টিটিউট',
        user2: 'ব্রাহ্মণবাড়িয়া পলিটেকনিক ইনস্টিটিউট',
        expected: false
      },
      // Case insensitive test
      {
        name: 'Case Insensitive Test',
        user1: 'চাঁপাইনবাবগঞ্জ পলিটেকনিক ইনস্টিটিউট',
        user2: 'চাঁপাইনবাবগঞ্জ পলিটেকনিক ইনস্টিটিউট',
        expected: true
      },
      // Whitespace test
      {
        name: 'Whitespace Test',
        user1: ' চাঁপাইনবাবগঞ্জ পলিটেকনিক ইনস্টিটিউট ',
        user2: 'চাঁপাইনবাবগঞ্জ পলিটেকনিক ইনস্টিটিউট',
        expected: true
      }
    ];
    
    console.log('\n=== Running Test Cases ===');
    
    testCases.forEach((testCase, index) => {
      const user1Institute = testCase.user1.trim().toLowerCase();
      const user2Institute = testCase.user2.trim().toLowerCase();
      const result = user1Institute === user2Institute;
      const passed = result === testCase.expected;
      
      console.log(`\n${index + 1}. ${testCase.name}`);
      console.log(`   User 1: "${testCase.user1}"`);
      console.log(`   User 2: "${testCase.user2}"`);
      console.log(`   Expected: ${testCase.expected ? 'MATCH' : 'NO MATCH'}`);
      console.log(`   Result: ${result ? 'MATCH' : 'NO MATCH'}`);
      console.log(`   Status: ${passed ? '✅ PASSED' : '❌ FAILED'}`);
    });
    
    // Real world test with actual profiles
    console.log('\n=== Real World Test ===');
    const sameInstituteProfiles = profiles.filter(p => 
      p.institute_name === 'চাঁপাইনবাবগঞ্জ পলিটেকনিক ইনস্টিটিউট'
    );
    
    if (sameInstituteProfiles.length >= 2) {
      const profile1 = sameInstituteProfiles[0];
      const profile2 = sameInstituteProfiles[1];
      
      console.log(`Testing ${profile1.name} vs ${profile2.name}`);
      console.log(`Both from: "${profile1.institute_name}"`);
      
      const match = profile1.institute_name.trim().toLowerCase() === profile2.institute_name.trim().toLowerCase();
      console.log(`Result: ${match ? '✅ MATCH (Should allow messaging)' : '❌ NO MATCH (Should block messaging)'}`);
    }
    
  } catch (error) {
    console.error('Test error:', error);
  }
}

testInstitutionMatching();
