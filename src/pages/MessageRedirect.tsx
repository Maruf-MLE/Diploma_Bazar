import React, { useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Loader2 } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';

/**
 * এই কম্পোনেন্টটি নোটিফিকেশন থেকে মেসেজিং পেজে রিডাইরেক্ট করার জন্য ব্যবহৃত হবে
 */
const MessageRedirect = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { user } = useAuth();
  
  useEffect(() => {
    // URL থেকে প্যারামিটার পার্স করা
    const params = new URLSearchParams(location.search);
    const userId = params.get('user');
    
    console.log('MessageRedirect - URL params:', { userId });
    console.log('MessageRedirect - Full URL:', location.pathname + location.search);
    
    if (!user) {
      console.log('MessageRedirect - No authenticated user, redirecting to login');
      window.location.href = '/login';
      return;
    }
    
    if (userId) {
      console.log('MessageRedirect - Redirecting to messages with seller:', userId);
      // Use window.location.href for guaranteed navigation
      window.location.href = `/messages?seller=${userId}`;
    } else {
      console.log('MessageRedirect - No user ID provided, redirecting to messages');
      window.location.href = '/messages';
    }
  }, [navigate, location.search, user]);
  
  return (
    <div className="flex flex-col items-center justify-center h-screen">
      <Loader2 className="h-8 w-8 animate-spin text-primary mb-4" />
      <p className="text-muted-foreground">রিডাইরেক্ট করা হচ্ছে...</p>
    </div>
  );
};

export default MessageRedirect; 