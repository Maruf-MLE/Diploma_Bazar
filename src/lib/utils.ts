import { type ClassValue, clsx } from "clsx"
import { twMerge } from "tailwind-merge"
import { supabase } from "./supabase"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

// Format price in Bengali taka
export function formatPrice(price: number | string) {
  const numPrice = typeof price === 'string' ? parseFloat(price) : price
  return `৳ ${numPrice.toFixed(2)}`
}

// Check if a user is banned and handle expired bans
export async function checkAndUpdateBanStatus(userId: string) {
  try {
    // Get ban status
    const { data, error } = await supabase
      .from('user_ban_status')
      .select('*')
      .eq('user_id', userId)
      .maybeSingle();
    
    if (error) {
      console.error('Error checking ban status:', error);
      return { isBanned: false, banInfo: null };
    }
    
    if (!data) {
      return { isBanned: false, banInfo: null };
    }
    
    // Check if ban has expired
    if (data.is_banned && data.ban_expires_at) {
      const expiryDate = new Date(data.ban_expires_at);
      const now = new Date();
      
      if (expiryDate < now) {
        // Ban has expired, update the database
        const { error: updateError } = await supabase
          .from('user_ban_status')
          .update({ 
            is_banned: false, 
            updated_at: new Date().toISOString()
          })
          .eq('user_id', userId);
        
        if (updateError) {
          console.error('Error updating expired ban:', updateError);
        } else {
          return { isBanned: false, banInfo: null };
        }
      }
    }
    
    return { 
      isBanned: data.is_banned, 
      banInfo: data.is_banned ? data : null
    };
  } catch (error) {
    console.error('Error in ban status check:', error);
    return { isBanned: false, banInfo: null };
  }
}
