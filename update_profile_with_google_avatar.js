/**
 * Update existing profiles with Google avatar URLs
 * This script will update profiles table with Google profile pictures from auth.users metadata
 */

import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

const supabaseUrl = process.env.VITE_SUPABASE_URL || 'https://yryerjgidsyfiohmpeoc.supabase.co';
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY; // You need service role key for this

if (!supabaseServiceKey) {
  console.error('SUPABASE_SERVICE_ROLE_KEY is required for this operation');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function updateProfilesWithGoogleAvatars() {
  try {
    console.log('🔄 Starting to update profiles with Google avatars...');

    // Get all users from auth.users table
    const { data: users, error: usersError } = await supabase.auth.admin.listUsers();
    
    if (usersError) {
      console.error('❌ Error fetching users:', usersError);
      return;
    }

    console.log(`📊 Found ${users.users.length} users to process`);

    let updatedCount = 0;
    let skippedCount = 0;

    for (const user of users.users) {
      try {
        // Check if user has Google profile picture in metadata
        const googleAvatar = user.user_metadata?.avatar_url || user.user_metadata?.picture;
        
        if (!googleAvatar) {
          console.log(`⏭️  Skipping user ${user.email} - no Google avatar found`);
          skippedCount++;
          continue;
        }

        // Check if user already has avatar_url in profiles table
        const { data: profile, error: profileError } = await supabase
          .from('profiles')
          .select('avatar_url')
          .eq('id', user.id)
          .single();

        if (profileError) {
          console.log(`⚠️  Profile not found for user ${user.email}, skipping...`);
          skippedCount++;
          continue;
        }

        // Only update if profile doesn't have avatar_url or it's placeholder
        if (!profile.avatar_url || profile.avatar_url === '/placeholder.svg') {
          const { error: updateError } = await supabase
            .from('profiles')
            .update({ avatar_url: googleAvatar })
            .eq('id', user.id);

          if (updateError) {
            console.error(`❌ Error updating profile for ${user.email}:`, updateError);
            continue;
          }

          console.log(`✅ Updated avatar for ${user.email}`);
          updatedCount++;
        } else {
          console.log(`⏭️  User ${user.email} already has custom avatar, skipping...`);
          skippedCount++;
        }

        // Add small delay to avoid rate limiting
        await new Promise(resolve => setTimeout(resolve, 100));

      } catch (error) {
        console.error(`❌ Error processing user ${user.email}:`, error);
        continue;
      }
    }

    console.log('\n📈 Update Summary:');
    console.log(`✅ Updated: ${updatedCount} profiles`);
    console.log(`⏭️  Skipped: ${skippedCount} profiles`);
    console.log(`📊 Total processed: ${users.users.length} users`);

  } catch (error) {
    console.error('❌ Script failed:', error);
  }
}

// Run the update
updateProfilesWithGoogleAvatars();