import { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { supabase } from '@/lib/supabase';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { AlertTriangle, Ban, LogOut } from 'lucide-react';
import { format } from 'date-fns';
import { Separator } from '@/components/ui/separator';
import { useAuth } from '@/contexts/AuthContext';

interface BanInfo {
  is_banned: boolean;
  banned_at: string | null;
  ban_reason: string | null;
  ban_expires_at: string | null;
  banned_by: string | null;
}

export default function BannedUserPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const { user, isBanned, banInfo: contextBanInfo, signOut } = useAuth();
  const [banInfo, setBanInfo] = useState<BanInfo | null>(null);
  const [loading, setLoading] = useState(true);
  const [userId, setUserId] = useState<string | null>(null);
  const [wasLoggedOut, setWasLoggedOut] = useState<boolean>(false);
  
  // Check if user was redirected here after being logged out
  useEffect(() => {
    const searchParams = new URLSearchParams(location.search);
    const autoLogout = searchParams.get('auto_logout');
    setWasLoggedOut(autoLogout === 'true');
  }, [location]);

  useEffect(() => {
    const checkAuth = async () => {
      try {
        // Get current session
        const { data: { session } } = await supabase.auth.getSession();
        
        // If we have ban info from context, use it
        if (contextBanInfo) {
          setBanInfo(contextBanInfo);
          setUserId(user?.id || null);
          setLoading(false);
          return;
        }
        
        if (!session || !session.user) {
          // Check if there's a user ID in the URL (for users who were logged out)
          const searchParams = new URLSearchParams(location.search);
          const urlUserId = searchParams.get('user_id');
          
          if (urlUserId) {
            setUserId(urlUserId);
            
            // Get ban information for this user ID
            const { data, error } = await supabase
              .from('user_ban_status')
              .select('*')
              .eq('user_id', urlUserId)
              .maybeSingle();
            
            if (error) {
              console.error('Error fetching ban status:', error);
              navigate('/login');
              return;
            }
            
            if (data) {
              setBanInfo(data as BanInfo);
            } else {
              // No ban found, redirect to login
              navigate('/login');
              return;
            }
          } else {
            // No session and no user ID, redirect to login
            navigate('/login');
            return;
          }
        } else {
          setUserId(session.user.id);
          
          // Get ban information
          const { data, error } = await supabase
            .from('user_ban_status')
            .select('*')
            .eq('user_id', session.user.id)
            .maybeSingle();
          
          if (error) {
            console.error('Error fetching ban status:', error);
            setBanInfo(null);
          } else if (data) {
            setBanInfo(data as BanInfo);
          } else {
            // User is not banned, redirect to home
            navigate('/');
          }
        }
      } catch (error) {
        console.error('Error checking ban status:', error);
      } finally {
        setLoading(false);
      }
    };
    
    checkAuth();
  }, [navigate, location, contextBanInfo, user]);
  
  const handleSignOut = async () => {
    await signOut();
    navigate('/login');
  };
  
  const formatDate = (dateString: string | null) => {
    if (!dateString) return 'অনির্দিষ্ট সময়';
    return format(new Date(dateString), 'yyyy-MM-dd HH:mm');
  };
  
  const getBanDuration = () => {
    if (!banInfo) return 'অনির্দিষ্ট সময়';
    
    if (!banInfo.ban_expires_at) {
      return 'স্থায়ী ব্যান';
    }
    
    const expiryDate = new Date(banInfo.ban_expires_at);
    const now = new Date();
    
    if (expiryDate < now) {
      return 'ব্যান মেয়াদ শেষ হয়েছে';
    }
    
    const diffTime = Math.abs(expiryDate.getTime() - now.getTime());
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    return `${diffDays} দিন বাকি আছে`;
  };
  
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-100">
        <div className="text-center">
          <div className="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full mx-auto"></div>
          <p className="mt-4 text-gray-600">লোড হচ্ছে...</p>
        </div>
      </div>
    );
  }
  
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100 px-4 py-8">
      <Card className="w-full max-w-lg border-red-200 shadow-lg">
        <CardHeader className="space-y-1 text-center border-b pb-4">
          <div className="flex justify-center mb-2">
            <div className="bg-red-100 p-3 rounded-full">
              <Ban className="h-10 w-10 text-red-600" />
            </div>
          </div>
          <CardTitle className="text-2xl font-bold text-red-600">আপনার অ্যাকাউন্ট ব্যান করা হয়েছে</CardTitle>
          <CardDescription className="text-red-500">
            {wasLoggedOut 
              ? "আপনাকে স্বয়ংক্রিয়ভাবে লগআউট করা হয়েছে কারণ আপনার অ্যাকাউন্ট ব্যান করা হয়েছে।"
              : "আপনি বর্তমানে বই চাপা বাজার ব্যবহার করতে পারবেন না।"
            }
          </CardDescription>
        </CardHeader>
        
        <CardContent className="pt-6 space-y-4">
          <div className="bg-red-50 p-4 rounded-md border border-red-100 flex items-start gap-3">
            <AlertTriangle className="h-5 w-5 text-red-500 mt-0.5 flex-shrink-0" />
            <div>
              <h3 className="font-semibold text-red-700">ব্যান সম্পর্কে তথ্য</h3>
              <p className="text-sm text-gray-700 mt-1">
                আপনার অ্যাকাউন্ট প্লাটফর্মের নিয়ম লঙ্ঘনের কারণে ব্যান করা হয়েছে। বিস্তারিত নিচে দেয়া আছে।
              </p>
            </div>
          </div>
          
          <div className="space-y-3 mt-4">
            <div className="flex justify-between text-sm">
              <span className="text-gray-500">ব্যান করা হয়েছে</span>
              <span className="font-medium">{banInfo?.banned_at ? formatDate(banInfo.banned_at) : 'অজানা'}</span>
            </div>
            <Separator />
            
            <div className="flex justify-between text-sm">
              <span className="text-gray-500">ব্যান মেয়াদ</span>
              <span className="font-medium">{getBanDuration()}</span>
            </div>
            <Separator />
            
            <div className="flex justify-between text-sm">
              <span className="text-gray-500">মেয়াদ শেষ হবে</span>
              <span className="font-medium">{banInfo?.ban_expires_at ? formatDate(banInfo.ban_expires_at) : 'স্থায়ী ব্যান'}</span>
            </div>
            <Separator />
            
            <div className="space-y-2 text-sm">
              <span className="text-gray-500">ব্যান করার কারণ</span>
              <p className="font-medium bg-gray-50 p-3 rounded-md border">
                {banInfo?.ban_reason || 'কোন কারণ উল্লেখ করা হয়নি'}
              </p>
            </div>
          </div>
          
          <div className="bg-yellow-50 p-4 rounded-md border border-yellow-100 mt-6">
            <h4 className="font-medium text-yellow-800">আপিল করতে চাইলে</h4>
            <p className="text-sm text-gray-600 mt-1 mb-3">
              যদি আপনি মনে করেন এটি ভুল হয়েছে, তাহলে আমাদের ফেসবুক পেজে মেসেজ করুন। আপনার ইউজার আইডি উল্লেখ করুন: <span className="font-mono bg-gray-100 px-1 py-0.5 rounded text-xs">{userId}</span>
            </p>
            <a 
              href="https://www.facebook.com/diplomabazar/" 
              target="_blank" 
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 bg-[#1877F2] text-white px-4 py-2 rounded-md hover:bg-[#166FE5] transition-colors text-sm"
            >
              <svg className="h-4 w-4" fill="currentColor" viewBox="0 0 24 24">
                <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
              </svg>
              ফেসবুকে মেসেজ করুন
            </a>
          </div>
        </CardContent>
        
        <CardFooter className="flex justify-center border-t pt-4">
          <Button 
            variant="outline"
            className="w-full"
            onClick={handleSignOut}
          >
            <LogOut className="h-4 w-4 mr-2" />
            লগআউট করুন
          </Button>
        </CardFooter>
      </Card>
    </div>
  );
} 