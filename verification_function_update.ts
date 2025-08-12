// আপনার src/lib/supabase.ts ফাইলে নিচের ফাংশনটি আপডেট করুন

// Get user verification status using RLS-safe function
export const getUserVerificationStatus = async (userId: string) => {
  try {
    if (!userId) {
      console.error('getUserVerificationStatus: userId is required');
      return { isVerified: false, error: 'User ID is required' };
    }
    
    console.log('Checking verification status for user:', userId);
    
    // Use the new RLS-safe function instead of direct table access
    const { data, error } = await supabase
      .rpc('check_user_verification_status', {
        user_uuid: userId
      });
    
    if (error) {
      console.error('Error checking verification status:', error);
      return { isVerified: false, error: error.message };
    }
    
    // The function returns a boolean directly
    const isUserVerified = data === true;
    
    console.log('Verification check result:', {
      userId,
      isVerified: isUserVerified,
      functionResult: data
    });
    
    return { isVerified: isUserVerified, error: null };
    
  } catch (error) {
    console.error('Error getting user verification status:', error);
    return { isVerified: false, error };
  }
};
