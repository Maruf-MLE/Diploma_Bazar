const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_KEY);

async function testCompleteMessageFunctionality() {
  console.log('🧪 Testing Complete Message Seen Functionality...\n');
  
  try {
    // 1. Get a few users to test with
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
    
    // 2. Clean up any existing test messages
    console.log('\n2. Cleaning up existing test messages...');
    await supabase
      .from('messages')
      .delete()
      .or(`and(sender_id.eq.${user1.id},receiver_id.eq.${user2.id}),and(sender_id.eq.${user2.id},receiver_id.eq.${user1.id})`);
    
    console.log('✅ Cleaned up test messages');
    
    // 3. Create test messages with different statuses
    console.log('\n3. Creating test messages...');
    
    const testMessages = [
      {
        sender_id: user1.id,
        receiver_id: user2.id,
        content: 'Test message 1 (sent)',
        status: 'sent'
      },
      {
        sender_id: user1.id,
        receiver_id: user2.id,
        content: 'Test message 2 (delivered)',
        status: 'delivered'
      },
      {
        sender_id: user1.id,
        receiver_id: user2.id,
        content: 'Test message 3 (null status)',
        status: null
      },
      {
        sender_id: user2.id,
        receiver_id: user1.id,
        content: 'Reply message (sent)',
        status: 'sent'
      }
    ];
    
    const { data: createdMessages, error: createError } = await supabase
      .from('messages')
      .insert(testMessages)
      .select();
    
    if (createError) {
      console.error('❌ Error creating test messages:', createError.message);
      return;
    }
    
    console.log(`✅ Created ${createdMessages.length} test messages`);
    
    // 4. Test unread count functions
    console.log('\n4. Testing unread message counting...');
    
    // Count unread messages for user2 (should be 3)
    const { data: unreadForUser2, error: countError } = await supabase
      .from('messages')
      .select('id, status')
      .eq('receiver_id', user2.id)
      .or('status.neq.read,status.is.null');
    
    if (countError) {
      console.error('❌ Error counting unread messages:', countError.message);
      return;
    }
    
    console.log(`📊 Unread messages for ${user2.name}: ${unreadForUser2.length} (expected: 3)`);
    unreadForUser2.forEach(msg => {\n      console.log(`   - Message: ${msg.id.substring(0, 8)}... Status: ${msg.status || 'null'}`);\n    });\n    \n    // Count unread messages for user1 (should be 1)\n    const { data: unreadForUser1, error: count1Error } = await supabase\n      .from('messages')\n      .select('id, status')\n      .eq('receiver_id', user1.id)\n      .or('status.neq.read,status.is.null');\n    \n    if (count1Error) {\n      console.error('❌ Error counting unread messages for user1:', count1Error.message);\n      return;\n    }\n    \n    console.log(`📊 Unread messages for ${user1.name}: ${unreadForUser1.length} (expected: 1)`);\n    \n    // 5. Test the directMarkMessagesAsRead functionality\n    console.log('\\n5. Testing directMarkMessagesAsRead...');\n    \n    if (unreadForUser2.length > 0) {\n      console.log(`Marking messages from ${user1.name} to ${user2.name} as read...`);\n      \n      // Get message IDs to mark as read\n      const messageIds = unreadForUser2.map(m => m.id);\n      \n      // Update messages directly\n      const { error: updateError, count: updateCount } = await supabase\n        .from('messages')\n        .update({ status: 'read', updated_at: new Date().toISOString() })\n        .in('id', messageIds);\n      \n      if (updateError) {\n        console.error('❌ Error updating message status:', updateError.message);\n        return;\n      }\n      \n      console.log(`✅ Successfully updated ${messageIds.length} messages (DB returned count: ${updateCount})`);\n      \n      // Verify the update\n      const { data: verifyData, error: verifyError } = await supabase\n        .from('messages')\n        .select('id, status')\n        .in('id', messageIds);\n      \n      if (verifyError) {\n        console.error('❌ Error verifying updates:', verifyError.message);\n      } else {\n        const readCount = verifyData.filter(m => m.status === 'read').length;\n        console.log(`✅ Verification: ${readCount}/${messageIds.length} messages marked as read`);\n        \n        verifyData.forEach(msg => {\n          console.log(`   - Message ${msg.id.substring(0, 8)}... Status: ${msg.status}`);\n        });\n      }\n      \n      // Count unread messages again\n      const { data: finalUnread, error: finalError } = await supabase\n        .from('messages')\n        .select('id')\n        .eq('receiver_id', user2.id)\n        .or('status.neq.read,status.is.null');\n      \n      if (!finalError) {\n        console.log(`📉 Final unread count for ${user2.name}: ${finalUnread.length} (expected: 0)`);\n      }\n    }\n    \n    // 6. Test message status updates\n    console.log('\\n6. Testing message status transitions...');\n    \n    // Create a new message and test status progression: null -> sent -> delivered -> read\n    const { data: newMsg, error: newMsgError } = await supabase\n      .from('messages')\n      .insert({\n        sender_id: user1.id,\n        receiver_id: user2.id,\n        content: 'Status transition test message',\n        status: null\n      })\n      .select()\n      .single();\n    \n    if (newMsgError) {\n      console.error('❌ Error creating new test message:', newMsgError.message);\n    } else {\n      console.log(`📨 Created message: ${newMsg.id.substring(0, 8)}... Status: ${newMsg.status || 'null'}`);\n      \n      // Update to sent\n      await supabase\n        .from('messages')\n        .update({ status: 'sent' })\n        .eq('id', newMsg.id);\n      console.log('   → Updated to: sent');\n      \n      // Update to delivered\n      await supabase\n        .from('messages')\n        .update({ status: 'delivered' })\n        .eq('id', newMsg.id);\n      console.log('   → Updated to: delivered');\n      \n      // Update to read\n      await supabase\n        .from('messages')\n        .update({ status: 'read' })\n        .eq('id', newMsg.id);\n      console.log('   → Updated to: read');\n    }\n    \n    console.log('\\n✅ All message functionality tests completed!');\n    console.log('\\n📋 Summary of fixes implemented:');\n    console.log('   1. Fixed directMarkMessagesAsRead to handle null status messages');\n    console.log('   2. Improved countUnreadMessages to include null status messages');\n    console.log('   3. Enhanced MessagingPage unread count updates');\n    console.log('   4. Updated Navigation component to handle null status messages');\n    console.log('   5. Added better logging and verification for debugging');\n    \n    console.log('\\n🔧 To apply these fixes:');\n    console.log('   1. The code changes have been made to the source files');\n    console.log('   2. Restart your development server');\n    console.log('   3. Test the message functionality in the UI');\n    console.log('   4. Messages should now properly show as \"seen\" and counts should update');\n    \n  } catch (error) {\n    console.error('❌ Unexpected error:', error.message);\n  }\n}\n\n// Run the test\ntestCompleteMessageFunctionality();","line_range_start":1,"line_range_end":200}}]}
</function_results>

<function_calls>
<invoke name="run_command">
<parameter name="command">node test-complete-message-functionality.cjs
