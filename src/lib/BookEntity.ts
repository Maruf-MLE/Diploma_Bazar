import { supabase } from './supabase';
import { v4 as uuidv4 } from 'uuid';

export interface BookEntity {
  id: string;
  title: string;
  author: string;
  price: number;
  description?: string;
  condition: 'new' | 'like_new' | 'good' | 'acceptable' | 'poor';
  condition_description?: string;
  cover_image_url?: string;
  created_at?: string;
  updated_at?: string;
  seller_id: string;
  seller_name?: string;
  seller_avatar_url?: string;
  category?: string;
  department?: string;
  semester?: string;
  institute_name?: string;
  discount_rate?: number;
  isbn?: string;
  language?: string;
  pages?: number;
  publisher?: string;
  year_published?: number;
  is_sold?: boolean;
  is_negotiable?: boolean;
  status?: 'available' | 'pending' | 'sold';
  additional_images?: string[];
  location?: string;
}

export type BookFilter = {
  seller_id?: string;
  category?: string;
  condition?: string;
  department?: string;
  semester?: string;
  publisher?: string;
  institute_name?: string;
  is_sold?: boolean;
  min_price?: number;
  max_price?: number;
  search_term?: string;
};

/**
 * নতুন বই তৈরি করে
 * 
 * @param bookData বই সম্পর্কিত ডেটা
 * @returns বই এবং সাফল্য/ত্রুটি সম্পর্কিত তথ্য
 */
export async function createBook(bookData: Omit<BookEntity, 'id' | 'created_at' | 'updated_at'>) {
  try {
    console.log('🔧 createBook function called with data:', bookData);
    console.log('📊 Book data fields check:');
    console.log('  - title:', bookData.title);
    console.log('  - author:', bookData.author);
    console.log('  - seller_id:', bookData.seller_id);
    console.log('  - category:', bookData.category);
    console.log('  - department:', bookData.department);
    console.log('  - semester:', bookData.semester);
    console.log('  - institute_name:', bookData.institute_name);
    
    // Generate unique ID
    let bookId;
    try {
      console.log('Attempting to generate UUID...');
      bookId = uuidv4();
      console.log('UUID generated successfully:', bookId);
    } catch (uuidError) {
      console.error('Error generating UUID:', uuidError);
      throw new Error('Failed to generate UUID for book');
    }
    
    // Ensure price is a valid number
    let price = bookData.price;
    if (typeof price === 'string') {
      price = parseFloat(price);
      if (isNaN(price)) {
        throw new Error('Price must be a valid number');
      }
    }
    
    // Create a clean data object with proper types
    const cleanBookData = {
      ...bookData,
      price: price,
      is_negotiable: Boolean(bookData.is_negotiable)
    };
    
    console.log('Inserting book into database with ID:', bookId);
    console.log('Final data being sent to Supabase:', {
      id: bookId,
      ...cleanBookData,
      created_at: new Date().toISOString(),
      status: cleanBookData.status || 'available'
    });
    
    const { data, error } = await supabase
      .from('books')
      .insert({
        id: bookId,
        ...cleanBookData,
        created_at: new Date().toISOString(),
        status: cleanBookData.status || 'available'
      })
      .select()
      .single();
    
    console.log('Supabase insert response:', { data, error });
      
    if (error) {
      console.error('Supabase error details:', {
        message: error.message,
        details: error.details,
        hint: error.hint,
        code: error.code
      });
      throw error;
    }
    
    return { data, error: null };
  } catch (error) {
    console.error('Error creating book:', error);
    return { data: null, error };
  }
}

/**
 * বইয়ের তথ্য আপডেট করে
 * 
 * @param id বইয়ের আইডি
 * @param updates আপডেট করার তথ্য
 * @returns আপডেট সম্পর্কিত তথ্য
 */
export async function updateBook(id: string, updates: Partial<BookEntity>) {
  try {
    const { data, error } = await supabase
      .from('books')
      .update({
        ...updates,
        updated_at: new Date().toISOString()
      })
      .eq('id', id)
      .select()
      .single();
      
    if (error) throw error;
    
    return { data, error: null };
  } catch (error) {
    console.error('Error updating book:', error);
    return { data: null, error };
  }
}

/**
 * বই ডিলিট করে
 * 
 * @param id বইয়ের আইডি
 * @returns সফলতা/ত্রুটি সম্পর্কিত তথ্য
 */
export async function deleteBook(id: string) {
  try {
    const { error } = await supabase
      .from('books')
      .delete()
      .eq('id', id);
      
    if (error) throw error;
    
    return { success: true, error: null };
  } catch (error) {
    console.error('Error deleting book:', error);
    return { success: false, error };
  }
}

/**
 * একটি বইয়ের বিস্তারিত তথ্য নিয়ে আসে
 * 
 * @param id বইয়ের আইডি
 * @returns বই সম্পর্কিত বিস্তারিত তথ্য
 */
export async function getBookById(id: string) {
  try {
    // Get book data directly
    const { data, error } = await supabase
      .from('books')
      .select('*')
      .eq('id', id)
      .single();
      
    if (error) throw error;
    
    if (!data) {
      return { data: null, error: new Error('Book not found') };
    }
    
    // Get profile data separately
    const { data: profileData, error: profileError } = await supabase
      .from('profiles')
      .select('name, avatar_url, institute_name')
      .eq('id', data.seller_id)
      .single();
    
    if (profileError) {
      console.error('Error fetching profile:', profileError);
    }
    
    // Format the response to match BookEntity structure
    const book: BookEntity = {
      ...data,
      seller_name: profileData?.name || 'অজানা বিক্রেতা',
      seller_avatar_url: profileData?.avatar_url || undefined,
      location: data.institute_name || profileData?.institute_name
    };
    
    return { data: book, error: null };
  } catch (error) {
    console.error('Error fetching book:', error);
    return { data: null, error };
  }
}

/**
 * বইয়ের লিস্ট নিয়ে আসে ফিল্টার অনুযায়ী
 * 
 * @param filter ফিল্টার অপশন
 * @param limit কয়টি বই আনতে হবে
 * @param offset কত নম্বর থেকে শুরু করতে হবে
 * @param sortBy কোন ফিল্ড দিয়ে সর্ট করতে হবে
 * @param sortOrder সর্ট অর্ডার (asc/desc)
 * @returns বইয়ের তালিকা এবং সাফল্য/ত্রুটি সম্পর্কিত তথ্য
 */
export async function getBooks(
  filter?: BookFilter, 
  limit: number = 10, 
  offset: number = 0,
  sortBy: string = 'created_at',
  sortOrder: 'asc' | 'desc' = 'desc'
) {
  try {
    console.log(`[BookEntity] getBooks called with:`, { filter, limit, offset, sortBy, sortOrder });
    if (filter) console.log('Filters received:', JSON.stringify(filter, null, 2));
    
    // Validate parameters
    if (limit <= 0) limit = 10; // সর্বনিম্ন লিমিট ১০
    if (offset < 0) offset = 0; // অফসেট নেগেটিভ হতে পারে না
    
    // এই ফিল্ডগুলি বৈধ সর্টিং ফিল্ড
    const validSortFields = ['created_at', 'price', 'title', 'condition', 'updated_at'];
    if (!validSortFields.includes(sortBy)) sortBy = 'created_at';
    
    // পাবলিক টেবিল থেকে শুরু
    let query = supabase
      .from('books')
      .select('*')
      .eq('status', 'available'); // শুধুমাত্র যে বইগুলি বিক্রয়যোগ্য
    
    // ফিল্টারগুলি প্রয়োগ
    if (filter) {
      // শ্রেণী ফিল্টার
      if (filter.category) {
        console.log('Applying category filter:', filter.category);
        query = query.eq('category', filter.category);
      }
      
      // অবস্থা ফিল্টার
      if (filter.condition) {
        console.log('Applying condition filter:', filter.condition);
        query = query.eq('condition', filter.condition);
      }
      
      // বিভাগ ফিল্টার
      if (filter.department) {
        console.log('Applying department filter:', filter.department);
        query = query.eq('department', filter.department);
      }
      
      // সেমিস্টার ফিল্টার
      if (filter.semester) {
        console.log('Applying semester filter:', filter.semester);
        query = query.eq('semester', filter.semester);
      }
      
      // প্রকাশনী ফিল্টার
      if (filter.publisher) {
        console.log('Applying publisher filter:', filter.publisher);
        query = query.eq('publisher', filter.publisher);
      }
      // প্রতিষ্ঠান ফিল্টার
      if (filter.institute_name) {
        console.log('Applying institute_name filter:', filter.institute_name);
        query = query.eq('institute_name', filter.institute_name);
      }
      
      // মূল্য রেঞ্জ ফিল্টার
      if (filter.min_price !== undefined) {
        console.log('Applying min price filter:', filter.min_price);
        query = query.gte('price', filter.min_price);
      }
      
      if (filter.max_price !== undefined) {
        console.log('Applying max price filter:', filter.max_price);
        query = query.lte('price', filter.max_price);
      }
      
      // বিক্রেতা ফিল্টার
      if (filter.seller_id) {
        console.log('Applying seller filter:', filter.seller_id);
        query = query.eq('seller_id', filter.seller_id);
      }
      
      // সার্চ টার্ম ফিল্টার (টাইটেল বা লেখকের নাম)
      if (filter.search_term) {
        console.log('Applying search filter:', filter.search_term);
        
        // টাইটেল বা লেখক দুটোতেই সার্চ করি
        query = query.or(`title.ilike.%${filter.search_term}%,author.ilike.%${filter.search_term}%`);
      }
    }
    
    // সর্টিং অ্যাপ্লাই
    console.log(`Applying sorting: ${sortBy} ${sortOrder}`);
    query = query.order(sortBy, { ascending: sortOrder === 'asc' });
    
    // পেজিনেশন
    console.log(`Applying pagination: offset=${offset}, limit=${limit}`);
    query = query.range(offset, offset + limit - 1);
    
    // কোয়েরি রান করি
    console.log('Executing query...');
    const { data, error } = await query;
    
    // এরর হ্যান্ডলিং
    if (error) {
      console.error('[BookEntity] Error fetching books:', error);
      return { data: [], error };
    }
    
    // যদি কোন ডাটা না থাকে
    if (!data || data.length === 0) {
      console.log('[BookEntity] No books found with applied filters');
      return { data: [], error: null };
    }
    
    console.log(`[BookEntity] Found ${data.length} books`);
    
    try {
      // যদি কোন বই পাওয়া যায়, তাহলে বিক্রেতাদের তথ্য নিয়ে আসি
      // সব বিক্রেতার আইডি আলাদা করে নিই
      const sellerIds = [...new Set(data.map(book => book.seller_id))];
      
      // সব বিক্রেতার তথ্য একসাথে আনি
      const { data: profilesData, error: profilesError } = await supabase
        .from('profiles')
        .select('id, name, avatar_url, institute_name')
        .in('id', sellerIds);
        
      if (profilesError) {
        console.warn('[BookEntity] Error fetching profiles:', profilesError);
      }
      
      // বিক্রেতাদের তথ্য ম্যাপে রাখি দ্রুত অ্যাক্সেসের জন্য
      const profilesMap = (profilesData || []).reduce((acc, profile) => {
        acc[profile.id] = profile;
        return acc;
      }, {} as Record<string, any>);
      
      // বই এবং বিক্রেতার তথ্য একত্রিত করে ফরম্যাটেড রেসপন্স তৈরি করি
      const books: BookEntity[] = data.map(book => {
        const profile = profilesMap[book.seller_id];
        return {
          ...book,
          seller_name: profile?.name || 'অজানা বিক্রেতা',
          seller_avatar_url: profile?.avatar_url,
          location: book.institute_name || profile?.institute_name
        };
      });
      
      return { data: books, error: null };
    } catch (profileError) {
      console.error('[BookEntity] Error processing profiles:', profileError);
      
      // প্রোফাইল ডাটা না পেলেও বইয়ের তথ্য ফেরত দিবো
      const books: BookEntity[] = data.map(book => ({
        ...book,
        seller_name: 'অজানা বিক্রেতা',
      }));
      
      return { data: books, error: null };
    }
  } catch (error) {
    console.error('[BookEntity] Critical error in getBooks:', error);
    return { data: [], error };
  }
}

/**
 * বইয়ের ছবি আপলোড করে
 * 
 * @param bookId বইয়ের আইডি
 * @param file ছবির ফাইল
 * @param isCover মূল কভার ছবি কিনা
 * @returns আপলোড করা ছবির URL
 */
export async function uploadBookImage(bookId: string, file: File, isCover: boolean = false) {
  try {
    // Validate file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      throw new Error('File size cannot exceed 5MB');
    }
    
    // Validate file type
    if (!['image/jpeg', 'image/png', 'image/jpg', 'image/webp'].includes(file.type)) {
      throw new Error('Only JPEG, PNG and WebP files are allowed');
    }
    
    const fileExt = file.name.split('.').pop();
    const fileName = `${bookId}-${isCover ? 'cover' : Math.random().toString(36).substring(2)}.${fileExt}`;
    const filePath = `${fileName}`;
    
    const { error: uploadError } = await supabase.storage
      .from('books')
      .upload(filePath, file);
      
    if (uploadError) throw uploadError;
    
    const { data } = supabase.storage
      .from('books')
      .getPublicUrl(filePath);
      
    const publicUrl = data.publicUrl;
    
    // If this is a cover image, update the book record
    if (isCover) {
      await updateBook(bookId, { cover_image_url: publicUrl });
    } else {
      // For additional images, we need to fetch the current list first
      const { data: book } = await getBookById(bookId);
      if (book) {
        const additionalImages = book.additional_images || [];
        additionalImages.push(publicUrl);
        await updateBook(bookId, { additional_images: additionalImages });
      }
    }
    
    return { data: publicUrl, error: null };
  } catch (error) {
    console.error('Error uploading book image:', error);
    return { data: null, error };
  }
}

/**
 * বইকে বিক্রিত হিসেবে মার্ক করে
 * 
 * @param id বইয়ের আইডি
 * @returns সফলতা/ত্রুটি সম্পর্কিত তথ্য
 */
export async function markBookAsSold(id: string, seller_id: string, book: BookEntity) {
  try {
    // Update the book's status
    const { data, error } = await supabase
      .from('books')
      .update({
        status: 'sold',
        updated_at: new Date().toISOString()
      })
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;

    // Insert into purchase history with a placeholder buyer_id
    // Since we don't have actual buyer info when manually marking as sold,
    // we'll use a special UUID that indicates it was manually marked
    const { error: insertError } = await supabase
      .from('purchase_history')
      .insert({
        book_id: id,
        buyer_id: '00000000-0000-0000-0000-000000000000', // Special UUID for manually marked as sold
        seller_id: seller_id,
        price: book.price,
        purchase_date: new Date().toISOString(),
        book_title: book.title,
        book_author: book.author,
        book_cover_image_url: book.cover_image_url,
        meetup_location: book.location || 'অজানা',
        meetup_date: new Date().toISOString()
      });

    if (insertError) {
      console.error('Error inserting purchase history:', insertError);
      // Don't throw error here, book is already marked as sold
    }

    return { data, success: true, error: null };
  } catch (error) {
    console.error('Error marking book as sold:', error);
    return { data: null, success: false, error };
  }
}

/**
 * ইউজারের নিজের বইগুলি নিয়ে আসে
 * 
 * @param userId ইউজারের আইডি
 * @returns বইয়ের তালিকা এবং সাফল্য/ত্রুটি সম্পর্কিত তথ্য
 */
export async function getUserBooks(userId: string) {
  try {
    console.log(`[BookEntity] getUserBooks called for userId: ${userId}`);
    
    // Get books directly
    const { data, error } = await supabase
      .from('books')
      .select('*')
      .eq('seller_id', userId)
      .order('created_at', { ascending: false });
      
    if (error) {
      console.error('[BookEntity] Error fetching books:', error);
      throw error;
    }
    
    if (!data || data.length === 0) {
      console.log('[BookEntity] No books found for user:', userId);
      return { data: [], error: null };
    }
    
    console.log(`[BookEntity] Found ${data.length} books for user:`, userId);
    
    // Get profile data
    const { data: profileData, error: profileError } = await supabase
      .from('profiles')
      .select('name, avatar_url, institute_name')
      .eq('id', userId)
      .single();
    
    if (profileError) {
      console.error('[BookEntity] Error fetching profile:', profileError);
    }
    
    // Format books to match BookEntity structure
    const books: BookEntity[] = data.map(book => ({
      ...book,
      seller_name: profileData?.name || 'অজানা বিক্রেতা',
      seller_avatar_url: profileData?.avatar_url,
      location: book.institute_name || profileData?.institute_name
    }));
    
    return { data: books, error: null };
  } catch (error) {
    console.error('[BookEntity] Error in getUserBooks:', error);
    return { data: [], error };
  }
} 