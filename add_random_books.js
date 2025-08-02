// Script to add random computer department books to the database
const { createClient } = require('@supabase/supabase-js');
const { v4: uuidv4 } = require('uuid');

// Supabase credentials
const supabaseUrl = 'https://yryerjgidsyfiohmpeoc.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InlyeWVyamdpZHN5ZmlvaG1wZW9jIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTA5NjA1NTIsImV4cCI6MjA2NjUzNjU1Mn0.S2ki-0QyFabstnVnTh9qFiHoz7sqBZgkfPThn77wTno';

// Create Supabase client
const supabase = createClient(supabaseUrl, supabaseAnonKey);

// Random book cover images (publicly available placeholders)
const bookCovers = [
  'https://m.media-amazon.com/images/I/51IA4hT6jrL._SY342_.jpg', // Head First Java
  'https://m.media-amazon.com/images/I/51wH-IA6MIL._SY522_.jpg', // Clean Code
  'https://m.media-amazon.com/images/I/51A8l+FxFNL._SY344_BO1,204,203,200_.jpg', // Design Patterns
  'https://m.media-amazon.com/images/I/51HbNW6RzhL._SY522_.jpg', // Introduction to Algorithms
  'https://m.media-amazon.com/images/I/51YSxRbreVL._SY522_.jpg', // Computer Networks
  'https://m.media-amazon.com/images/I/41SMlI+6PrL._SY344_BO1,204,203,200_.jpg', // Database Systems
  'https://m.media-amazon.com/images/I/51JA5OgpYPL._SY344_BO1,204,203,200_.jpg', // Operating System
  'https://m.media-amazon.com/images/I/51Se4IrKvjL._SY344_BO1,204,203,200_.jpg', // Software Engineering
  'https://m.media-amazon.com/images/I/41qQN5TE3eL._SY344_BO1,204,203,200_.jpg', // Python Cookbook
  'https://m.media-amazon.com/images/I/515E2fvTLSL._SY344_BO1,204,203,200_.jpg', // Data Science Handbook
];

// Book data for computer department
const computerBooks = [
  {
    title: "জাভা প্রোগ্রামিং",
    author: "জন স্মিথ",
    description: "জাভা প্রোগ্রামিং শুরু থেকে এডভান্সড পর্যায় পর্যন্ত শেখার সম্পূর্ণ গাইড। এই বইয়ে অবজেক্ট ওরিয়েন্টেড প্রোগ্রামিং এবং ডাটা স্ট্রাকচার সহ সমস্ত মৌলিক বিষয় অন্তর্ভুক্ত আছে।",
    price: 450,
    condition: "good",
    category: "academic",
    department: "cse",
    semester: "3rd",
    is_negotiable: true
  },
  {
    title: "ডাটা স্ট্রাকচার এবং অ্যালগরিদম",
    author: "রহিম খান",
    description: "বিভিন্ন ডাটা স্ট্রাকচার এবং অ্যালগরিদম নিয়ে বিস্তারিত আলোচনা। অ্যারে, লিঙ্কড লিস্ট, স্ট্যাক, কিউ, ট্রি, গ্রাফ এবং সার্চিং-সর্টিং অ্যালগরিদম সম্পর্কে বিস্তারিত ব্যাখ্যা করা হয়েছে।",
    price: 550,
    condition: "like_new",
    category: "academic",
    department: "cse",
    semester: "4th",
    is_negotiable: true
  },
  {
    title: "অপারেটিং সিস্টেম",
    author: "সাদমান সাকিব",
    description: "অপারেটিং সিস্টেমের মৌলিক ধারণা থেকে শুরু করে আধুনিক অপারেটিং সিস্টেমের বিভিন্ন দিক নিয়ে আলোচনা। প্রসেস ম্যানেজমেন্ট, মেমরি ম্যানেজমেন্ট এবং ফাইল সিস্টেম বিস্তারিত ভাবে বর্ণনা করা হয়েছে।",
    price: 380,
    condition: "good",
    category: "academic",
    department: "cse",
    semester: "5th",
    is_negotiable: false
  },
  {
    title: "কম্পিউটার নেটওয়ার্কিং",
    author: "ফারিয়া আহমেদ",
    description: "কম্পিউটার নেটওয়ার্কের মৌলিক ধারণা থেকে শুরু করে OSI মডেল, TCP/IP প্রটোকল, রাউটিং, সুইচিং এবং নেটওয়ার্ক সিকিউরিটি সম্পর্কে বিস্তারিত আলোচনা করা হয়েছে।",
    price: 490,
    condition: "acceptable",
    category: "academic",
    department: "cse",
    semester: "6th",
    is_negotiable: true
  },
  {
    title: "ডাটাবেস ম্যানেজমেন্ট সিস্টেম",
    author: "তানিম হাসান",
    description: "রিলেশনাল ডাটাবেস ডিজাইন, SQL, নরমালাইজেশন, ট্রানজেকশন প্রসেসিং এবং কনকারেন্সি কন্ট্রোল নিয়ে বিস্তারিত আলোচনা করা হয়েছে। সাথে MySQL এর প্র্যাকটিক্যাল উদাহরণ দেওয়া আছে।",
    price: 420,
    condition: "good",
    category: "academic",
    department: "cse",
    semester: "4th",
    is_negotiable: true
  },
  {
    title: "আর্টিফিশিয়াল ইন্টেলিজেন্স",
    author: "নাফিসা নওরিন",
    description: "আর্টিফিশিয়াল ইন্টেলিজেন্সের বিভিন্ন কৌশল যেমন সার্চ অ্যালগরিদম, মেশিন লার্নিং, ডিপ লার্নিং, ন্যাচারাল ল্যাঙ্গুয়েজ প্রসেসিং এবং কম্পিউটার ভিশন সম্পর্কে বিস্তারিত আলোচনা।",
    price: 650,
    condition: "new",
    category: "academic",
    department: "cse",
    semester: "7th",
    is_negotiable: false
  },
  {
    title: "ওয়েব ডেভেলপমেন্ট",
    author: "জাহিদ হাসান",
    description: "মডার্ন ওয়েব ডেভেলপমেন্টের সম্পূর্ণ গাইড। HTML, CSS, JavaScript, React, Node.js এবং MongoDB সহ ফুল স্ট্যাক ডেভেলপমেন্টের বিভিন্ন দিক নিয়ে আলোচনা করা হয়েছে।",
    price: 520,
    condition: "good",
    category: "academic",
    department: "cse",
    semester: "6th",
    is_negotiable: true
  },
  {
    title: "সফটওয়্যার ইঞ্জিনিয়ারিং",
    author: "সাদিয়া আক্তার",
    description: "সফটওয়্যার ডেভেলপমেন্ট লাইফ সাইকেল, রিকোয়ারমেন্ট ইঞ্জিনিয়ারিং, ডিজাইন প্যাটার্ন, টেস্টিং এবং সফটওয়্যার প্রজেক্ট ম্যানেজমেন্ট নিয়ে বিস্তারিত আলোচনা করা হয়েছে।",
    price: 480,
    condition: "like_new",
    category: "academic",
    department: "cse",
    semester: "5th",
    is_negotiable: false
  },
  {
    title: "কম্পিউটার আর্কিটেকচার",
    author: "মাহফুজুর রহমান",
    description: "কম্পিউটার আর্কিটেকচার সম্পর্কে বিস্তারিত আলোচনা, যার মধ্যে প্রসেসর ডিজাইন, মেমরি হায়ারার্কি, ইন্সট্রাকশন সেট আর্কিটেকচার, পাইপলাইনিং এবং পারফরম্যান্স অপ্টিমাইজেশন অন্তর্ভুক্ত।",
    price: 530,
    condition: "good",
    category: "academic",
    department: "cse",
    semester: "3rd",
    is_negotiable: true
  },
  {
    title: "মাইক্রোপ্রসেসর এবং মাইক্রোকন্ট্রোলার",
    author: "আরিফ হোসেন",
    description: "মাইক্রোপ্রসেসর এবং মাইক্রোকন্ট্রোলারের আর্কিটেকচার, প্রোগ্রামিং এবং ইন্টারফেসিং সম্পর্কে বিস্তারিত আলোচনা। আর্দুইনো এবং রাস্পবেরি পাই দিয়ে প্র্যাকটিক্যাল প্রজেক্টের উদাহরণ দেওয়া আছে।",
    price: 410,
    condition: "acceptable",
    category: "academic",
    department: "cse",
    semester: "5th",
    is_negotiable: true
  }
];

// Function to sign in
async function signIn() {
  console.log('Signing in...');
  
  const { data, error } = await supabase.auth.signInWithPassword({
    email: 'hmaruf291@gmail.com',
    password: '889909'
  });
  
  if (error) {
    console.error('Error signing in:', error);
    return false;
  }
  
  console.log('Successfully signed in as:', data.user.email);
  return true;
}

// Function to create a book
async function createBook(bookData) {
  try {
    // Generate UUID for the book
    const bookId = uuidv4();
    
    // Prepare data
    const insertData = {
      id: bookId,
      ...bookData,
      created_at: new Date().toISOString(),
      status: 'available'
    };
    
    // Insert book into database
    const { data, error } = await supabase
      .from('books')
      .insert(insertData)
      .select()
      .single();
    
    if (error) {
      console.error('Error creating book:', error);
      return null;
    }
    
    console.log('Successfully added book:', data.title);
    return data;
  } catch (error) {
    console.error('Error in createBook function:', error);
    return null;
  }
}

// Function to update book with cover image
async function updateBookCover(bookId, coverImageUrl) {
  try {
    const { data, error } = await supabase
      .from('books')
      .update({ cover_image_url: coverImageUrl })
      .eq('id', bookId)
      .select()
      .single();
    
    if (error) {
      console.error('Error updating book cover:', error);
      return null;
    }
    
    console.log('Updated cover for book:', data.title);
    return data;
  } catch (error) {
    console.error('Error in updateBookCover function:', error);
    return null;
  }
}

// Main function to add all books
async function addRandomBooks() {
  try {
    // Sign in first
    const isSignedIn = await signIn();
    if (!isSignedIn) {
      console.error('Failed to sign in. Cannot add books.');
      return;
    }
    
    // Add a delay to ensure we're authenticated
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    // Get the current user
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      console.error('No user found after sign in');
      return;
    }
    
    console.log('Adding books for user ID:', user.id);
    
    // Add each book
    for (let i = 0; i < computerBooks.length; i++) {
      const book = computerBooks[i];
      
      // Add seller_id to the book data
      const bookWithSellerId = {
        ...book,
        seller_id: user.id
      };
      
      // Create book
      const createdBook = await createBook(bookWithSellerId);
      if (!createdBook) {
        console.error('Failed to create book:', book.title);
        continue;
      }
      
      // Add cover image (use a random cover from our array)
      const randomCoverIndex = Math.floor(Math.random() * bookCovers.length);
      const coverUrl = bookCovers[randomCoverIndex];
      
      await updateBookCover(createdBook.id, coverUrl);
    }
    
    console.log('Successfully added all books!');
    
  } catch (error) {
    console.error('Error in addRandomBooks:', error);
  }
}

// Run the main function
addRandomBooks().then(() => {
  console.log('Script completed');
}).catch(error => {
  console.error('Script failed:', error);
}); 