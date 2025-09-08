import { supabase } from './supabase';
import { User } from '@supabase/supabase-js';
import { PurchaseRequest } from './types';
import { createNotification } from './NotificationService';

// Define the Supabase URL for direct access
const supabaseUrl = 'https://yryerjgidsyfiohmpeoc.supabase.co';

// Define Message type here instead of importing it
export interface Message {
  id: string;
  sender_id: string;
  receiver_id: string;
  book_id?: string;
  content: string;
  created_at: string;
  updated_at: string;
  sender_name?: string;
  sender_avatar_url?: string | undefined;
  isOwn?: boolean;
  isPurchaseRequest?: boolean;
  purchaseRequest?: PurchaseRequest;
  status?: 'sent' | 'delivered' | 'read';
  file_url?: string;
  file_type?: 'image' | 'document';
  file_name?: string;
}

// Export PurchaseRequest type
export type { PurchaseRequest };

// Interface for the message data returned from Supabase
interface MessageWithProfile {
  id: string;
  sender_id: string;
  receiver_id: string;
  book_id?: string;
  content: string;
  created_at: string;
  updated_at: string;
  sender_name?: string;
  sender_avatar_url?: string | null;
  status?: 'sent' | 'delivered' | 'read';
  file_url?: string;
  file_type?: 'image' | 'document';
  file_name?: string;
}

// Define the structure of the response from Supabase
interface SupabaseMessageResponse {
  id: string;
  sender_id: string;
  receiver_id: string;
  book_id?: string;
  content: string;
  created_at: string;
  updated_at: string;
  status?: 'sent' | 'delivered' | 'read';
  file_url?: string;
  file_type?: 'image' | 'document';
  file_name?: string;
}

export interface Conversation {
  id: string;
  user: {
    id: string;
    name: string;
    avatar_url?: string;
    verified: boolean;
  };
  book: {
    id?: string;
    title?: string;
    price?: number;
    cover_image_url?: string;
  };
  lastMessage: string;
  timestamp: string;
  unread: boolean;
}

/**
 * Get all conversations for the current user
 */
export const getUserConversations = async (userId: string) => {
  try {
    if (!userId) {
      console.error('getUserConversations: userId is required');
      return { data: [], error: new Error('User ID is required') };
    }

    // First get all messages where the user is either sender or receiver
    const { data: messagesData, error: messagesError } = await supabase
      .from('messages')
      .select(`
        id,
        sender_id,
        receiver_id,
        book_id,
        content,
        created_at
      `)
      .or(`sender_id.eq.${userId},receiver_id.eq.${userId}`)
      .order('created_at', { ascending: false });

    if (messagesError) {
      console.error('Error fetching messages:', messagesError);
      throw messagesError;
    }

    if (!messagesData || messagesData.length === 0) {
      return { data: [], error: null };
    }

    // Group messages by conversation (unique combination of users)
    const conversationsMap = new Map<string, any>();
    
    for (const message of messagesData) {
      const otherUserId = message.sender_id === userId ? message.receiver_id : message.sender_id;
      const conversationId = [userId, otherUserId].sort().join('_');
      
      if (!conversationsMap.has(conversationId) || 
          new Date(message.created_at) > new Date(conversationsMap.get(conversationId).created_at)) {
        conversationsMap.set(conversationId, {
          id: conversationId,
          otherUserId,
          bookId: message.book_id,
          lastMessage: message.content,
          timestamp: message.created_at,
          // Check if message is unread (if receiver is current user and message is not read)
          unread: message.sender_id !== userId
        });
      }
    }

    // Get user details for each conversation
    const conversationsArray = Array.from(conversationsMap.values());
    const userIds = conversationsArray.map(conv => conv.otherUserId);
    
    if (userIds.length === 0) {
      return { data: [], error: null };
    }
    
    console.log('Fetching user profiles for conversations:', userIds);
    
    // Only select columns that we know exist in the profiles table
    const { data: usersData, error: usersError } = await supabase
      .from('profiles')
      .select('id, name, avatar_url')
      .in('id', userIds);
    
    if (usersError) {
      console.error('Error fetching user profiles:', usersError);
      throw usersError;
    }

    // Get book details for each conversation with a book
    const bookIds = conversationsArray
      .filter(conv => conv.bookId)
      .map(conv => conv.bookId);
    
    let booksData: any[] = [];
    if (bookIds.length > 0) {
      const { data: books, error: booksError } = await supabase
        .from('books')
        .select('id, title, price, cover_image_url')
        .in('id', bookIds);
      
      if (booksError) {
        console.error('Error fetching books:', booksError);
        throw booksError;
      }
      booksData = books || [];
    }

    // Format conversations with user and book details
    const conversations: Conversation[] = conversationsArray.map(conv => {
      const user = usersData?.find(u => u.id === conv.otherUserId) || { 
        id: conv.otherUserId,
        name: 'অজানা ব্যবহারকারী',
        avatar_url: null
      };
      
      const book = booksData.find(b => b.id === conv.bookId) || {};
      
      return {
        id: conv.id,
        user: {
          id: user.id,
          name: user.name,
          avatar_url: user.avatar_url,
          verified: false // Default to false since the column doesn't exist
        },
        book: {
          id: book.id,
          title: book.title,
          price: book.price,
          cover_image_url: book.cover_image_url
        },
        lastMessage: conv.lastMessage,
        timestamp: formatTimestamp(conv.timestamp),
        unread: conv.unread
      };
    });

    // Sort conversations: unread first, then by timestamp
    conversations.sort((a, b) => {
      if (a.unread && !b.unread) {
        return -1; // a comes first
      } else if (!a.unread && b.unread) {
        return 1; // b comes first
      } else {
        // Both are either unread or read, so sort by timestamp
        return new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime();
      }
    });

    return { data: conversations, error: null };
  } catch (error) {
    console.error('Error fetching conversations:', error);
    return { data: [], error };
  }
};

/**
 * Get messages between two users
 */
export const getConversationMessages = async (userId: string, otherUserId: string, bookId?: string) => {
  try {
    if (!userId || !otherUserId) {
      console.error('getConversationMessages: userId and otherUserId are required');
      return { data: [], error: new Error('User IDs are required') };
    }

    console.log(`Fetching messages between ${userId} and ${otherUserId}${bookId ? ` for book ${bookId}` : ''}`);

    // Build the base query for messages without joining profiles
    let query = supabase
      .from('messages')
      .select(`
        id,
        sender_id,
        receiver_id,
        book_id,
        content,
        created_at,
        updated_at,
        status
      `)
      .or(`and(sender_id.eq.${userId},receiver_id.eq.${otherUserId}),and(sender_id.eq.${otherUserId},receiver_id.eq.${userId})`)
      .order('created_at', { ascending: true });
    
    // If bookId is provided, add it as a separate filter
    if (bookId) {
      query = query.eq('book_id', bookId);
    }
    
    // Increase limit to ensure we get all messages - বেশি মেসেজ লোড করার জন্য লিমিট বাড়ানো
    query = query.limit(500);
    
    const { data, error } = await query;

    if (error) {
      console.error('Error fetching messages:', error);
      throw error;
    }

    console.log(`Fetched ${data?.length || 0} messages from database`);
    let messages = data || [];

    // Get sender profiles in a separate query
    const senderIds = [...new Set(messages.map(msg => msg.sender_id))];
    
    // যদি কোন মেসেজ না থাকে তাহলে খালি অ্যারে রিটার্ন করা
    if (messages.length === 0 && !bookId) {
      return { data: [], error: null };
    }

    // Get sender profiles
    const { data: profilesData, error: profilesError } = await supabase
      .from('profiles')
      .select('id, name, avatar_url')
      .in('id', senderIds);
      
    if (profilesError) {
      console.error('Error fetching profiles:', profilesError);
      // Don't throw here, just continue with what we have
    }
    
    // Get all message IDs to fetch associated images
    const messageIds = messages.map(msg => msg.id);
    
    // Fetch image data for these messages from the message_images table
    let messageImages = [];
    try {
      const { data: imagesData, error: imagesError } = await supabase
        .from('message_images')
        .select('*')
        .in('message_id', messageIds);
        
      if (imagesError) {
        console.error('Error fetching message images:', imagesError);
      } else {
        messageImages = imagesData || [];
        console.log(`Fetched ${messageImages.length} image records`);
      }
    } catch (imagesError) {
      console.error('Error fetching message images:', imagesError);
    }
    
    // Get all book IDs from the messages
    const messageBookIds = messages
      .filter(msg => msg.book_id)
      .map(msg => msg.book_id);
    
    // Create an array of unique book IDs
    const uniqueBookIds = [...new Set([...messageBookIds, bookId].filter(Boolean))];
    
    // Get purchase requests that are associated with these users, regardless of book
    // এখানে আমরা বই কেনার অনুরোধগুলো আলাদাভাবে কুয়েরি করছি, সব বইয়ের জন্য
    let purchaseRequests: PurchaseRequest[] = [];
    
    // First check if there's at least one book ID
    if (uniqueBookIds.length > 0) {
      // Query purchase requests for all related book IDs
      const { data: requestsData, error: requestsError } = await supabase
        .from('purchase_requests')
        .select('*')
        .in('book_id', uniqueBookIds)
        .or(`and(buyer_id.eq.${userId},seller_id.eq.${otherUserId}),and(buyer_id.eq.${otherUserId},seller_id.eq.${userId})`)
        .order('created_at', { ascending: true });
        
      if (requestsError) {
        console.error('Error fetching purchase requests:', requestsError);
      } else {
        purchaseRequests = requestsData || [];
      }
    } else {
      // If there are no book IDs, still query purchase requests without book filter
      const { data: requestsData, error: requestsError } = await supabase
        .from('purchase_requests')
        .select('*')
        .or(`and(buyer_id.eq.${userId},seller_id.eq.${otherUserId}),and(buyer_id.eq.${otherUserId},seller_id.eq.${userId})`)
        .order('created_at', { ascending: true });
        
      if (requestsError) {
        console.error('Error fetching purchase requests:', requestsError);
      } else {
        purchaseRequests = requestsData || [];
      }
    }
    
    // Process messages with sender information and image data
    const processedMessages = messages.map((message: SupabaseMessageResponse): Message => {
      const sender = profilesData?.find(p => p.id === message.sender_id);
      const isOwn = message.sender_id === userId;
      
      // Find associated image data if any
      const imageData = messageImages.find(img => img.message_id === message.id);
      
      // Check for image placeholder in content
      const isImageMessage = message.content === '[ছবি]' || message.content.includes('[ডকুমেন্ট:');
      
      // Check localStorage for backup data
      let backupData = null;
      try {
        const storedData = localStorage.getItem(`msg_backup_${message.id}`);
        if (storedData) {
          backupData = JSON.parse(storedData);
        }
      } catch (e) {
        console.warn('Error parsing backup data:', e);
      }
      
      return {
        ...message,
        sender_name: sender?.name || 'অজানা ব্যবহারকারী',
        sender_avatar_url: sender?.avatar_url || undefined,
        isOwn,
        isPurchaseRequest: false, // Default to false, we'll check for purchase requests separately
        // Add file information from message_images table or backup data
        file_url: imageData?.image_url || backupData?.file_url || undefined,
        file_type: imageData ? (imageData.image_path?.includes('image') ? 'image' : 'document') : 
                  (backupData?.file_type || (isImageMessage ? 'image' : undefined)),
        file_name: imageData?.file_name || backupData?.file_name || undefined
      };
    });
    
    // Add purchase request messages if they exist
    // বই কেনার অনুরোধগুলো মেসেজ লিস্টে যোগ করা
    const purchaseRequestMessages = purchaseRequests.map((request): Message => {
      const isOwn = request.buyer_id === userId;
      return {
        id: `purchase-request-${request.id}`,
        sender_id: request.buyer_id,
        receiver_id: request.seller_id,
        book_id: request.book_id,
        content: `বই কেনার অনুরোধ: ${request.proposed_price} টাকা`,
        created_at: request.created_at,
        updated_at: request.created_at,
        sender_name: isOwn ? 'আপনি' : 'অজানা ব্যবহারকারী',
        isOwn,
        isPurchaseRequest: true,
        purchaseRequest: request,
        status: 'delivered'
      };
    });
    
    // Merge regular messages with purchase request messages and sort by date
    const allMessages = [...processedMessages, ...purchaseRequestMessages].sort((a, b) => 
      new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
    );

    // If there are no messages but we have purchase requests, return them
    if (messages.length === 0 && purchaseRequestMessages.length > 0) {
      return { data: purchaseRequestMessages, error: null };
    }

    return { data: allMessages, error: null };
  } catch (error) {
    console.error('Error in getConversationMessages:', error);
    return { data: [], error };
  }
};

/**
 * Send a new message
 */
export const sendMessage = async (senderId: string, receiverId: string, content: string, bookId?: string) => {
  try {
    if (!senderId || !receiverId || !content) {
      console.error('sendMessage: senderId, receiverId, and content are required');
      return { data: null, error: new Error('Missing required fields') };
    }

    // Generate a deterministic conversation_id (sender & receiver sorted, plus optional book)
    const conversationId = [senderId, receiverId].sort().join('_') + (bookId ? `_${bookId}` : '');

    // Create the base message object
    const messageData: any = {
      sender_id: senderId,
      receiver_id: receiverId,
      content: content.trim(),
      status: 'sent', // Initialize with 'sent' status
      message_type: 'text' // Add message_type to match schema
    };

    // Only add book_id if it exists and is not undefined or null
    if (bookId) {
      messageData.book_id = bookId;
    }

    console.log('Sending message with data:', messageData);

    // Create a fake message for optimistic UI updates in case the real insert fails
    const fakeMessage = {
      id: `temp-${Date.now()}`,
      sender_id: senderId,
      receiver_id: receiverId,
      book_id: bookId,
      content: content.trim(),
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      status: 'sent',
      message_type: 'text',
      sender_name: 'আপনি',
      sender_avatar_url: null,
      isOwn: true
    };

    // Try to insert the message
    try {
      const { data, error } = await supabase
        .from('messages')
        .insert(messageData)
        .select();

      if (error) {
        // If the error is related to the notifications table, we can still return a fake message
        if (error.message && error.message.includes('notifications')) {
          console.warn('Message sent but notification creation failed:', error);
          
          // Get sender profile to include in the returned fake message
          const { data: profileData } = await supabase
            .from('profiles')
            .select('name, avatar_url')
            .eq('id', senderId)
            .single();
            
          // Return fake message with sender info
          const enrichedFakeMessage = {
            ...fakeMessage,
            sender_name: profileData?.name || 'অজানা ব্যবহারকারী',
            sender_avatar_url: profileData?.avatar_url
          };
          
          console.log('Returning fake message due to notification error:', enrichedFakeMessage);
          return { data: enrichedFakeMessage, error: null };
        }
        
        // For other errors, throw normally
        throw error;
      }

      // Get sender profile to include in the returned message
      const { data: profileData } = await supabase
        .from('profiles')
        .select('name, avatar_url')
        .eq('id', senderId)
        .single();

      // Return message with sender info and isOwn flag
      const enrichedMessage = {
        ...data?.[0],
        sender_name: profileData?.name || 'অজানা ব্যবহারকারী',
        sender_avatar_url: profileData?.avatar_url,
        isOwn: true, // This message was sent by the current user
        status: 'sent' // Explicitly set status for the returned message
      };
      
      // Create notification for the receiver
      try {
        console.log('Creating notification for new message');
        await createNotification({
          user_id: receiverId,
          message: `${profileData?.name || 'একজন ব্যবহারকারী'} আপনাকে একটি বার্তা পাঠিয়েছেন।`,
          type: bookId ? 'purchase_request' : 'message',
          related_id: bookId || undefined,
          sender_id: senderId,
          action_url: `/messages?seller=${senderId}${bookId ? `&bookId=${bookId}` : ''}`
        });
        console.log('Message notification created successfully');
      } catch (notificationError) {
        console.error('Error creating message notification:', notificationError);
        // নোটিফিকেশন তৈরিতে ব্যর্থ হলেও প্রক্রিয়া চালিয়ে যাওয়া
      }

      console.log('Message sent successfully:', enrichedMessage);
      return { data: enrichedMessage, error: null };
    } catch (insertError) {
      console.error('Error inserting message:', insertError);
      
      // If all else fails, return a fake message to keep the UI working
      return { data: fakeMessage, error: insertError };
    }
  } catch (error) {
    console.error('Error sending message:', error);
    return { data: null, error };
  }
};

/**
 * Upload a file to Supabase Storage for messaging
 */
export const uploadMessageFile = async (senderId: string, file: File, fileType: 'image' | 'document') => {
  try {
    console.log('Starting file upload process:', fileType);
    
    // Create a more robust filename
    const fileExt = file.name.split('.').pop()?.toLowerCase() || 'file';
    const fileName = `${senderId}-${Date.now()}-${Math.random().toString(36).substring(2)}.${fileExt}`;
    
    // Use proper folder structure based on file type
    const folderPath = fileType === 'image' ? 'message_images' : 'message_documents';
    const filePath = `${folderPath}/${fileName}`;
    
    console.log(`Uploading ${fileType} to path:`, filePath);
    
    // First check if user is authenticated
    const { data: { session }, error: authError } = await supabase.auth.getSession();
    if (authError || !session) {
      console.error('Authentication error during file upload:', authError);
      throw new Error('আপনি লগইন অবস্থায় নেই। দয়া করে আবার লগইন করুন।');
    }
    
    // Validate file size (max 10MB)
    const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB
    if (file.size > MAX_FILE_SIZE) {
      throw new Error(`ফাইল সাইজ 10MB এর বেশি হতে পারবে না। আপনার ফাইল সাইজ: ${(file.size / (1024 * 1024)).toFixed(2)}MB`);
    }
    
    // Validate file type
    if (fileType === 'image' && !file.type.startsWith('image/')) {
      throw new Error('সিলেক্ট করা ফাইলটি একটি ছবি নয়।');
    }
    
    if (fileType === 'document' && !['application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document', 
      'text/plain', 'application/vnd.ms-excel', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet', 
      'application/vnd.ms-powerpoint', 'application/vnd.openxmlformats-officedocument.presentationml.presentation'].includes(file.type)) {
      throw new Error('সিলেক্ট করা ফাইলটি সমর্থিত ডকুমেন্ট ফরম্যাট নয়।');
    }
    
    // First check if the messages bucket exists
    console.log('Checking if messages bucket exists...');
    const { data: buckets, error: bucketsError } = await supabase.storage.listBuckets();
    
    if (bucketsError) {
      console.error('Error checking buckets:', bucketsError);
      // Continue anyway, the bucket might still exist
    } else {
      const messagesBucket = buckets?.find(bucket => bucket.name === 'messages');
      if (!messagesBucket) {
        console.log('Messages bucket not found. Attempting to create it...');
        try {
          const { error: createError } = await supabase.storage.createBucket('messages', {
            public: true
          });
          
          if (createError) {
            console.error('Error creating messages bucket:', createError);
            // Continue anyway, the upload might still work
          } else {
            console.log('Messages bucket created successfully');
          }
        } catch (createError) {
          console.error('Error creating bucket:', createError);
          // Continue anyway
        }
      } else {
        console.log('Messages bucket exists');
      }
    }
    
    // Try to create the folder if it doesn't exist
    try {
      const { data: folderCheck, error: folderError } = await supabase.storage
        .from('messages')
        .list(folderPath);
        
      if (folderError && folderError.message.includes('not found')) {
        console.log(`Creating ${folderPath} folder...`);
        const { error: createFolderError } = await supabase.storage
          .from('messages')
          .upload(`${folderPath}/.keep`, new Blob([''], { type: 'text/plain' }));
          
        if (createFolderError) {
          console.error(`Error creating ${folderPath} folder:`, createFolderError);
          // Continue anyway
        } else {
          console.log(`${folderPath} folder created successfully`);
        }
      }
    } catch (folderError) {
      console.error('Error checking folder:', folderError);
      // Continue anyway
    }
    
    // Try direct upload to messages bucket
    console.log('Attempting direct upload to messages bucket');
    
    // Perform the upload
    const { data: uploadData, error: uploadError } = await supabase.storage
      .from('messages')
      .upload(filePath, file, {
        cacheControl: '3600',
        upsert: true // Overwrite if exists
      });
    
    // Handle upload error
    if (uploadError) {
      console.error('Error uploading file:', uploadError);
      
      // Try uploading to root of bucket as fallback
      console.log('Trying fallback upload to root of bucket');
      const rootFilePath = `${fileName}`;
      
      const { data: rootUploadData, error: rootUploadError } = await supabase.storage
        .from('messages')
        .upload(rootFilePath, file, {
          cacheControl: '3600',
          upsert: true
        });
        
      if (rootUploadError) {
        console.error('Fallback upload also failed:', rootUploadError);
        throw new Error(`ফাইল আপলোড করতে সমস্যা হয়েছে: ${uploadError.message}`);
      }
      
      console.log('Fallback upload successful:', rootUploadData?.path);
      
      // Get the public URL for the root upload
      const { data: { publicUrl: rootPublicUrl } } = supabase.storage
        .from('messages')
        .getPublicUrl(rootFilePath);
        
      console.log('Fallback file public URL:', rootPublicUrl);
      
      // Force HTTPS for Supabase URLs
      let securePublicUrl = rootPublicUrl;
      if (securePublicUrl.startsWith('http://') && securePublicUrl.includes('supabase')) {
        securePublicUrl = securePublicUrl.replace('http://', 'https://');
      }
      
      return { 
        success: true, 
        publicUrl: securePublicUrl, 
        fileName: file.name,
        fileType
      };
    }
    
    if (!uploadData) {
      throw new Error('ফাইল আপলোড করা হয়েছে কিন্তু ডাটা পাওয়া যায়নি।');
    }
    
    console.log('File uploaded successfully:', uploadData.path);
    
    // Get the public URL
    const { data: { publicUrl } } = supabase.storage
      .from('messages')
      .getPublicUrl(filePath);
      
    console.log('File public URL:', publicUrl);
    
    // Force HTTPS for Supabase URLs
    let securePublicUrl = publicUrl;
    if (securePublicUrl.startsWith('http://') && securePublicUrl.includes('supabase')) {
      securePublicUrl = securePublicUrl.replace('http://', 'https://');
      console.log('Converted public URL to HTTPS:', securePublicUrl);
    }
    
    // Create a signed URL as backup
    try {
      const { data: signedUrlData } = await supabase.storage
        .from('messages')
        .createSignedUrl(filePath, 60 * 60 * 24); // 24 hours expiration
        
      if (signedUrlData?.signedUrl) {
        console.log('Created backup signed URL with 24h expiration');
        // Store in sessionStorage as backup
        sessionStorage.setItem(`backup_url_${fileName}`, signedUrlData.signedUrl);
      }
    } catch (signedError) {
      console.warn('Could not create backup signed URL:', signedError);
      // Continue anyway
    }
    
    // Test the URL is accessible
    try {
      console.log('Testing file URL is accessible...');
      const testResponse = await fetch(securePublicUrl, { method: 'HEAD' });
      if (testResponse.ok) {
        console.log('File URL is accessible:', securePublicUrl);
      } else {
        console.warn(`File URL returned status ${testResponse.status}:`, securePublicUrl);
      }
    } catch (testError) {
      console.warn('Could not test file URL:', testError);
    }
    
    return { 
      success: true, 
      publicUrl: securePublicUrl, 
      fileName: file.name,
      fileType
    };
  } catch (error) {
    console.error('Error uploading message file:', error);
    return { 
      success: false, 
      error: error instanceof Error ? error : new Error('ফাইল আপলোড করতে সমস্যা হয়েছে।') 
    };
  }
};

/**
 * Send a message with a file attachment
 */
export const sendMessageWithFile = async (
  senderId: string, 
  receiverId: string, 
  content: string, 
  file: File,
  fileType: 'image' | 'document',
  bookId?: string
) => {
  try {
    // First upload the file
    const { success, publicUrl, fileName, error } = await uploadMessageFile(senderId, file, fileType);
    
    if (!success || !publicUrl) {
      throw error || new Error('Failed to upload file');
    }
    
    console.log('File uploaded successfully with URL:', publicUrl);
    
    // Store the URL in localStorage as a backup in case it expires
    const backupKey = `file_backup_${Date.now()}`;
    try {
      // Fetch the file and store as base64 data URL for images only (to avoid large storage)
      if (fileType === 'image' && file.size < 5 * 1024 * 1024) { // Only for images under 5MB
        const reader = new FileReader();
        reader.readAsDataURL(file);
        reader.onloadend = () => {
          const base64data = reader.result;
          if (typeof base64data === 'string') {
            localStorage.setItem(backupKey, base64data);
            localStorage.setItem(`${backupKey}_url`, publicUrl);
            console.log('Backup image data stored in localStorage');
          }
        };
      }
    } catch (backupError) {
      console.warn('Could not create backup of file:', backupError);
      // Continue anyway, this is just a backup
    }
    
    // Prepare message content
    let messageContent = content;
    
    // For images, if no content is provided, use a placeholder
    if (fileType === 'image' && !content.trim()) {
      messageContent = '[ছবি]'; // Use a placeholder text that indicates an image
      console.log('Using placeholder content for image message');
    } 
    // For documents, ensure we have some content
    else if (fileType === 'document' && !content.trim()) {
      messageContent = `[ডকুমেন্ট: ${fileName || 'ফাইল'}]`;
    }
    
    console.log(`Sending message with file. Content: "${messageContent}", File URL: ${publicUrl}`);
    
    // Create a simple message first without file fields
    const messageData = {
      sender_id: senderId,
      receiver_id: receiverId,
      content: messageContent,
      status: 'sent'
    };
    
    // Add book_id if provided
    if (bookId) {
      messageData['book_id'] = bookId;
    }
    
    console.log('Sending base message:', messageData);
    
    // Insert the message first
    const { data: message, error: messageError } = await supabase
      .from('messages')
      .insert(messageData)
      .select('*')
      .single();
    
    if (messageError) {
      console.error('Error inserting message:', messageError);
      throw messageError;
    }
    
    console.log('Base message inserted successfully:', message);
    
    // Now store the file information in the message_images table
    if (message && message.id) {
      try {
        // First try using the store_message_image function if it exists
        const { data: imageRecord, error: functionError } = await supabase.rpc(
          'store_message_image',
          {
            p_message_id: message.id,
            p_image_url: publicUrl,
            p_image_path: fileType === 'image' ? 'message_images' : 'message_documents',
            p_file_name: fileName
          }
        );
        
        if (functionError) {
          console.warn('Could not use store_message_image function:', functionError);
          
          // Fall back to direct insert
          const { data: directImageRecord, error: directError } = await supabase
            .from('message_images')
            .insert({
              message_id: message.id,
              image_url: publicUrl,
              image_path: fileType === 'image' ? 'message_images' : 'message_documents',
              file_name: fileName
            })
            .select('*')
            .single();
            
          if (directError) {
            console.error('Error storing image record:', directError);
            // Continue anyway, the base message was sent
          } else {
            console.log('Image record stored successfully:', directImageRecord);
          }
        } else {
          console.log('Image record stored successfully using function:', imageRecord);
        }
      } catch (imageError) {
        console.error('Error storing image record:', imageError);
        // Continue anyway, the base message was sent
      }
    }
    
    // Create a backup record in localStorage to ensure we can retrieve the image later
    try {
      const backupRecord = {
        id: message.id,
        file_url: publicUrl,
        file_type: fileType,
        file_name: fileName,
        timestamp: new Date().toISOString()
      };
      localStorage.setItem(`msg_backup_${message.id}`, JSON.stringify(backupRecord));
    } catch (backupError) {
      console.warn('Could not create backup record:', backupError);
    }
    
    // Create notification
    try {
      await createNotification({
        user_id: receiverId,
        sender_id: senderId,
        type: 'message',
        message: fileType === 'image' ? 'আপনাকে একটি ছবি পাঠিয়েছে' : `আপনাকে একটি ডকুমেন্ট পাঠিয়েছে`,
        action_url: `/messages?seller=${senderId}${bookId ? `&bookId=${bookId}` : ''}`,
      });
    } catch (notifError) {
      console.error('Error creating notification:', notifError);
      // Don't throw, continue with message sending
    }
    
    // Return the message with additional file info
    return { 
      success: true, 
      message: {
        ...message,
        file_url: publicUrl,
        file_type: fileType,
        file_name: fileName
      }
    };
  } catch (error) {
    console.error('Error sending message with file:', error);
    return { success: false, error };
  }
};

/**
 * Subscribe to messages between two users - optimized for local development with proper Supabase realtime
 */
export const subscribeToMessages = (userId: string, otherUserId: string, callback: (payload: any) => void) => {
  if (!userId || !otherUserId) {
    console.error('subscribeToMessages: userId and otherUserId are required');
    return { unsubscribe: () => {} };
  }
  
  try {
    // Create a unique channel name for this conversation
    const conversationKey = [userId, otherUserId].sort().join('_');
    const channelName = `messages_${conversationKey}`;
    
    console.log(`🔔 Setting up Supabase realtime subscription:`);
    console.log(`   - Channel: ${channelName}`);
    console.log(`   - Users: ${userId} <-> ${otherUserId}`);
    console.log(`   - Supabase URL: ${supabaseUrl}`);
    console.log(`   - Client URL: ${window.location.origin}`);
    console.log(`   - Signaling Server Port: 3001`);
    
    // Track processed message IDs to prevent duplicates
    const processedMessageIds = new Set<string>();
    let reconnectAttempts = 0;
    const maxReconnectAttempts = 5;
    
    // Create the subscription channel with simplified config
    const channel = supabase
      .channel(channelName)
      .on('postgres_changes', {
        event: 'INSERT',
        schema: 'public',
        table: 'messages'
      }, async (payload) => {
        // Quick filter on client – only process rows belonging to this conversation
        if (!payload.new) return;
        if (!(
          (payload.new.sender_id === userId && payload.new.receiver_id === otherUserId) ||
          (payload.new.sender_id === otherUserId && payload.new.receiver_id === userId)
        )) {
          return;
        }
        console.log('🆕 New message INSERT event received:', {
          event: payload.eventType,
          table: payload.table,
          schema: payload.schema,
          messageId: payload.new?.id,
          sender: payload.new?.sender_id,
          receiver: payload.new?.receiver_id
        });
        
        if (!payload.new) {
          console.warn('⚠️ INSERT payload missing new data');
          return;
        }
        
        try {
          const messageId = payload.new.id as string;
          
          // Skip if we've already processed this message
          if (processedMessageIds.has(messageId)) {
            console.log('⏭️ Skipping duplicate message:', messageId);
            return;
          }
          
          // Add to processed set with TTL cleanup
          processedMessageIds.add(messageId);
          setTimeout(() => processedMessageIds.delete(messageId), 60000); // Clean after 1 minute
          
          const message = payload.new as any;
          console.log('📨 Processing new message:', {
            id: message.id,
            sender_id: message.sender_id,
            receiver_id: message.receiver_id,
            content: message.content?.substring(0, 30) + '...',
            status: message.status,
            message_type: message.message_type,
            file_url: message.file_url ? 'Yes' : 'No',
            created_at: message.created_at
          });
          
          let enhancedMessage: Message;
          
          if (message.sender_id === userId) {
            // Current user is sender - this shouldn't happen often in realtime but handle it
            enhancedMessage = {
              ...message,
              sender_name: 'আপনি',
              sender_avatar_url: undefined,
              isOwn: true
            };
            console.log('👤 Message from current user (sent by me)');
          } else {
            // Message from other user - this is the common case
            console.log('👥 Message from other user, fetching profile...');
            
            let senderName = 'অজানা ব্যবহারকারী';
            let senderAvatarUrl = null;
            
            try {
              const { data: profile, error: profileError } = await supabase
                .from('profiles')
                .select('name, avatar_url')
                .eq('id', message.sender_id)
                .single();

              if (profileError) {
                console.error('❌ Error fetching sender profile:', profileError);
              } else if (profile) {
                senderName = profile.name || 'অজানা ব্যবহারকারী';
                senderAvatarUrl = profile.avatar_url;
                console.log('✅ Sender profile fetched:', senderName);
              }
            } catch (error) {
              console.error('❌ Exception fetching sender profile:', error);
            }
            
            enhancedMessage = {
              ...message,
              sender_name: senderName,
              sender_avatar_url: senderAvatarUrl,
              isOwn: false
            };
            
            // Mark incoming message as delivered immediately (async, don't wait)
            markMessageAsDelivered(message.id).catch(error => 
              console.error('❌ Error marking message as delivered:', error)
            );
          }
          
          // Add file information if present
          if (message.file_url) {
            enhancedMessage.file_url = message.file_url;
            enhancedMessage.file_type = message.file_type;
            enhancedMessage.file_name = message.file_name;
            console.log('📎 Message has file attachment:', message.file_type);
          }
          
          console.log('🚀 Sending enhanced message to UI callback');
          callback({ new: enhancedMessage, type: 'INSERT' });
          
        } catch (error) {
          console.error('❌ Error processing real-time INSERT message:', error);
        }
      })
      .on('postgres_changes', {
        event: 'UPDATE',
        schema: 'public',
        table: 'messages'
      }, (payload) => {
        if (!payload.new) return;
        if (!(
          (payload.new.sender_id === userId && payload.new.receiver_id === otherUserId) ||
          (payload.new.sender_id === otherUserId && payload.new.receiver_id === userId)
        )) {
          return;
        }
        console.log('🔄 Message UPDATE event received:', {
          event: payload.eventType,
          messageId: payload.new?.id,
          oldStatus: payload.old?.status,
          newStatus: payload.new?.status
        });
        
        if (payload.new) {
          const updatedMessage = {
            ...payload.new,
            isOwn: payload.new.sender_id === userId
          };
          
          callback({ 
            type: 'UPDATE',
            new: updatedMessage,
            old: payload.old
          });
          
          console.log('✅ Message status update sent to UI');
        }
      })
      .on('system', {}, (payload) => {
        console.log('🔧 System event:', payload);
      });
    
    // Subscribe with enhanced error handling and connection monitoring
    const subscribePromise = channel.subscribe((status, err) => {
      console.log(`📡 [${new Date().toISOString()}] Subscription status: ${status}`);
      
      switch (status) {
        case 'SUBSCRIBED':
          console.log(`✅ Successfully subscribed to realtime messages!`);
          console.log('🔍 Connection details:', {
            channelName,
            topic: channel.topic,
            state: channel.state,
            socketUrl: supabase.realtime.channels[0]?.socket?.endPoint
          });
          reconnectAttempts = 0; // Reset on successful connection
          break;
          
        case 'CHANNEL_ERROR':
          console.error(`❌ Channel error:`, err);
          
          // Implement exponential backoff for reconnection
          if (reconnectAttempts < maxReconnectAttempts) {
            reconnectAttempts++;
            const delay = Math.min(1000 * Math.pow(2, reconnectAttempts), 30000); // Max 30s delay
            console.log(`🔄 Attempting to reconnect in ${delay}ms (attempt ${reconnectAttempts}/${maxReconnectAttempts})`);
            
            setTimeout(() => {
              console.log('🔄 Reconnecting channel...');
              channel.subscribe();
            }, delay);
          } else {
            console.error('❌ Max reconnection attempts reached. Please refresh the page.');
          }
          break;
          
        case 'TIMED_OUT':
          console.error(`⏰ Subscription timed out`);
          // Try to reconnect after timeout
          setTimeout(() => {
            console.log('🔄 Attempting to reconnect after timeout...');
            channel.subscribe();
          }, 5000);
          break;
          
        case 'CLOSED':
          console.log(`🔒 Subscription closed`);
          break;
          
        default:
          console.log(`📊 Status: ${status}`);
      }
    });
    
    // Monitor connection health
    const healthCheck = setInterval(() => {
      const currentState = channel.state;
      if (currentState !== 'joined') {
        // Only warn if the channel was expected to be joined
        if (['errored', 'closed'].includes(currentState)) {
          console.warn(`⚠️ [Health Check] Channel not joined (state: ${currentState})`, {
            channelName,
            socketState: supabase.realtime.isConnected()
          });
        }
        // Attempt to reconnect once if the channel is closed
        if (currentState === 'closed' && reconnectAttempts < maxReconnectAttempts) {
          reconnectAttempts++;
          console.log('🔄 Health check reconnect attempt', reconnectAttempts);
          channel.subscribe();
        }
      }
    }, 30000); // Check every 30 seconds
    
    // Log initial connection attempt
    console.log('🎯 Subscription setup complete, waiting for connection...');
    
    // Return enhanced channel object with proper cleanup
    return {
      channel,
      unsubscribe: () => {
        console.log('🧹 Cleaning up message subscription...');
        clearInterval(healthCheck);
        processedMessageIds.clear();
        reconnectAttempts = 0;
        
        try {
          return channel.unsubscribe();
        } catch (error) {
          console.error('Error during unsubscribe:', error);
          return Promise.resolve({ error: null });
        }
      },
      // Expose channel state for debugging
      getState: () => ({
        channelState: channel.state,
        processedCount: processedMessageIds.size,
        reconnectAttempts
      })
    };
    
  } catch (error) {
    console.error('❌ Fatal error creating message subscription:', error);
    return { 
      unsubscribe: () => {},
      getState: () => ({ error: error.message })
    };
  }
};

/**
 * Subscribe to purchase requests between users for a specific book
 */
export const subscribeToPurchaseRequests = (userId: string, otherUserId: string, bookId: string | null, callback: (payload: any) => void) => {
  if (!userId || !otherUserId) {
    console.error('subscribeToPurchaseRequests: userId and otherUserId are required');
    return { unsubscribe: () => {} };
  }
  
  try {
    let filterString = `or(and(buyer_id=eq.${userId},seller_id=eq.${otherUserId}),and(buyer_id=eq.${otherUserId},seller_id=eq.${userId}))`;
    
    // Add book filter if provided
    if (bookId) {
      filterString = `and(${filterString},book_id=eq.${bookId})`;
    }
    
    // Create a unique channel ID
    const channelId = [userId, otherUserId, bookId || 'all'].join('_');
    
    // Track processed request IDs to prevent duplicates
    const processedRequestIds = new Set<string>();
    
    return supabase
      .channel(`purchase-requests-${channelId}`)
      .on('postgres_changes', { 
        event: '*', // Listen to all events (INSERT, UPDATE, DELETE)
        schema: 'public',
        table: 'purchase_requests',
        filter: filterString
      }, async (payload: any) => {
        console.log('Purchase request update received:', payload);
        
        if (payload.new || payload.old) {
          const requestData = payload.new || payload.old;
          
          if (!requestData || !requestData.id) {
            console.error('Invalid purchase request data:', requestData);
            return;
          }
          
          // Skip if we've already processed this request (for INSERT events)
          if (payload.eventType === 'INSERT') {
            if (processedRequestIds.has(requestData.id)) {
              console.log('Skipping duplicate purchase request:', requestData.id);
              return;
            }
            
            // Add to processed set
            processedRequestIds.add(requestData.id);
          }
          
          // Fetch buyer info
          try {
            const { data: profile } = await supabase
              .from('profiles')
              .select('name')
              .eq('id', requestData.buyer_id)
              .single();

            const buyerName = profile?.name || 'অজানা ব্যবহারকারী';
            
            // Create a message-like object without strict typing
            const messageObj = {
              id: `pr-${requestData.id}`,
              sender_id: requestData.buyer_id,
              receiver_id: requestData.seller_id,
              book_id: requestData.book_id,
              content: `বই কেনার অনুরোধ: ${requestData.message || 'কোন বার্তা নেই'}`,
              created_at: requestData.created_at,
              updated_at: requestData.created_at,
              sender_name: buyerName,
              sender_avatar_url: undefined,
              isOwn: requestData.buyer_id === userId,
              isPurchaseRequest: true,
              purchaseRequest: {
                ...requestData,
                buyer_name: buyerName
              }
            };
            
            callback({ 
              event: payload.eventType,
              new: messageObj 
            });
          } catch (error) {
            console.error('Error processing purchase request update:', error);
          }
        }
      })
      .subscribe();
  } catch (error) {
    console.error('Error subscribing to purchase requests:', error);
    return { unsubscribe: () => {} };
  }
};

/**
 * Format timestamp to relative time
 */
export const formatTimestamp = (timestamp: string) => {
  const now = new Date();
  const messageTime = new Date(timestamp);
  const diffInSeconds = Math.floor((now.getTime() - messageTime.getTime()) / 1000);
  
  if (diffInSeconds < 60) {
    return 'এইমাত্র';
  } else if (diffInSeconds < 3600) {
    const minutes = Math.floor(diffInSeconds / 60);
    return `${minutes} মিনিট আগে`;
  } else if (diffInSeconds < 86400) {
    const hours = Math.floor(diffInSeconds / 3600);
    return `${hours} ঘন্টা আগে`;
  } else if (diffInSeconds < 604800) {
    const days = Math.floor(diffInSeconds / 86400);
    return `${days} দিন আগে`;
  } else {
    return messageTime.toLocaleDateString('bn-BD');
  }
};

/**
 * Get book details
 */
export const getBookDetails = async (bookId: string) => {
  try {
    if (!bookId) {
      console.error('getBookDetails: bookId is required');
      return { data: null, error: new Error('Book ID is required') };
    }

    // First check if the book exists
    const { count, error: countError } = await supabase
      .from('books')
      .select('*', { count: 'exact', head: true })
      .eq('id', bookId);
      
    if (countError) {
      console.error('Error checking book existence:', countError);
      return { data: null, error: countError };
    }
    
    // If book doesn't exist, return null instead of throwing an error
    if (count === 0) {
      console.warn(`Book with ID ${bookId} not found`);
      return { data: null, error: null };
    }

    const { data, error } = await supabase
      .from('books')
      .select('*')
      .eq('id', bookId)
      .single();

    if (error) {
      console.error('Error fetching book details:', error);
      return { data: null, error };
    }

    return { data, error: null };
  } catch (error) {
    console.error('Error fetching book details:', error);
    return { data: null, error };
  }
};

/**
 * Mark a message as delivered
 */
export const markMessageAsDelivered = async (messageId: string) => {
  try {
    if (!messageId) {
      return { success: false, error: new Error('Message ID is required') };
    }

    const { error } = await supabase
      .from('messages')
      .update({ status: 'delivered' })
      .eq('id', messageId);

    if (error) {
      console.error('Error marking message as delivered:', error);
      throw error;
    }

    return { success: true, error: null };
  } catch (error) {
    console.error('Error marking message as delivered:', error);
    return { success: false, error };
  }
};

/**
 * Mark a message as read
 */
export const markMessageAsRead = async (messageId: string) => {
  try {
    if (!messageId) {
      return { success: false, error: new Error('Message ID is required') };
    }

    const { error } = await supabase
      .from('messages')
      .update({ status: 'read' })
      .eq('id', messageId);

    if (error) {
      console.error('Error marking message as read:', error);
      throw error;
    }

    return { success: true, error: null };
  } catch (error) {
    console.error('Error marking message as read:', error);
    return { success: false, error };
  }
};

/**
 * Mark all messages from a specific sender as read
 */
export const markAllMessagesAsRead = async (receiverId: string, senderId: string) => {
  try {
    if (!receiverId || !senderId) {
      console.error('markAllMessagesAsRead: receiverId and senderId are required');
      return { success: false, error: new Error('Receiver ID and Sender ID are required') };
    }

    console.log(`Marking messages as read: receiver=${receiverId}, sender=${senderId}`);

    // First check how many messages will be affected
    const { data: messagesToUpdate, error: countError } = await supabase
      .from('messages')
      .select('id, status')
      .eq('receiver_id', receiverId)
      .eq('sender_id', senderId)
      .not('status', 'eq', 'read');

    if (countError) {
      console.error('Error counting messages to mark as read:', countError);
      return { success: false, error: countError };
    }

    console.log(`Found ${messagesToUpdate?.length || 0} messages to mark as read`);
    
    // Log message IDs for debugging
    if (messagesToUpdate && messagesToUpdate.length > 0) {
      console.log('Message IDs to update:', messagesToUpdate.map(m => m.id).join(', '));
    }

    if (!messagesToUpdate || messagesToUpdate.length === 0) {
      console.log('No messages to update, returning early');
      return { success: true, error: null };
    }

    // Update each message individually to ensure they're all updated
    const messageIds = messagesToUpdate.map(m => m.id);
    
    // Update all messages at once
    const { error } = await supabase
      .from('messages')
      .update({ status: 'read' })
      .in('id', messageIds);

    if (error) {
      console.error('Error marking messages as read:', error);
      return { success: false, error };
    }

    console.log(`Successfully marked ${messagesToUpdate.length} messages as read`);
    
    // Double check that messages were actually updated
    const { data: verifyData, error: verifyError } = await supabase
      .from('messages')
      .select('id, status')
      .in('id', messageIds);
      
    if (verifyError) {
      console.error('Error verifying message updates:', verifyError);
    } else {
      const unreadCount = verifyData.filter(m => m.status !== 'read').length;
      if (unreadCount > 0) {
        console.warn(`${unreadCount} messages still not marked as read after update`);
      } else {
        console.log('All messages successfully verified as read');
      }
    }
    
    // Trigger a custom event to notify all components that messages were read
    if (typeof window !== 'undefined') {
      console.log('Dispatching custom event: messages-marked-read');
      window.dispatchEvent(new CustomEvent('messages-marked-read', { 
        detail: { receiverId, senderId, count: messagesToUpdate.length }
      }));
    }
    
    return { success: true, error: null };
  } catch (error) {
    console.error('Error marking messages as read:', error);
    return { success: false, error };
  }
};

/**
 * Count unread messages for a user
 */
export const countUnreadMessages = async (userId: string) => {
  try {
    if (!userId) {
      return { count: 0, error: new Error('User ID is required') };
    }

    console.log(`Counting unread messages for user ${userId}`);

    // শুধুমাত্র সেই মেসেজগুলো গণনা করা যেগুলো receiver_id হল বর্তমান ইউজার এবং status 'read' নয়
    // স্পষ্টভাবে status 'sent' বা 'delivered' বা null চেক করা
    const { data, error } = await supabase
      .from('messages')
      .select('id, status')
      .eq('receiver_id', userId)
      .or('status.neq.read,status.is.null');

    if (error) {
      console.error('Error counting unread messages:', error);
      throw error;
    }

    // ম্যানুয়ালি গণনা করা
    const unreadCount = data ? data.length : 0;
    console.log(`Found ${unreadCount} unread messages for user ${userId}`);
    
    // ডিবাগিং লগ যোগ করা
    if (data && data.length > 0) {
      console.log('Sample unread messages:', data.slice(0, 3));
    }

    return { count: unreadCount, error: null };
  } catch (error) {
    console.error('Error counting unread messages:', error);
    return { count: 0, error };
  }
};

/**
 * Directly mark messages as read in the database
 * This is a more direct approach than markAllMessagesAsRead
 */
export const directMarkMessagesAsRead = async (receiverId: string, senderId: string) => {
  try {
    if (!receiverId || !senderId) {
      console.error('directMarkMessagesAsRead: receiverId and senderId are required');
      return { success: false, error: new Error('Receiver ID and Sender ID are required') };
    }

    console.log(`Directly marking messages as read: receiver=${receiverId}, sender=${senderId}`);

    // First check if there are any unread messages (including null status)
    const { data, error: checkError } = await supabase
      .from('messages')
      .select('id, status')
      .eq('receiver_id', receiverId)
      .eq('sender_id', senderId)
      .or('status.neq.read,status.is.null');
    
    if (checkError) {
      console.error('Error checking unread messages:', checkError);
      return { success: false, error: checkError };
    }
    
    if (!data || data.length === 0) {
      console.log('No unread messages to mark as read');
      return { success: true, count: 0, error: null };
    }
    
    console.log(`Found ${data.length} unread messages to mark as read`);
    console.log('Messages to update:', data.map(m => ({ id: m.id.substring(0, 8), status: m.status })));
    
    // Update messages directly
    const messageIds = data.map(m => m.id);
    const { error, count } = await supabase
      .from('messages')
      .update({ status: 'read', updated_at: new Date().toISOString() })
      .in('id', messageIds);
    
    if (error) {
      console.error('Error updating message status:', error);
      return { success: false, error };
    }
    
    console.log(`Successfully marked ${messageIds.length} messages as read directly (DB affected: ${count})`);
    
    // Double-check that the update was successful
    const { data: verifyData, error: verifyError } = await supabase
      .from('messages')
      .select('id, status')
      .in('id', messageIds);
      
    if (verifyError) {
      console.error('Error verifying message updates:', verifyError);
    } else {
      const stillUnread = verifyData.filter(m => m.status !== 'read');
      if (stillUnread.length > 0) {
        console.warn(`Warning: ${stillUnread.length} messages still not marked as read:`, 
          stillUnread.map(m => ({ id: m.id.substring(0, 8), status: m.status })));
      } else {
        console.log('✅ All messages successfully verified as read');
      }
    }
    
    // Trigger a custom event to notify all components that messages were read
    if (typeof window !== 'undefined') {
      console.log('Dispatching custom event: messages-marked-read');
      window.dispatchEvent(new CustomEvent('messages-marked-read', { 
        detail: { receiverId, senderId, count: messageIds.length }
      }));
      
      // Also dispatch unread count update event
      window.dispatchEvent(new CustomEvent('unread-messages-updated', {
        detail: { action: 'marked-read', count: messageIds.length }
      }));
    }
    
    return { success: true, count: messageIds.length, error: null };
  } catch (error) {
    console.error('Error marking messages as read:', error);
    return { success: false, error };
  }
};

/**
 * Download file from Supabase Storage by URL
 * This can help bypass CORS issues with direct image URLs
 */
export const getFileFromStorage = async (fileUrl: string, messageId?: string) => {
  try {
    console.log('Getting file from storage URL:', fileUrl);
    
    // First check if we have a backup in localStorage for this message
    if (messageId) {
      const backupData = localStorage.getItem(`msg_backup_${messageId}`);
      if (backupData) {
        try {
          const backup = JSON.parse(backupData);
          if (backup && backup.file_url) {
            console.log('Found backup URL for message:', backup.file_url);
            // Use the backup URL instead
            fileUrl = backup.file_url;
          }
        } catch (parseError) {
          console.warn('Could not parse backup data:', parseError);
        }
      }
    }
    
    // Check if we have a cached object URL for this file
    const cacheKey = `objurl_${fileUrl.split('/').pop()}`;
    const cachedBlobUrl = sessionStorage.getItem(cacheKey);
    
    if (cachedBlobUrl) {
      console.log('Using cached blob URL:', cachedBlobUrl);
      return { 
        success: true, 
        objectUrl: cachedBlobUrl,
        revoke: () => {
          URL.revokeObjectURL(cachedBlobUrl);
          sessionStorage.removeItem(cacheKey);
        }
      };
    }
    
    // Check if we have a base64 backup of this image in localStorage
    // This is a last resort if all other methods fail
    const allKeys = Object.keys(localStorage);
    const backupKeys = allKeys.filter(key => key.startsWith('file_backup_'));
    
    for (const key of backupKeys) {
      const urlKey = `${key}_url`;
      const storedUrl = localStorage.getItem(urlKey);
      
      if (storedUrl === fileUrl) {
        const base64Data = localStorage.getItem(key);
        if (base64Data && base64Data.startsWith('data:')) {
          console.log('Using base64 backup from localStorage');
          return {
            success: true,
            objectUrl: base64Data,
            revoke: () => {} // No need to revoke data URLs
          };
        }
      }
    }
    
    // Extract bucket and path from the URL
    if (!fileUrl.includes('/storage/v1/object/public/')) {
      console.error('Invalid storage URL format');
      
      // Try to download directly with fetch first before giving up
      try {
        console.log('Attempting to fetch directly:', fileUrl);
        const response = await fetch(fileUrl, { method: 'GET' });
        
        if (!response.ok) {
          throw new Error(`HTTP error: ${response.status}`);
        }
        
        const blob = await response.blob();
        const objectUrl = URL.createObjectURL(blob);
        
        console.log('Created object URL from direct fetch:', objectUrl);
        
        // Cache the object URL in sessionStorage
        sessionStorage.setItem(cacheKey, objectUrl);
        
        return { 
          success: true, 
          objectUrl,
          revoke: () => {
            URL.revokeObjectURL(objectUrl);
            sessionStorage.removeItem(cacheKey);
          }
        };
      } catch (fetchError) {
        console.error('Error fetching directly:', fetchError);
        
        // If direct fetch fails, try to reconstruct a valid URL
        try {
          // Try to extract file name and reconstruct URL
          const fileName = fileUrl.split('/').pop();
          if (fileName) {
            console.log('Attempting to reconstruct URL with filename:', fileName);
            
            // Reconstruct a proper URL to the messages bucket
            const reconstructedUrl = `${supabaseUrl}/storage/v1/object/public/messages/message_images/${fileName}`;
            console.log('Reconstructed URL:', reconstructedUrl);
            
            const response = await fetch(reconstructedUrl, { method: 'GET' });
            
            if (!response.ok) {
              throw new Error(`HTTP error: ${response.status}`);
            }
            
            const blob = await response.blob();
            const objectUrl = URL.createObjectURL(blob);
            
            console.log('Created object URL from reconstructed URL:', objectUrl);
            
            // Cache the object URL in sessionStorage
            sessionStorage.setItem(cacheKey, objectUrl);
            
            return { 
              success: true, 
              objectUrl,
              revoke: () => {
                URL.revokeObjectURL(objectUrl);
                sessionStorage.removeItem(cacheKey);
              }
            };
          }
        } catch (reconstructError) {
          console.error('Error with reconstructed URL:', reconstructError);
        }
        
        return { success: false, error: 'Invalid storage URL and direct fetch failed' };
      }
    }
    
    const urlParts = fileUrl.split('/storage/v1/object/public/');
    if (urlParts.length !== 2) {
      console.error('Could not parse storage URL');
      return { success: false, error: 'Could not parse storage URL' };
    }
    
    const bucketAndPath = urlParts[1];
    const slashIndex = bucketAndPath.indexOf('/');
    if (slashIndex === -1) {
      console.error('Could not extract bucket and path from URL');
      return { success: false, error: 'Could not extract bucket and path' };
    }
    
    const bucket = bucketAndPath.substring(0, slashIndex);
    const filePath = bucketAndPath.substring(slashIndex + 1);
    
    console.log(`Attempting to download file from bucket: ${bucket}, path: ${filePath}`);
    
    // Try to download the file directly from Supabase Storage
    const { data, error } = await supabase.storage
      .from(bucket)
      .download(filePath);
      
    if (error) {
      console.error('Error downloading file from storage:', error);
      
      // If storage download fails, try to get a signed URL and download that instead
      try {
        console.log('Attempting to create signed URL and download that');
        
        const { data: signedData, error: signedError } = await supabase.storage
          .from(bucket)
          .createSignedUrl(filePath, 3600); // 1 hour expiration (increased from 5 minutes)
          
        if (signedError || !signedData?.signedUrl) {
          console.error('Error creating signed URL:', signedError);
          
          // If signed URL fails, try with a different bucket
          if (bucket !== 'messages') {
            console.log('Trying to access file from messages bucket instead');
            
            // Extract just the filename
            const fileName = filePath.split('/').pop();
            if (fileName) {
              // Try both message_images and message_documents folders
              const folders = ['message_images', 'message_documents'];
              
              for (const folder of folders) {
                try {
                  const { data: altData, error: altError } = await supabase.storage
                    .from('messages')
                    .download(`${folder}/${fileName}`);
                    
                  if (!altError && altData) {
                    const blob = new Blob([altData], { type: altData.type });
                    const objectUrl = URL.createObjectURL(blob);
                    
                    console.log(`Successfully found file in messages/${folder}`);
                    
                    // Cache the object URL in sessionStorage
                    sessionStorage.setItem(cacheKey, objectUrl);
                    
                    return { 
                      success: true, 
                      objectUrl,
                      revoke: () => {
                        URL.revokeObjectURL(objectUrl);
                        sessionStorage.removeItem(cacheKey);
                      }
                    };
                  }
                } catch (folderError) {
                  console.error(`Error checking ${folder}:`, folderError);
                }
              }
            }
          }
          
          return { success: false, error: signedError || 'Failed to create signed URL' };
        }
        
        console.log('Created signed URL:', signedData.signedUrl);
        
        // Try to fetch with the signed URL
        const response = await fetch(signedData.signedUrl);
        
        if (!response.ok) {
          throw new Error(`HTTP error: ${response.status}`);
        }
        
        const blob = await response.blob();
        const objectUrl = URL.createObjectURL(blob);
        
        console.log('Created object URL from signed URL:', objectUrl);
        
        // Cache the object URL in sessionStorage
        sessionStorage.setItem(cacheKey, objectUrl);
        
        return { 
          success: true, 
          objectUrl,
          revoke: () => {
            URL.revokeObjectURL(objectUrl);
            sessionStorage.removeItem(cacheKey);
          }
        };
      } catch (signedError) {
        console.error('Error downloading with signed URL:', signedError);
        return { success: false, error: 'Failed to download with signed URL' };
      }
    }
    
    if (!data) {
      console.error('No data returned from storage download');
      return { success: false, error: 'No data returned from download' };
    }
    
    console.log('Successfully downloaded file from storage');
    
    // Create a blob URL from the downloaded data
    const blob = new Blob([data], { type: data.type });
    const objectUrl = URL.createObjectURL(blob);
    
    console.log('Created object URL for file:', objectUrl);
    
    // Cache the object URL in sessionStorage
    sessionStorage.setItem(cacheKey, objectUrl);
    
    return { 
      success: true, 
      objectUrl,
      // Include a cleanup function to revoke the object URL when done
      revoke: () => {
        URL.revokeObjectURL(objectUrl);
        sessionStorage.removeItem(cacheKey);
      }
    };
  } catch (error) {
    console.error('Error in getFileFromStorage:', error);
    return { success: false, error };
  }
}; 