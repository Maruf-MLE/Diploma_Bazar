import { getUserVerificationStatus } from './supabase';
import { useToast } from '@/hooks/use-toast';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { navigateToRoute } from './urlHelper';
import React, { useEffect } from 'react';

// ভেরিফিকেশন স্টেটাস চেক করার ফাংশন
export const checkVerificationRequired = async (userId: string, actionType: 'sell' | 'message' | 'call') => {
  try {
    if (!userId) {
      console.error('checkVerificationRequired: userId is required');
      return { allowed: false, error: 'User ID is required' };
    }
    
    // ইউজারের ভেরিফিকেশন স্টেটাস চেক করি
    const { isVerified, error } = await getUserVerificationStatus(userId);
    
    if (error) {
      console.error('Error checking verification status:', error);
      return { allowed: false, error };
    }
    
    // যদি ইউজার ভেরিফাইড না হয়
    if (!isVerified) {
      let message = '';
      if (actionType === 'sell') {
        message = 'বই বিক্রি করতে আপনাকে আগে আপনার অ্যাকাউন্ট ভেরিফাই করতে হবে।';
      } else if (actionType === 'message') {
        message = 'মেসেজ পাঠাতে আপনাকে আগে আপনার অ্যাকাউন্ট ভেরিফাই করতে হবে।';
      } else if (actionType === 'call') {
        message = 'কল করতে আপনাকে আগে আপনার অ্যাকাউন্ট ভেরিফাই করতে হবে।';
      }
      
      return { 
        allowed: false, 
        message,
        actionType
      };
    }
    
    // ইউজার ভেরিফাইড হলে অনুমতি দেই
    return { allowed: true, error: null };
  } catch (error) {
    console.error('Error in checkVerificationRequired:', error);
    return { allowed: false, error };
  }
};

// ভেরিফিকেশন স্টেটাস চেক করে সতর্কতা দেখানোর হুক
export const useVerificationCheck = () => {
  const { toast } = useToast();
  const navigate = useNavigate();
  const { user, isVerified } = useAuth(); // Removed checkVerification to prevent loop
  
  const checkAndShowWarning = async (userId: string, actionType: 'sell' | 'message' | 'call') => {
    console.log('checkAndShowWarning called:', { userId, actionType, isVerified });
    
    if (!userId) {
      console.error('checkAndShowWarning: userId is required');
      return false;
    }
    
    // আগে লোকাল স্টেট চেক করি
    if (isVerified) {
      console.log('User is verified, allowing action');
      return true;
    }
    
    // সব অ্যাকশনের জন্য কঠোর ভেরিফিকেশন চেক প্রয়োজন
    console.log(`Checking verification for action: ${actionType}`);
    
    const { allowed, message, error } = await checkVerificationRequired(userId, actionType);
    
    if (error) {
      console.error('Error checking verification:', error);
      return false;
    }
    
    if (!allowed && message) {
      console.log(`User not verified for ${actionType}, showing warning`);
      
      toast({
        title: "ভেরিফিকেশন প্রয়োজন",
        description: `${message} ভেরিফাই করতে "ভেরিফিকেশন" পেজে যান।`,
        variant: "destructive",
        duration: 5000,
      });
      
      // ভেরিফিকেশন পেজে রিডাইরেক্ট করি
      setTimeout(() => {
        // Use URL helper for consistent navigation
        navigateToRoute('/verification');
      }, 1000);
      
      return false;
    }
    
    console.log(`Verification check passed for ${actionType}`);
    return allowed;
  };
  
  return { checkAndShowWarning, isVerified };
};
