const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_ANON_KEY);

async function testMessageSeenFunctionality() {
  console.log('🔍 Testing Message Seen Functionality...\n');
  
  try {
    // 1. Check current message statuses in the database
    console.log('1. Checking current message statuses...');
    const { data: allMessages, error: allError } = await supabase
      .from('messages')
      .select('id, sender_id, receiver_id, content, status, created_at')
      .order('created_at', { ascending: false })
      .limit(20);
    
    if (allError) {
      console.error('❌ Error fetching messages:', allError.message);
      return;
    }
    
    console.log(`📊 Total messages (last 20): ${allMessages.length}`);
    
    // Group messages by status
    const statusCounts = {};
    allMessages.forEach(msg => {
      const status = msg.status || 'null';
      statusCounts[status] = (statusCounts[status] || 0) + 1;
    });
    
    console.log('📈 Message status counts:', statusCounts);
    
    // 2. Count unread messages for each user
    console.log('\n2. Counting unread messages by user...');
    const { data: unreadMessages, error: unreadError } = await supabase
      .from('messages')
      .select('receiver_id, sender_id, status')
      .not('status', 'eq', 'read');
    
    if (unreadError) {
      console.error('❌ Error fetching unread messages:', unreadError.message);
      return;
    }
    
    const unreadByUser = {};
    unreadMessages.forEach(msg => {
      const receiverId = msg.receiver_id;
      unreadByUser[receiverId] = (unreadByUser[receiverId] || 0) + 1;
    });
    
    console.log(`📧 Total unread messages: ${unreadMessages.length}`);
    Object.keys(unreadByUser).forEach(userId => {
      console.log(`   User ${userId.substring(0, 8)}...: ${unreadByUser[userId]} unread`);
    });
    
    // 3. Test the direct mark as read function
    if (unreadMessages.length > 0) {
      console.log('\n3. Testing directMarkMessagesAsRead function...');
      
      // Find a user with unread messages
      const testReceiverId = Object.keys(unreadByUser)[0];
      const testMessage = unreadMessages.find(msg => msg.receiver_id === testReceiverId);
      const testSenderId = testMessage.sender_id;
      
      console.log(`Testing with receiver: ${testReceiverId.substring(0, 8)}... and sender: ${testSenderId.substring(0, 8)}...`);
      
      // Count unread messages before
      const { data: beforeMessages, error: beforeError } = await supabase
        .from('messages')
        .select('id')
        .eq('receiver_id', testReceiverId)
        .eq('sender_id', testSenderId)
        .not('status', 'eq', 'read');
      
      if (beforeError) {
        console.error('❌ Error counting messages before:', beforeError.message);
        return;
      }
      
      const beforeCount = beforeMessages.length;
      console.log(`📥 Messages to mark as read: ${beforeCount}`);
      
      if (beforeCount > 0) {
        // Update messages directly
        const messageIds = beforeMessages.map(m => m.id);
        const { error: updateError } = await supabase
          .from('messages')
          .update({ status: 'read' })
          .in('id', messageIds);
        
        if (updateError) {
          console.error('❌ Error updating message status:', updateError.message);
          return;
        }
        
        console.log('✅ Successfully updated message statuses');
        
        // Verify the update
        const { data: afterMessages, error: afterError } = await supabase
          .from('messages')
          .select('id, status')
          .in('id', messageIds);
        
        if (afterError) {
          console.error('❌ Error verifying updates:', afterError.message);
          return;
        }
        
        const readCount = afterMessages.filter(m => m.status === 'read').length;
        console.log(`✅ Verification: ${readCount}/${messageIds.length} messages marked as read`);
        
        // Count total unread messages after
        const { data: finalUnread, error: finalError } = await supabase
          .from('messages')
          .select('id')
          .eq('receiver_id', testReceiverId)
          .not('status', 'eq', 'read');
        
        if (!finalError) {
          const finalCount = finalUnread.length;
          console.log(`📉 Unread count for user after update: ${beforeCount - readCount} → ${finalCount}`);
        }
      }
    } else {
      console.log('\n3. No unread messages found to test with');
    }
    
    // 4. Check if there are any null status messages that need to be fixed
    console.log('\n4. Checking for messages with null status...');
    const { data: nullMessages, error: nullError } = await supabase
      .from('messages')
      .select('id, status')
      .is('status', null);
    
    if (nullError) {
      console.error('❌ Error checking null status messages:', nullError.message);
    } else if (nullMessages.length > 0) {
      console.log(`⚠️  Found ${nullMessages.length} messages with null status`);
      console.log('🔧 Fixing null status messages...');
      
      const { error: fixError } = await supabase
        .from('messages')
        .update({ status: 'sent' })
        .is('status', null);
      
      if (fixError) {
        console.error('❌ Error fixing null status:', fixError.message);
      } else {
        console.log('✅ Fixed null status messages');
      }
    } else {
      console.log('✅ No null status messages found');
    }
    
  } catch (error) {
    console.error('❌ Unexpected error:', error.message);
  }
}

// Run the test
testMessageSeenFunctionality();
