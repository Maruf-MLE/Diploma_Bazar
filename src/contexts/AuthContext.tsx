import { createContext, useContext, useEffect, useState, useRef } from 'react'
import { User } from '@supabase/supabase-js'
import { supabase, getUserVerificationStatus, checkUserBanStatus } from '@/lib/supabase'
import { useToast } from '@/components/ui/use-toast'

type AuthContextType = {
  user: User | null
  loading: boolean
  isVerified: boolean
  isBanned: boolean
  banInfo: any | null
  verificationLoading: boolean
  emailVerified: boolean
  signUp: (email: string, password: string, userData: ProfileData) => Promise<{
    success: boolean;
    error: any | null;
  }>;
  checkVerification: () => Promise<void>;
  checkBanStatus: () => Promise<void>;
  signOut: () => Promise<void>;
  resendVerificationEmail: () => Promise<{
    success: boolean;
    error: any | null;
  }>;
  checkEmailVerified: () => Promise<boolean>;
}

export type ProfileData = {
  name: string;
  roll_number: string;
  semester: string;
  department: string;
  institute_name: string;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  loading: true,
  isVerified: false,
  isBanned: false,
  banInfo: null,
  verificationLoading: true,
  emailVerified: false,
  signUp: async () => ({ success: false, error: new Error("AuthContext not initialized") }),
  checkVerification: async () => {},
  checkBanStatus: async () => {},
  signOut: async () => {},
  resendVerificationEmail: async () => ({ success: false, error: new Error("AuthContext not initialized") }),
  checkEmailVerified: async () => false
})

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)
  const [isVerified, setIsVerified] = useState(false)
  const [isBanned, setIsBanned] = useState(false)
  const [banInfo, setBanInfo] = useState<any | null>(null)
  const [verificationLoading, setVerificationLoading] = useState(true)
  const [emailVerified, setEmailVerified] = useState(false)
  const banCheckIntervalRef = useRef<number | null>(null)
  const { toast } = useToast()
  
  // Sign out function
  const signOut = async () => {
    try {
      await supabase.auth.signOut();
      console.log("User signed out successfully");
    } catch (error) {
      console.error("Error signing out:", error);
    }
  }

  // ইউজার ভেরিফিকেশন স্টেটাস চেক করার ফাংশন
  const checkVerification = async () => {
    if (!user) {
      setIsVerified(false)
      setVerificationLoading(false)
      return
    }
    
    try {
      setVerificationLoading(true)
      const { isVerified, error } = await getUserVerificationStatus(user.id)
      
      if (error) {
        console.error('Error checking verification status:', error)
        setIsVerified(false)
      } else {
        setIsVerified(isVerified)
      }
    } catch (error) {
      console.error('Error in verification check:', error)
      setIsVerified(false)
    } finally {
      setVerificationLoading(false)
    }
  }
  
  // Check if user is banned
  const checkBanStatus = async () => {
    if (!user) {
      setIsBanned(false)
      setBanInfo(null)
      return
    }
    
    try {
      console.log('Checking ban status for user:', user.id)
      const { isBanned: banned, banInfo: info, error } = await checkUserBanStatus(user.id)
      
      if (error) {
        console.error('Error checking ban status:', error)
        setIsBanned(false)
        setBanInfo(null)
      } else {
        console.log('Ban status result:', { banned, info })
        
        // If user is newly banned (wasn't banned before but is now), show a toast and log them out
        if (banned && !isBanned) {
          console.log('User has been banned! Logging out...')
          toast({
            title: "অ্যাকাউন্ট ব্যান করা হয়েছে",
            description: "আপনার অ্যাকাউন্ট প্লাটফর্মের নিয়ম লঙ্ঘনের কারণে ব্যান করা হয়েছে।",
            variant: "destructive",
          })
          
          // Set the ban info first so it's available when redirecting
          setIsBanned(true)
          setBanInfo(info)
          
          // Sign out the user
          setTimeout(async () => {
            await signOut()
          }, 2000)
          
          return
        }
        
        setIsBanned(banned)
        setBanInfo(info)
      }
    } catch (error) {
      console.error('Error in ban status check:', error)
      setIsBanned(false)
      setBanInfo(null)
    }
  }
  
  // ইমেইল ভেরিফিকেশন চেক করার ফাংশন
  const checkEmailVerified = async (): Promise<boolean> => {
    if (!user) {
      console.log("No user logged in to check email verification");
      return false;
    }
    
    try {
      console.log("Checking email verification for user:", user.email);
      
      // সরাসরি getUser API কল করি
      const { data, error } = await supabase.auth.getUser();
      
      if (error) {
        console.error('Error checking email verification:', error);
        return false;
      }
      
      console.log('User data from auth.getUser():', data?.user);
      console.log('Email confirmation status:', data?.user?.email_confirmed_at);
      
      // আরও বিস্তারিত তথ্য লগ করি
      console.log('User metadata:', data?.user?.user_metadata);
      console.log('Auth metadata:', data?.user?.app_metadata);
      
      // সেশন ডাটাও চেক করি
      const { data: sessionData } = await supabase.auth.getSession();
      console.log('Current session data:', sessionData?.session);
      
      const isEmailVerified = data?.user?.email_confirmed_at != null;
      console.log('Is email verified:', isEmailVerified);
      
      setEmailVerified(isEmailVerified);
      return isEmailVerified;
    } catch (error) {
      console.error('Exception checking email verification:', error);
      return false;
    }
  }
  
  // ইমেইল ভেরিফিকেশন পুনরায় পাঠানোর ফাংশন
  const resendVerificationEmail = async () => {
    try {
      // ইউজার লগইন আছে কিনা চেক করি
      if (!user?.email) {
        return { success: false, error: new Error("ইউজার ইমেইল পাওয়া যায়নি") };
      }
      
      // ইউজার ইমেইল আগে থেকেই ভেরিফাইড কিনা চেক করি
      const isAlreadyVerified = await checkEmailVerified();
      if (isAlreadyVerified) {
        return { success: false, error: new Error("ইমেইল ইতিমধ্যে ভেরিফাইড") };
      }
      
      console.log("Resending verification email to:", user.email);
      
      // ভেরিফিকেশন ইমেইল পাঠাই - নতুন পেজে রিডাইরেক্ট করি
      const { data, error } = await supabase.auth.resend({
        type: 'signup',
        email: user.email,
        options: {
          emailRedirectTo: `${window.location.origin}/email-confirmation`
        }
      });
      
      if (error) {
        console.error("Error in resendVerificationEmail:", error);
        throw error;
      }
      
      console.log("Verification email resent successfully:", data);
      return { success: true, error: null };
    } catch (error) {
      console.error("Exception in resendVerificationEmail:", error);
      return { success: false, error };
    }
  }
  
  // Set up periodic ban status check
  useEffect(() => {
    // Start periodic ban check when user is logged in
    if (user) {
      // Initial check
      checkBanStatus()
      
      // Set up interval for periodic checks (every 60 seconds)
      if (!banCheckIntervalRef.current) {
        console.log('Setting up periodic ban check')
        banCheckIntervalRef.current = window.setInterval(() => {
          console.log('Running periodic ban check')
          checkBanStatus()
        }, 60000) // Check every 60 seconds
      }
    } else {
      // Clear interval when user logs out
      if (banCheckIntervalRef.current) {
        console.log('Clearing ban check interval')
        clearInterval(banCheckIntervalRef.current)
        banCheckIntervalRef.current = null
      }
    }
    
    // Clean up interval on unmount
    return () => {
      if (banCheckIntervalRef.current) {
        console.log('Cleaning up ban check interval')
        clearInterval(banCheckIntervalRef.current)
        banCheckIntervalRef.current = null
      }
    }
  }, [user])

  // Set up auth state change listener and initial session check
  useEffect(() => {
    console.log("Setting up auth state listener");
    
    // Check active sessions and sets the user
    const initializeAuth = async () => {
      try {
        const { data, error } = await supabase.auth.getSession();
        
        if (error) {
          console.error("Error getting session:", error);
          setLoading(false);
          return;
        }
        
        console.log("Initial session check:", data?.session ? "Session found" : "No session");
        
        if (data?.session?.user) {
          console.log("User from session:", data.session.user.id);
          setUser(data.session.user);
          
          // Check verification status if user exists
          checkVerification();
          checkBanStatus();
          checkEmailVerified();
        }
        
        setLoading(false);
      } catch (error) {
        console.error("Exception in getSession:", error);
        setLoading(false);
      }
    };
    
    // Initialize auth
    initializeAuth();

    // Listen for changes on auth state (sign in, sign out, etc.)
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      console.log('Supabase auth event:', event);
      
      if (session?.user) {
        console.log('User authenticated:', session.user.id);
        setUser(session.user);
        
        // Check verification status if user exists
        checkVerification();
        checkBanStatus();
        checkEmailVerified();
      } else {
        console.log('User not authenticated');
        setUser(null);
        setIsVerified(false);
        setVerificationLoading(false);
        setIsBanned(false);
        setBanInfo(null);
        setEmailVerified(false);
      }
      
      setLoading(false);
    });

    return () => {
      console.log("Cleaning up auth state listener");
      subscription.unsubscribe();
    };
  }, []);
  
  // Function to sign up a new user and create their profile
  const signUp = async (email: string, password: string, userData: ProfileData) => {
    try {
      console.log("Starting signup process with email:", email);
      
      // Make sure we have a proper redirect URL with origin
      const redirectUrl = `${window.location.origin}/email-confirmation`;
      console.log("Redirect URL will be:", redirectUrl);
      
      // 1. Sign up the user with Supabase Auth
      const { data, error: signUpError } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            name: userData.name,
            roll_number: userData.roll_number,
            semester: userData.semester,
            department: userData.department,
            institute_name: userData.institute_name
          },
          emailRedirectTo: redirectUrl
        }
      })

      console.log("Sign up response:", data);
      
      // Check if email confirmation is needed
      if (data?.user?.email_confirmed_at) {
        // এটি ডেভেলপমেন্ট মোডে ওয়ার্নিং দেখাবে, প্রোডাকশনে নয়
        console.warn("WARNING: Email was automatically confirmed! This should not happen if 'Confirm email' is enabled in Supabase.");
        console.log("Please ensure 'Confirm email' is enabled in Supabase Authentication settings");
        console.log("Go to: Authentication > Email Auth > 'Confirm email' should be checked");
        console.log("Also, remove any auto-confirm triggers from the database");
        
        // ইমেইল ভেরিফিকেশন স্ট্যাটাস আপডেট করি
        setEmailVerified(true);
        
        // Show warning toast
        toast({
          title: "ইমেইল ভেরিফিকেশন সতর্কতা",
          description: "ইমেইল অটোমেটিক ভেরিফাইড হয়ে গেছে। এটি সাধারণত হওয়া উচিত নয়। অ্যাডমিনকে জানান।",
          variant: "destructive", // "warning" টাইপ নেই, তাই "destructive" ব্যবহার করি
          duration: 10000
        });
      } else {
        console.log("Email confirmation is required. Confirmation status:", data?.user?.email_confirmed_at);
        setEmailVerified(false);
      }

      if (signUpError) {
        console.error("Sign up error:", signUpError);
        throw signUpError
      }

      if (!data.user) {
        throw new Error("User data not received")
      }

      // 2. Create the profile record
      const profileData = {
        id: data.user.id,
        name: userData.name,
        roll_number: userData.roll_number,
        semester: userData.semester,
        department: userData.department,
        institute_name: userData.institute_name,
        avatar_url: null
      }
      
      console.log("Creating profile with data:", profileData);
      
      // Insert profile data using upsert with RLS bypass - using service role client
      try {
        // সার্ভিস রোল ব্যবহার করে প্রোফাইল তৈরি করি
        const adminAuthClient = supabase.auth.admin;
        
        // যদি সার্ভিস রোল না থাকে তাহলে সাধারণ ক্লায়েন্ট ব্যবহার করি
        const { error: profileError } = await supabase
          .from('profiles')
          .upsert(profileData, { 
            onConflict: 'id',
            ignoreDuplicates: false
          });
          
        if (profileError) {
          console.error("Profile creation error:", profileError);
          
          // যদি RLS এরর হয় তাহলে ইউজারকে সতর্ক করি
          if (profileError.message.includes('violates row-level security policy')) {
            console.error("RLS policy error. Please run the fix:profile-rls script");
            toast({
              title: "প্রোফাইল তৈরি করতে সমস্যা",
              description: "RLS পলিসি সমস্যার কারণে প্রোফাইল তৈরি করা যায়নি। অ্যাডমিনকে জানান।",
              variant: "destructive",
            });
          }
          
          throw profileError;
        } else {
          console.log("Profile created successfully");
        }
      } catch (profileError) {
        console.error("Exception in profile creation:", profileError);
        throw profileError;
      }

      return { success: true, error: null }
    } catch (error) {
      console.error("Registration error:", error)
      return { success: false, error }
    }
  }

  return (
    <AuthContext.Provider value={{ 
      user, 
      loading, 
      isVerified, 
      isBanned,
      banInfo,
      verificationLoading, 
      emailVerified,
      signUp, 
      checkVerification,
      checkBanStatus,
      signOut,
      resendVerificationEmail,
      checkEmailVerified
    }}>
      {children}
    </AuthContext.Provider>
  )
}

export const useAuth = () => {
  return useContext(AuthContext)
} 