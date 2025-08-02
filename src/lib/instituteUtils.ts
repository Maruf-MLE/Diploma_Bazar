import { supabase } from './supabase'

// Check if current user can message another user (same institute)
export const canMessageUser = async (receiverId: string): Promise<{ canMessage: boolean; error?: string }> => {
  try {
    const { data: canMessage, error } = await supabase.rpc('can_message_user', {
      sender_id: (await supabase.auth.getUser()).data.user?.id,
      receiver_id: receiverId
    })

    if (error) {
      console.error('Error checking message permission:', error)
      return { canMessage: false, error: error.message }
    }

    return { canMessage: !!canMessage }
  } catch (error) {
    console.error('Error in canMessageUser:', error)
    return { canMessage: false, error: 'Failed to check message permission' }
  }
}

// Check if current user can purchase a book (same institute as seller)
export const canPurchaseBook = async (bookId: string): Promise<{ canPurchase: boolean; error?: string }> => {
  try {
    const { data: canPurchase, error } = await supabase.rpc('can_purchase_book', {
      buyer_id: (await supabase.auth.getUser()).data.user?.id,
      book_id: bookId
    })

    if (error) {
      console.error('Error checking purchase permission:', error)
      return { canPurchase: false, error: error.message }
    }

    return { canPurchase: !!canPurchase }
  } catch (error) {
    console.error('Error in canPurchaseBook:', error)
    return { canPurchase: false, error: 'Failed to check purchase permission' }
  }
}

// Check if two users are from same institute
export const usersSameInstitute = async (user1Id: string, user2Id: string): Promise<{ sameInstitute: boolean; error?: string }> => {
  try {
    const { data: sameInstitute, error } = await supabase.rpc('users_same_institute', {
      user1_id: user1Id,
      user2_id: user2Id
    })

    if (error) {
      console.error('Error checking institute matching:', error)
      return { sameInstitute: false, error: error.message }
    }

    return { sameInstitute: !!sameInstitute }
  } catch (error) {
    console.error('Error in usersSameInstitute:', error)
    return { sameInstitute: false, error: 'Failed to check institute matching' }
  }
}

// Check if current user is from same institute as another user
export const currentUserSameInstitute = async (otherUserId: string): Promise<{ sameInstitute: boolean; error?: string }> => {
  try {
    const { data: sameInstitute, error } = await supabase.rpc('current_user_same_institute', {
      other_user_id: otherUserId
    })

    if (error) {
      console.error('Error checking current user institute:', error)
      return { sameInstitute: false, error: error.message }
    }

    return { sameInstitute: !!sameInstitute }
  } catch (error) {
    console.error('Error in currentUserSameInstitute:', error)
    return { sameInstitute: false, error: 'Failed to check institute matching' }
  }
}

// Get user's institute name
export const getUserInstitute = async (userId: string): Promise<{ institute?: string; error?: string }> => {
  try {
    const { data: institute, error } = await supabase.rpc('get_user_institute', {
      user_id: userId
    })

    if (error) {
      console.error('Error getting user institute:', error)
      return { error: error.message }
    }

    return { institute }
  } catch (error) {
    console.error('Error in getUserInstitute:', error)
    return { error: 'Failed to get user institute' }
  }
}

// Validation messages in Bengali
export const INSTITUTE_MISMATCH_MESSAGES = {
  MESSAGE: 'আপনি শুধুমাত্র আপনার প্রতিষ্ঠানের ছাত্রছাত্রীদের সাথে মেসেজ করতে পারবেন।',
  PURCHASE: 'আপনি শুধুমাত্র আপনার প্রতিষ্ঠানের ছাত্রছাত্রীদের কাছ থেকে বই কিনতে পারবেন।',
  GENERAL: 'এই কার্যক্রমটি শুধুমাত্র একই প্রতিষ্ঠানের ছাত্রছাত্রীদের মধ্যে সীমাবদ্ধ।'
}
