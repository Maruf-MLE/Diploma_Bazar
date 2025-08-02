import { createClient } from '@supabase/supabase-js'

const supabaseUrl = 'https://yryerjgidsyfiohmpeoc.supabase.co'
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InlyeWVyamdpZHN5ZmlvaG1wZW9jIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTA5NjA1NTIsImV4cCI6MjA2NjUzNjU1Mn0.S2ki-0QyFabstnVnTh9qFiHoz7sqBZgkfPThn77wTno'

// Enable debug mode for development
const isDev = process.env.NODE_ENV !== 'production';

// Create Supabase client with optimized configuration
export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: true,
    flowType: 'pkce',
    debug: true, // সব সময় ডিবাগিং এনাবল করা
    storageKey: 'supabase-auth',
    storage: localStorage
  },
  realtime: {
    params: {
      eventsPerSecond: 10,
      heartbeatIntervalMs: 30000,
      timeout: 20000
    }
  },
  global: {
    headers: {
      'X-Client-Info': 'boi-chapa-bazar'
    }
  },
  db: {
    schema: 'public'
  }
})

// Log connection status
console.log(`Supabase client initialized. Debug mode: ${isDev ? 'ON' : 'OFF'}`);

// Add custom error logger for development
if (isDev) {
  // Monitor fetch requests in development
  const originalFetch = window.fetch;
  window.fetch = async function(input, init) {
    const url = typeof input === 'string' ? input : input instanceof URL ? input.href : input.url;
    
    // Add special logging for storage operations
    if (url.includes('supabase.co') && url.includes('/storage/')) {
      console.log(`Supabase storage request: ${url}`);
      console.log('Request headers:', init?.headers);
      console.log('Request method:', init?.method);
    } else if (url.includes('supabase.co')) {
      console.log(`Supabase request: ${url.split('supabase.co')[1]}`);
    }
    
    try {
      const response = await originalFetch(input, init);
      
      // Add special logging for storage responses
      if (url.includes('supabase.co') && url.includes('/storage/')) {
        console.log(`Supabase storage response status: ${response.status}`);
        if (!response.ok) {
          console.error(`Storage operation failed: ${response.status} ${response.statusText}`);
          // Clone the response to read its body without consuming it
          const clonedResponse = response.clone();
          try {
            const errorBody = await clonedResponse.text();
            console.error('Error response body:', errorBody);
          } catch (e) {
            console.error('Could not read error response body');
          }
        }
      } else if (url.includes('supabase.co') && !response.ok) {
        console.error(`Supabase error (${response.status}):`, url.split('supabase.co')[1]);
      }
      
      // Make sure to return the response
      return response;
    } catch (error) {
      if (url.includes('supabase.co')) {
        console.error(`Supabase fetch error:`, error);
      }
      throw error;
    }
  };
}

// Add a listener for auth state changes
supabase.auth.onAuthStateChange((event, session) => {
  console.log('Supabase auth event:', event)
  if (session) {
    console.log('User authenticated:', session.user?.id)
  }
})

// Helper function to get user profile data
export const getUserProfile = async (userId: string) => {
  try {
    if (!userId) {
      console.error('getUserProfile: userId is required');
      return null;
    }
    
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', userId)
      .single();
      
    if (error) {
      console.error('Error fetching user profile:', error);
      throw error;
    }
    
    return data;
  } catch (error) {
    console.error('Error in getUserProfile:', error);
    return null;
  }
};

// Helper function to update user profile data
export const updateUserProfile = async (userId: string, updates: any) => {
  try {
    const { data, error } = await supabase
      .from('profiles')
      .update(updates)
      .eq('id', userId);
      
    if (error) throw error;
    return { success: true, data };
  } catch (error) {
    console.error('Error updating user profile:', error);
    return { success: false, error };
  }
};

// Upload avatar image to Supabase Storage
export const uploadAvatar = async (userId: string, file: File) => {
  try {
    const fileExt = file.name.split('.').pop();
    const fileName = `${userId}-${Math.random().toString(36).substring(2)}.${fileExt}`;
    const filePath = `${fileName}`;
    
    const { error: uploadError } = await supabase.storage
      .from('avatars')
      .upload(filePath, file);
    
    if (uploadError) throw uploadError;
    
    // Get the public URL
    const { data: { publicUrl } } = supabase.storage
      .from('avatars')
      .getPublicUrl(filePath);
      
    // Update user profile with new avatar URL
    const { error: updateError } = await supabase
      .from('profiles')
      .update({ avatar_url: publicUrl })
      .eq('id', userId);
      
    if (updateError) throw updateError;
    
    return { success: true, publicUrl };
  } catch (error) {
    console.error('Error uploading avatar:', error);
    return { success: false, error };
  }
};

// Get realtime profile updates
export const subscribeToProfileChanges = (userId: string, callback: (payload: any) => void) => {
  if (!userId) {
    console.error('subscribeToProfileChanges: userId is required');
    return { unsubscribe: () => {} };
  }
  
  try {
  return supabase
      .channel(`profile-${userId}`)
    .on('postgres_changes', { 
      event: 'UPDATE',
      schema: 'public',
      table: 'profiles',
      filter: `id=eq.${userId}` 
    }, callback)
      .subscribe((status) => {
        console.log(`Profile subscription status for ${userId}:`, status);
      });
  } catch (error) {
    console.error('Error subscribing to profile changes:', error);
    return { unsubscribe: () => {} };
  }
};

// Add connection health check function
export const checkSupabaseConnection = async () => {
  try {
    // Simple health check query
    const { data, error } = await supabase
      .from('profiles')
      .select('count', { count: 'exact', head: true });
    
    return { connected: !error, error };
  } catch (err) {
    console.error('Supabase connection check failed:', err);
    return { connected: false, error: err };
  }
};

// Get user verification status
export const getUserVerificationStatus = async (userId: string) => {
  try {
    if (!userId) {
      console.error('getUserVerificationStatus: userId is required');
      return { isVerified: false, error: 'User ID is required' };
    }
    
    // Try using the SQL function first
    try {
      const { data: isVerified, error: rpcError } = await supabase.rpc('is_user_verified', {
        user_id_param: userId
      });
      
      if (!rpcError) {
        console.log('User verification status from RPC:', isVerified);
        return { isVerified: !!isVerified, error: null };
      } else {
        console.error('Error calling is_user_verified RPC:', rpcError);
      }
    } catch (rpcError) {
      console.error('Exception calling is_user_verified RPC:', rpcError);
    }
    
    // Fallback to direct table queries if RPC fails
    console.log('Falling back to direct table queries for verification status');
    
    // First check verification_data table
    const { data: verificationData, error: verificationError } = await supabase
      .from('verification_data')
      .select('is_verified')
      .eq('user_id', userId)
      .single();
    
    if (verificationError && verificationError.code !== 'PGRST116') {
      // PGRST116 is "no rows returned" error, which is fine - it means user hasn't started verification
      console.error('Error checking verification_data:', verificationError);
    }
    
    // If verification data exists and is verified, return true
    if (verificationData && verificationData.is_verified) {
      return { isVerified: true, error: null };
    }
    
    // If no verification data or not verified, check face_verification table
    const { data: faceData, error: faceError } = await supabase
      .from('face_verification')
      .select('is_verified, status')
      .eq('user_id', userId)
      .single();
    
    if (faceError && faceError.code !== 'PGRST116') {
      console.error('Error checking face_verification:', faceError);
    }
    
    // If face verification data exists and is verified, return true
    if (faceData && faceData.is_verified) {
      return { isVerified: true, error: null };
    }
    
    // If we got here, user is not verified
    return { isVerified: false, error: null };
  } catch (error) {
    console.error('Error getting user verification status:', error);
    return { isVerified: false, error };
  }
};

// Subscribe to verification status changes
export const subscribeToVerificationChanges = (userId: string, callback: () => void) => {
  if (!userId) {
    console.error('subscribeToVerificationChanges: userId is required');
    return { unsubscribe: () => {} };
  }
  
  try {
    // Subscribe to changes in verification_data table
    const verificationChannel = supabase
      .channel(`verification-${userId}`)
      .on('postgres_changes', { 
        event: 'UPDATE',
        schema: 'public',
        table: 'verification_data',
        filter: `user_id=eq.${userId}` 
      }, callback)
      .subscribe((status) => {
        console.log(`Verification data subscription status for ${userId}:`, status);
      });
    
    // Subscribe to changes in face_verification table
    const faceVerificationChannel = supabase
      .channel(`face-verification-${userId}`)
      .on('postgres_changes', { 
        event: 'UPDATE',
        schema: 'public',
        table: 'face_verification',
        filter: `user_id=eq.${userId}` 
      }, callback)
      .subscribe((status) => {
        console.log(`Face verification subscription status for ${userId}:`, status);
      });
    
    // Return a combined unsubscribe function
    return {
      unsubscribe: () => {
        verificationChannel.unsubscribe();
        faceVerificationChannel.unsubscribe();
      }
    };
  } catch (error) {
    console.error('Error subscribing to verification changes:', error);
    return { unsubscribe: () => {} };
  }
};

// Helper function to retry failed requests
export const retryOperation = async (operation, maxRetries = 3, delay = 1000) => {
  let lastError;
  
  for (let attempt = 0; attempt < maxRetries; attempt++) {
    try {
      return await operation();
    } catch (error) {
      console.log(`Attempt ${attempt + 1}/${maxRetries} failed:`, error);
      lastError = error;
      
      if (attempt < maxRetries - 1) {
        // Wait before next retry with exponential backoff
        const waitTime = delay * Math.pow(2, attempt);
        console.log(`Retrying in ${waitTime}ms...`);
        await new Promise(resolve => setTimeout(resolve, waitTime));
      }
    }
  }
  
  throw lastError;
};

// Check if a user is banned
export async function checkUserBanStatus(userId: string) {
  try {
    // First check if the user_ban_status table exists
    try {
      const { data: banData, error: banError } = await supabase
        .from('user_ban_status')
        .select('is_banned, banned_at, ban_reason, ban_expires_at')
        .eq('user_id', userId)
        .maybeSingle();
      
      if (banError && !banError.message.includes('does not exist')) {
        console.error('Error checking ban status:', banError);
        return { isBanned: false, banInfo: null, error: banError };
      }
      
      if (!banData) {
        return { isBanned: false, banInfo: null, error: null };
      }
      
      // Check if ban has expired
      if (banData.is_banned && banData.ban_expires_at) {
        const expiryDate = new Date(banData.ban_expires_at);
        const now = new Date();
        
        if (expiryDate < now) {
          // Ban has expired, update the database
          try {
            await supabase
              .from('user_ban_status')
              .update({ is_banned: false, updated_at: new Date().toISOString() })
              .eq('user_id', userId);
            
            return { isBanned: false, banInfo: null, error: null };
          } catch (updateError) {
            console.error('Error updating expired ban:', updateError);
            // Continue with the check, don't return early
          }
        }
      }
      
      return { 
        isBanned: banData.is_banned, 
        banInfo: banData.is_banned ? banData : null, 
        error: null 
      };
    } catch (error) {
      console.error('Exception in ban check:', error);
      return { isBanned: false, banInfo: null, error };
    }
  } catch (error) {
    console.error('Exception in ban status check:', error);
    return { isBanned: false, banInfo: null, error };
  }
} 