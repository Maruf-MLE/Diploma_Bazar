import { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { supabase } from '@/lib/supabase';
import { useToast } from '@/components/ui/use-toast';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { CheckCircle, AlertCircle, Loader2 } from 'lucide-react';

export default function AccountMergePage() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [searchParams] = useSearchParams();
  const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading');
  const [message, setMessage] = useState('অ্যাকাউন্ট মার্জ করা হচ্ছে...');

  useEffect(() => {
    const mergeAccounts = async () => {
      try {
        // Get URL parameters
        const oldProfileData = searchParams.get('old_profile');
        const oldUserId = searchParams.get('old_user_id');

        if (!oldProfileData || !oldUserId) {
          throw new Error('Invalid merge parameters');
        }

        const oldProfile = JSON.parse(decodeURIComponent(oldProfileData));

        // Wait for authentication to complete
        const { data: { session }, error: sessionError } = await supabase.auth.getSession();

        if (sessionError || !session?.user) {
          throw new Error('Google authentication failed');
        }

        const newGoogleUserId = session.user.id;
        const googleEmail = session.user.email;

        console.log('Merging accounts:', {
          oldUserId,
          newGoogleUserId,
          googleEmail,
          oldProfile
        });

        // Check if the emails match
        if (oldProfile.email && googleEmail && oldProfile.email.toLowerCase() !== googleEmail.toLowerCase()) {
          setStatus('error');
          setMessage(`ইমেইল মিলছে না! পুরনো: ${oldProfile.email}, Google: ${googleEmail}`);
          return;
        }

        // Update the new Google user's profile with old data
        const mergedProfile = {
          id: newGoogleUserId,
          email: googleEmail,
          name: oldProfile.name || oldProfile.full_name,
          full_name: oldProfile.name || oldProfile.full_name,
          roll_number: oldProfile.roll_number,
          semester: oldProfile.semester,
          department: oldProfile.department,
          institute_name: oldProfile.institute_name,
          profile_image: oldProfile.profile_image,
          phone: oldProfile.phone,
          is_banned: oldProfile.is_banned || false,
          created_at: oldProfile.created_at,
          updated_at: new Date().toISOString()
        };

        // Insert/Update the new profile
        const { error: profileError } = await supabase
          .from('profiles')
          .upsert(mergedProfile, { 
            onConflict: 'id',
            ignoreDuplicates: false 
          });

        if (profileError) {
          console.error('Profile merge error:', profileError);
          throw profileError;
        }

        // Transfer user's books, notifications, etc.
        const tables = ['books', 'notifications', 'user_books', 'book_requests'];
        
        for (const table of tables) {
          try {
            const { error: updateError } = await supabase
              .from(table)
              .update({ user_id: newGoogleUserId })
              .eq('user_id', oldUserId);

            if (updateError && updateError.code !== 'PGRST116') { // Ignore "no rows" error
              console.warn(`Warning updating ${table}:`, updateError);
            }
          } catch (err) {
            console.warn(`Warning transferring ${table} data:`, err);
          }
        }

        // Delete old profile (cleanup)
        try {
          await supabase
            .from('profiles')
            .delete()
            .eq('id', oldUserId);
        } catch (cleanupError) {
          console.warn('Cleanup warning:', cleanupError);
        }

        setStatus('success');
        setMessage('সফলভাবে অ্যাকাউন্ট মার্জ হয়েছে! আপনি এখন Google দিয়ে লগইন করতে পারবেন।');

        // Redirect to home after success
        setTimeout(() => {
          navigate('/');
        }, 3000);

        toast({
          title: "সফল!",
          description: "আপনার অ্যাকাউন্ট সফলভাবে Google এর সাথে লিংক হয়েছে।",
        });

      } catch (error: any) {
        console.error('Account merge error:', error);
        setStatus('error');
        setMessage(`অ্যাকাউন্ট মার্জ করতে ত্রুটি: ${error.message}`);
        
        toast({
          title: "ত্রুটি",
          description: "অ্যাকাউন্ট মার্জ করতে সমস্যা হয়েছে।",
          variant: "destructive",
        });

        // Redirect to login after error
        setTimeout(() => {
          navigate('/login');
        }, 5000);
      }
    };

    mergeAccounts();
  }, [searchParams, navigate, toast]);

  const getStatusIcon = () => {
    switch (status) {
      case 'loading':
        return <Loader2 className="h-12 w-12 animate-spin text-blue-600" />;
      case 'success':
        return <CheckCircle className="h-12 w-12 text-green-600" />;
      case 'error':
        return <AlertCircle className="h-12 w-12 text-red-600" />;
    }
  };

  const getStatusColor = () => {
    switch (status) {
      case 'loading':
        return 'from-blue-600 to-indigo-700';
      case 'success':
        return 'from-green-600 to-emerald-700';
      case 'error':
        return 'from-red-600 to-pink-700';
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100 px-4 py-8">
      <Card className="w-full max-w-md shadow-lg border-0">
        <CardHeader className={`space-y-1 text-center bg-gradient-to-r ${getStatusColor()} text-white rounded-t-lg`}>
          <CardTitle className="text-2xl font-bold">
            অ্যাকাউন্ট মার্জ
          </CardTitle>
        </CardHeader>
        
        <CardContent className="space-y-6 pt-8 pb-8 text-center">
          <div className="flex justify-center">
            {getStatusIcon()}
          </div>
          
          <div className="space-y-4">
            <p className="text-lg font-medium text-gray-800">
              {message}
            </p>
            
            {status === 'success' && (
              <div className="text-sm text-gray-600 space-y-2">
                <p>✅ প্রোফাইল ডাটা স্থানান্তর হয়েছে</p>
                <p>✅ বই এবং অন্যান্য ডাটা স্থানান্তর হয়েছে</p>
                <p>✅ পুরনো অ্যাকাউন্ট মুছে ফেলা হয়েছে</p>
                <p className="pt-2">
                  <strong>এখন থেকে Google দিয়ে লগইন করুন।</strong>
                </p>
              </div>
            )}
            
            {status === 'error' && (
              <div className="text-sm text-gray-600">
                <p>আবার চেষ্টা করুন অথবা সাপোর্টের সাথে যোগাযোগ করুন।</p>
              </div>
            )}
            
            {status === 'loading' && (
              <div className="text-sm text-gray-600">
                <p>অনুগ্রহ করে অপেক্ষা করুন...</p>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
