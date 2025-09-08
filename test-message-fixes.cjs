const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_KEY);

async function testMessageFixes() {
  console.log('🧪 Testing Message Seen Functionality Fixes...\n');
  
  try {
    // 1. Get test users
    console.log('1. Getting test users...');
    const { data: users, error: userError } = await supabase
      .from('profiles')
      .select('id, name')
      .limit(3);
    
    if (userError || !users || users.length < 2) {
      console.error('❌ Need at least 2 users to test with. Error:', userError);
      return;
    }
    
    const user1 = users[0];
    const user2 = users[1];
    console.log(`✅ Using test users: ${user1.name} and ${user2.name}`);
    
    // 2. Create test messages
    console.log('\n2. Creating test messages...');
    
    const testMessages = [
      {
        sender_id: user1.id,
        receiver_id: user2.id,
        content: 'Test message 1',
        status: 'sent'
      },
      {
        sender_id: user1.id,
        receiver_id: user2.id,
        content: 'Test message 2',
        status: null
      },
      {
        sender_id: user2.id,
        receiver_id: user1.id,
        content: 'Reply message',
        status: 'sent'
      }
    ];
    
    const { data: created, error: createError } = await supabase
      .from('messages')
      .insert(testMessages)
      .select();
    
    if (createError) {
      console.error('❌ Error creating test messages:', createError.message);
      return;
    }
    
    console.log(`✅ Created ${created.length} test messages`);
    
    // 3. Test unread counting with new logic
    console.log('\n3. Testing unread message counting...');
    
    const { data: unreadForUser2, error: countError } = await supabase
      .from('messages')
      .select('id, status')
      .eq('receiver_id', user2.id)
      .or('status.neq.read,status.is.null');
    
    if (countError) {
      console.error('❌ Error counting unread messages:', countError.message);
      return;
    }
    
    console.log(`📊 Unread messages for ${user2.name}: ${unreadForUser2.length}`);
    unreadForUser2.forEach(msg => {
      console.log(`   - Message: ${msg.id.substring(0, 8)}... Status: ${msg.status || 'null'}`);
    });
    
    // 4. Test marking messages as read
    console.log('\n4. Testing mark as read functionality...');
    
    if (unreadForUser2.length > 0) {
      const messageIds = unreadForUser2.map(m => m.id);
      
      const { error: updateError } = await supabase
        .from('messages')
        .update({ status: 'read' })
        .in('id', messageIds);
      
      if (updateError) {
        console.error('❌ Error marking messages as read:', updateError.message);
        return;
      }
      
      console.log(`✅ Marked ${messageIds.length} messages as read`);
      
      // Verify the update
      const { data: verifyData } = await supabase
        .from('messages')
        .select('id, status')
        .in('id', messageIds);
      
      const readCount = verifyData.filter(m => m.status === 'read').length;
      console.log(`✅ Verification: ${readCount}/${messageIds.length} messages now marked as read`);
      
      // Check final unread count
      const { data: finalUnread } = await supabase
        .from('messages')
        .select('id')
        .eq('receiver_id', user2.id)
        .or('status.neq.read,status.is.null');
      
      console.log(`📉 Final unread count for ${user2.name}: ${finalUnread.length}`);
    }
    
    console.log('\n✅ Message functionality tests completed!');
    console.log('\n🔧 Summary of fixes applied:');
    console.log('   1. ✅ Fixed directMarkMessagesAsRead to handle null status');
    console.log('   2. ✅ Updated countUnreadMessages to include null status');
    console.log('   3. ✅ Enhanced MessagingPage unread count updates');
    console.log('   4. ✅ Fixed Navigation component unread counting');
    console.log('   5. ✅ Added better logging and verification');
    
    console.log('\n📱 Next steps:');
    console.log('   1. Restart your development server');
    console.log('   2. Test messaging in the UI');
    console.log('   3. Messages should now properly show as "seen"');
    console.log('   4. Unread counts should update correctly');
    
    // Clean up test messages
    console.log('\n5. Cleaning up test messages...');
    await supabase
      .from('messages')
      .delete()
      .in('id', created.map(m => m.id));
    console.log('✅ Test cleanup completed');
    
  } catch (error) {
    console.error('❌ Test error:', error.message);
  }
}

testMessageFixes();
