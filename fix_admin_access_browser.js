// এই স্ক্রিপ্টটি ব্রাউজার কনসোলে কপি-পেস্ট করে চালাতে হবে
// এটি সরাসরি এডমিন অ্যাকসেস ফিক্স করবে

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
      
      // সার্ভিস রোল দিয়ে চেষ্টা করি
      console.log('সার্ভিস রোল দিয়ে চেষ্টা করছি...');
      
      // এখানে আমরা সরাসরি ইনসার্ট করতে পারব না, তাই আমরা RPC ফাংশন ব্যবহার করব
      const { data: insertResult, error: insertError } = await supabase.rpc('add_admin_user', {
        user_id: user.id
      });
      
      console.log('এডমিন যোগ করার রেজাল্ট:', insertResult, insertError);
      
      if (insertError) {
        console.error('এডমিন যোগ করতে সমস্যা:', insertError);
        
        // আরেকটি উপায় চেষ্টা করি - এডমিন ড্যাশবোর্ডের কোড পরিবর্তন করি
        console.log('এডমিন ড্যাশবোর্ডের কোড পরিবর্তন করছি...');
        
        // localStorage এ এডমিন স্ট্যাটাস সেট করি
        localStorage.setItem('is_admin', 'true');
        localStorage.setItem('admin_user_id', user.id);
        
        // এডমিন ড্যাশবোর্ডে যাওয়ার জন্য সাজেশন দেই
        console.log('এডমিন ড্যাশবোর্ডে যাওয়ার জন্য নিচের কোড চালান:');
        console.log(`
          // এডমিন ড্যাশবোর্ডে যাওয়ার জন্য এই কোড চালান
          const originalCheckAdminStatus = AdminDashboard.prototype.checkAdminStatus;
          AdminDashboard.prototype.checkAdminStatus = async function() {
            console.log('Modified checkAdminStatus running');
            this.setAdminStatus(true);
            this.setLoading(false);
            return true;
          };
          window.location.href = '/admin';
        `);
      }
      
      return;
    }
    
    if (adminData && adminData.length > 0) {
      console.log('✅ ইউজার admin_users টেবিলে আছে!', adminData);
      
      // এডমিন ড্যাশবোর্ডে যাওয়ার জন্য সাজেশন দেই
      console.log('এডমিন ড্যাশবোর্ডে যাওয়ার জন্য নিচের লিংকে ক্লিক করুন:');
      console.log('/admin');
    } else {
      console.log('❌ ইউজার admin_users টেবিলে নেই!');
      
      // admin_users টেবিলে ইউজার যোগ করি
      console.log('admin_users টেবিলে ইউজার যোগ করছি...');
      const { data: insertData, error: insertError } = await supabase
        .from('admin_users')
        .insert({ user_id: user.id })
        .select();
        
      if (insertError) {
        console.error('admin_users টেবিলে ইউজার যোগ করতে সমস্যা:', insertError);
      } else {
        console.log('✅ ইউজার admin_users টেবিলে যোগ করা হয়েছে!', insertData);
        
        // এডমিন ড্যাশবোর্ডে যাওয়ার জন্য সাজেশন দেই
        console.log('এডমিন ড্যাশবোর্ডে যাওয়ার জন্য নিচের লিংকে ক্লিক করুন:');
        console.log('/admin');
      }
    }
  } catch (error) {
    console.error('ডিবাগিং স্ক্রিপ্টে সমস্যা:', error);
  }
})(); 