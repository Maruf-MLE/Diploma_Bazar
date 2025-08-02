// এই স্ক্রিপ্টটি ব্রাউজার কনসোলে কপি-পেস্ট করে চালাতে হবে
// এটি চেক করবে আপনার আইডি admin_users টেবিলে আছে কিনা

(async function() {
  try {
    // বর্তমান ইউজারের আইডি নিই
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      console.error('কোনো ইউজার লগইন নেই!');
      return;
    }
    
    console.log('বর্তমান ইউজার:', user.id, user.email);
    
    // admin_users টেবিলে ইউজার আছে কিনা চেক করি
    console.log('admin_users টেবিলে চেক করছি...');
    const { data: adminData, error: adminError } = await supabase
      .from('admin_users')
      .select('*')
      .eq('user_id', user.id);
      
    if (adminError) {
      console.error('admin_users টেবিল থেকে ডাটা আনতে সমস্যা:', adminError);
      
      // RLS পলিসি চেক করি
      console.log('RLS পলিসি চেক করছি...');
      const { data: rlsCheck, error: rlsError } = await supabase.rpc('is_admin', { user_id: user.id });
      console.log('is_admin ফাংশন রেজাল্ট:', rlsCheck, rlsError);
      
      return;
    }
    
    if (adminData && adminData.length > 0) {
      console.log('✅ ইউজার admin_users টেবিলে আছে!', adminData);
    } else {
      console.log('❌ ইউজার admin_users টেবিলে নেই!');
    }
    
    // সব এডমিন ইউজার দেখি
    console.log('সব এডমিন ইউজার দেখছি...');
    const { data: allAdmins, error: allAdminsError } = await supabase
      .from('admin_users')
      .select('*');
      
    if (allAdminsError) {
      console.error('সব এডমিন ইউজার দেখতে সমস্যা:', allAdminsError);
    } else {
      console.log('সব এডমিন ইউজার:', allAdmins);
    }
    
    // এডমিন ড্যাশবোর্ডে ব্যবহৃত কুয়েরি চেক করি
    console.log('এডমিন ড্যাশবোর্ডে ব্যবহৃত কুয়েরি চেক করছি...');
    const { data: checkData, error: checkError } = await supabase
      .from('admin_users')
      .select('*')
      .eq('user_id', user.id)
      .single();
      
    console.log('এডমিন চেক রেজাল্ট:', checkData, checkError);
    
  } catch (error) {
    console.error('ডিবাগিং স্ক্রিপ্টে সমস্যা:', error);
  }
})(); 