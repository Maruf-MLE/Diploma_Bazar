// This script helps run the database migration to fix message sending issues
const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');
const readline = require('readline');

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

console.log('\n=== বই-চাপা-বাজার ডাটাবেস মাইগ্রেশন টুল (সিম্পল) ===\n');
console.log('এই স্ক্রিপ্টটি আপনার ডাটাবেসে প্রয়োজনীয় পরিবর্তন করবে যাতে মেসেজিং সিস্টেম সঠিকভাবে কাজ করে।\n');

// Ask for Supabase URL and key
rl.question('Supabase URL: ', (url) => {
  rl.question('Supabase Anon Key: ', (key) => {
    const supabase = createClient(url, key);
    
    console.log('\nডাটাবেসে কানেকশন চেক করা হচ্ছে...');
    
    // Test connection
    supabase.from('messages').select('count', { count: 'exact', head: true })
      .then(({ error }) => {
        if (error) {
          console.error('❌ ডাটাবেসে কানেকশন করা যায়নি:', error.message);
          rl.close();
          return;
        }
        
        console.log('✅ ডাটাবেসে কানেকশন সফল হয়েছে।');
        
        // Ask for confirmation
        rl.question('\nআপনি কি মাইগ্রেশন রান করতে চান? (y/n): ', async (answer) => {
          if (answer.toLowerCase() === 'y' || answer.toLowerCase() === 'yes') {
            console.log('\nমাইগ্রেশন রান করা হচ্ছে...\n');
            
            try {
              // Add status column to messages table
              console.log('1. messages টেবিলে status কলাম যুক্ত করা হচ্ছে...');
              await supabase.rpc('run_sql', {
                sql: "ALTER TABLE messages ADD COLUMN IF NOT EXISTS status VARCHAR(20) DEFAULT 'sent' CHECK (status IN ('sent', 'delivered', 'read'));"
              });
              
              // Create index
              console.log('2. messages টেবিলে ইনডেক্স তৈরি করা হচ্ছে...');
              await supabase.rpc('run_sql', {
                sql: "CREATE INDEX IF NOT EXISTS idx_messages_status ON messages(receiver_id, status) WHERE status != 'read';"
              });
              
              // Create update function
              console.log('3. মেসেজ স্ট্যাটাস আপডেট ফাংশন তৈরি করা হচ্ছে...');
              await supabase.rpc('run_sql', {
                sql: `
                CREATE OR REPLACE FUNCTION update_message_status()
                RETURNS TRIGGER AS $$
                BEGIN
                    IF NEW.status = 'delivered' OR NEW.status = 'read' THEN
                        IF OLD.status = 'sent' THEN
                            NEW.updated_at = NOW();
                            RETURN NEW;
                        END IF;
                    END IF;
                    
                    IF NEW.status = 'read' THEN
                        IF OLD.status = 'delivered' OR OLD.status = 'sent' THEN
                            NEW.updated_at = NOW();
                            RETURN NEW;
                        END IF;
                    END IF;
                    
                    RETURN NEW;
                END;
                $$ LANGUAGE plpgsql;
                `
              });
              
              // Create trigger
              console.log('4. মেসেজ স্ট্যাটাস আপডেট ট্রিগার তৈরি করা হচ্ছে...');
              await supabase.rpc('run_sql', {
                sql: `
                DROP TRIGGER IF EXISTS trigger_update_message_status ON messages;
                CREATE TRIGGER trigger_update_message_status
                BEFORE UPDATE ON messages
                FOR EACH ROW
                EXECUTE FUNCTION update_message_status();
                `
              });
              
              console.log('\n✅ মাইগ্রেশন সফলভাবে সম্পন্ন হয়েছে।');
              console.log('\nএখন আপনি মেসেজিং সিস্টেম ব্যবহার করতে পারবেন।');
            } catch (error) {
              console.error('\n❌ মাইগ্রেশন রান করতে সমস্যা হয়েছে।');
              console.error('সমস্যার বিবরণ:', error.message);
            }
          } else {
            console.log('\nমাইগ্রেশন বাতিল করা হয়েছে।');
          }
          
          rl.close();
        });
      })
      .catch(error => {
        console.error('❌ ডাটাবেসে কানেকশন করা যায়নি:', error.message);
        rl.close();
      });
  });
}); 