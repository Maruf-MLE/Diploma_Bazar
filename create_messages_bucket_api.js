// Script to create the messages storage bucket in Supabase

// Import required modules
import { createClient } from '@supabase/supabase-js';

// Initialize Supabase client
const supabaseUrl = 'https://yryerjgidsyfiohmpeoc.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InlyeWVyamdpZHN5ZmlvaG1wZW9jIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTA5NjA1NTIsImV4cCI6MjA2NjUzNjU1Mn0.S2ki-0QyFabstnVnTh9qFiHoz7sqBZgkfPThn77wTno';

// Initialize supabase client
const supabase = createClient(supabaseUrl, supabaseAnonKey);

// Log in with email/password to get admin privileges
async function createMessagesBucket() {
  try {
    console.log('First checking if a user is already signed in...');
    const { data: { session }, error: sessionError } = await supabase.auth.getSession();
    
    if (sessionError) {
      console.error('Error getting session:', sessionError);
      return;
    }
    
    // If not signed in, prompt for sign in
    if (!session) {
      console.log('No active session found. You need to be signed in as an admin to create buckets.');
      console.log('Please sign in to the Supabase dashboard (https://supabase.com/dashboard) and create the bucket manually:');
      console.log('1. Go to Storage section');
      console.log('2. Create a new bucket named "messages"');
      console.log('3. Set appropriate bucket policies:');
      console.log('   - Allow authenticated users to upload files');
      console.log('   - Allow authenticated users to download files');
      return;
    }
    
    console.log('User is signed in as:', session.user.email);
    
    // List existing buckets
    const { data: buckets, error: listError } = await supabase.storage.listBuckets();
    
    if (listError) {
      console.error('Error listing buckets:', listError);
      console.log('You may need to create the bucket manually in the Supabase dashboard.');
      return;
    }
    
    // Check if messages bucket already exists
    const messagesBucket = buckets.find(b => b.name === 'messages');
    if (messagesBucket) {
      console.log('✅ Messages bucket already exists!');
      return;
    }
    
    // Create the bucket
    console.log('Creating messages bucket...');
    const { data, error: createError } = await supabase.storage.createBucket('messages', {
      public: false,
      fileSizeLimit: 10485760, // 10MB
    });
    
    if (createError) {
      console.error('Error creating bucket:', createError);
      console.log('\nPlease create the bucket manually in the Supabase dashboard:');
      console.log('1. Go to Storage section');
      console.log('2. Create a new bucket named "messages"');
      console.log('3. Set appropriate bucket policies');
      return;
    }
    
    console.log('✅ Messages bucket created successfully!');
    
    // Create the necessary folders inside the bucket
    console.log('Creating folders inside the bucket...');
    
    // Create message_images folder
    const { error: imagesFolderError } = await supabase.storage
      .from('messages')
      .upload('message_images/.folder', new File([''], '.folder'));
    
    if (imagesFolderError && !imagesFolderError.message.includes('already exists')) {
      console.warn('Warning: Could not create message_images folder:', imagesFolderError);
    } else {
      console.log('✅ message_images folder created');
    }
    
    // Create message_documents folder
    const { error: documentsFolderError } = await supabase.storage
      .from('messages')
      .upload('message_documents/.folder', new File([''], '.folder'));
    
    if (documentsFolderError && !documentsFolderError.message.includes('already exists')) {
      console.warn('Warning: Could not create message_documents folder:', documentsFolderError);
    } else {
      console.log('✅ message_documents folder created');
    }
    
    console.log('\nBucket setup complete! You can now use the file attachment functionality.');
  } catch (error) {
    console.error('Unexpected error:', error);
    console.log('\nPlease create the bucket manually in the Supabase dashboard:');
    console.log('1. Go to Storage section');
    console.log('2. Create a new bucket named "messages"');
    console.log('3. Set appropriate bucket policies');
  }
}

// Run the function
createMessagesBucket(); 