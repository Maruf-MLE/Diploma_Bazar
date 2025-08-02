# Supabase প্রজেক্ট ব্যাকআপ

## প্রজেক্ট ইনফরমেশন
- প্রজেক্ট URL: https://yryerjgidsyfiohmpeoc.supabase.co
- anon key: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InlyeWVyamdpZHN5ZmlvaG1wZW9jIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTA5NjA1NTIsImV4cCI6MjA2NjUzNjU1Mn0.S2ki-0QyFabstnVnTh9qFiHoz7sqBZgkfPThn77wTno

## ডাটাবেস স্কিমা

### টেবিল স্ট্রাকচার

```sql
-- Profiles টেবিল
create table public.profiles (
  id uuid references auth.users on delete cascade not null primary key,
  name text,
  institute_name text,
  department text,
  semester text,
  shift text,
  roll_number text,
  avatar_url text,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Books টেবিল
create table public.books (
  id uuid default gen_random_uuid() primary key,
  title text not null,
  author text not null,
  description text,
  condition text not null,
  price decimal(10,2) not null,
  image_url text,
  seller_id uuid references public.profiles(id) not null,
  status text default 'available' not null,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Messages টেবিল
create table public.messages (
  id uuid default gen_random_uuid() primary key,
  sender_id uuid references public.profiles(id) not null,
  receiver_id uuid references public.profiles(id) not null,
  book_id uuid references public.books(id),
  content text not null,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);
```

### RLS পলিসি

```sql
-- Profiles পলিসি
alter table public.profiles enable row level security;

create policy "Public profiles are viewable by everyone."
  on public.profiles for select
  using (true);

create policy "Users can insert their own profile."
  on public.profiles for insert
  with check (auth.uid() = id);

create policy "Users can update their own profile."
  on public.profiles for update
  using (auth.uid() = id);

-- Books পলিসি
alter table public.books enable row level security;

create policy "Books are viewable by everyone."
  on public.books for select
  using (true);

create policy "Users can insert their own books."
  on public.books for insert
  with check (auth.uid() = seller_id);

create policy "Users can update their own books."
  on public.books for update
  using (auth.uid() = seller_id);

create policy "Users can delete their own books."
  on public.books for delete
  using (auth.uid() = seller_id);

-- Messages পলিসি
alter table public.messages enable row level security;

create policy "Users can view their own messages."
  on public.messages for select
  using (auth.uid() = sender_id or auth.uid() = receiver_id);

create policy "Users can insert messages."
  on public.messages for insert
  with check (auth.uid() = sender_id);

create policy "Users can update their own messages."
  on public.messages for update
  using (auth.uid() = sender_id);

create policy "Users can delete their own messages."
  on public.messages for delete
  using (auth.uid() = sender_id);
```

### Storage বাকেট পলিসি

```sql
-- Avatars বাকেট পলিসি
create policy "Avatar images are publicly accessible"
  on storage.objects for select
  using (bucket_id = 'avatars');

create policy "Users can upload their own avatar"
  on storage.objects for insert
  with check (bucket_id = 'avatars' and auth.uid() = owner);

create policy "Users can update their own avatar"
  on storage.objects for update
  using (bucket_id = 'avatars' and auth.uid() = owner);

create policy "Users can delete their own avatar"
  on storage.objects for delete
  using (bucket_id = 'avatars' and auth.uid() = owner);
```

## Authentication সেটিংস

### ইমেইল সেটিংস
- ইমেইল ভেরিফিকেশন বাধ্যতামূলক: হ্যাঁ
- ভেরিফিকেশন মেসেজ: "আপনার অ্যাকাউন্ট নিশ্চিত করতে নিচের লিংকে ক্লিক করুন"
- ভেরিফিকেশন রিডাইরেক্ট: http://localhost:5173/auth/callback

### SMTP কনফিগারেশন
- Host: smtp.gmail.com
- Port: 587
- Username: [আপনার Gmail]
- Password: [App Password]

### Email টেমপ্লেট

#### Reset Password টেমপ্লেট
```html
<h2>পাসওয়ার্ড রিসেট</h2>
<p>প্রিয় ব্যবহারকারী,</p>
<p>আপনার পাসওয়ার্ড রিসেট করার জন্য নিচের লিংকে ক্লিক করুন:</p>
<a href="{{.ConfirmationURL}}" style="background-color: #4F46E5; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px; display: inline-block; margin: 20px 0;">পাসওয়ার্ড রিসেট করুন</a>
<p>যদি আপনি এই অনুরোধ না করে থাকেন, তাহলে এই ইমেইল উপেক্ষা করুন।</p>
<p>ধন্যবাদান্তে,<br>বই চাপা বাজার টিম</p>
```

#### Magic Link টেমপ্লেট
```html
<h2>লগইন লিংক</h2>
<p>প্রিয় ব্যবহারকারী,</p>
<p>আপনার অ্যাকাউন্টে লগইন করার জন্য নিচের লিংকে ক্লিক করুন:</p>
<a href="{{.ConfirmationURL}}" style="background-color: #4F46E5; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px; display: inline-block; margin: 20px 0;">লগইন করুন</a>
<p>যদি আপনি এই অনুরোধ না করে থাকেন, তাহলে এই ইমেইল উপেক্ষা করুন।</p>
<p>ধন্যবাদান্তে,<br>বই চাপা বাজার টিম</p>
```

### Site URL সেটিংস
- Site URL: http://localhost:5173 (ডেভেলপমেন্ট)
- Redirect URLs:
  - http://localhost:5173/**
  - [প্রোডাকশন URL]/**

## Storage সেটিংস

### Buckets
1. avatars
   - Public: Yes
   - File size limit: 5MB
   - Allowed mime types: image/*

## ট্রিগার ফাংশন

```sql
-- Updated At ট্রিগার
create function public.handle_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

-- Profiles টেবিলের জন্য ট্রিগার
create trigger handle_profiles_updated_at
  before update on public.profiles
  for each row
  execute procedure public.handle_updated_at();

-- Books টেবিলের জন্য ট্রিগার
create trigger handle_books_updated_at
  before update on public.books
  for each row
  execute procedure public.handle_updated_at();

-- Messages টেবিলের জন্য ট্রিগার
create trigger handle_messages_updated_at
  before update on public.messages
  for each row
  execute procedure public.handle_updated_at();
``` 

<h2>পাসওয়ার্ড রিসেট</h2>
<p>প্রিয় ব্যবহারকারী,</p>
<p>আপনার পাসওয়ার্ড রিসেট করার জন্য নিচের লিংকে ক্লিক করুন:</p>
<a href="{{.ConfirmationURL}}" style="background-color: #4F46E5; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px; display: inline-block; margin: 20px 0;">পাসওয়ার্ড রিসেট করুন</a>
<p>যদি আপনি এই অনুরোধ না করে থাকেন, তাহলে এই ইমেইল উপেক্ষা করুন।</p>
<p>ধন্যবাদান্তে,<br>বই চাপা বাজার টিম</p> 

<h2>লগইন লিংক</h2>
<p>প্রিয় ব্যবহারকারী,</p>
<p>আপনার অ্যাকাউন্টে লগইন করার জন্য নিচের লিংকে ক্লিক করুন:</p>
<a href="{{.ConfirmationURL}}" style="background-color: #4F46E5; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px; display: inline-block; margin: 20px 0;">লগইন করুন</a>
<p>যদি আপনি এই অনুরোধ না করে থাকেন, তাহলে এই ইমেইল উপেক্ষা করুন।</p>
<p>ধন্যবাদান্তে,<br>বই চাপা বাজার টিম</p> 

## Authentication Settings

### Email Verification Settings
1. Supabase Dashboard -> Authentication -> Email Templates -> Confirm Signup
2. Enable "Confirm email on signup"
3. Configure email template:
   ```
   Subject: বই চাপা বাজার - আপনার ইমেইল যাচাই করুন
   
   Content:
   প্রিয় ব্যবহারকারী,
   
   আপনার ইমেইল যাচাই করার জন্য নিচের লিংকে ক্লিক করুন:
   
   {.confirm_signup_url}
   
   যদি আপনি এই অ্যাকাউন্টের জন্য সাইন আপ না করে থাকেন, তাহলে এই ইমেইল উপেক্ষা করুন।
   
   ধন্যবাদ,
   বই চাপা বাজার টিম
   ```

### Logout Functionality
- Added to Navigation component
- Features:
  * Calls `supabase.auth.signOut()`
  * Shows success/error toast messages
  * Redirects to login page on successful logout
  * Bengali language interface 

## মেসেজ সিস্টেম

### মেসেজ পাঠানোর ফাংশন
```
export async function sendMessage(
  senderId: string,
  receiverId: string,
  content: string,
  bookId?: string
) {
  try {
    const messageData = {
      sender_id: senderId,
      receiver_id: receiverId,
      content,
      book_id: bookId || null,
    };
    
    const { data, error } = await supabase
      .from('messages')
      .insert(messageData)
      .select('*, sender:sender_id(name, avatar_url)')
      .single();
      
    if (error) throw error;
    
    // Format response data for UI
    const formattedMessage: Message = {
      ...data,
      isOwn: true,
      sender_name: data.sender?.name,
      sender_avatar_url: data.sender?.avatar_url,
    };
    
    // Create a notification for the receiver
    await createMessageNotification(senderId, receiverId, content, bookId);
    
    return { data: formattedMessage, error: null };
  } catch (error) {
    console.error('Error sending message:', error);
    return { data: null, error };
  }
}

/**
 * মেসেজের সাথে নোটিফিকেশন তৈরি করা
 */
export async function createMessageNotification(
  senderId: string, 
  receiverId: string, 
  content: string,
  bookId?: string
) {
  try {
    // Get sender name
    const { data: senderData } = await supabase
      .from('profiles')
      .select('name')
      .eq('id', senderId)
      .single();
    
    const senderName = senderData?.name || 'একজন ব্যবহারকারী';
    
    // Create notification
    const { error } = await supabase
      .from('notifications')
      .insert({
        user_id: receiverId,
        title: `${senderName} আপনাকে একটি মেসেজ পাঠিয়েছেন`,
        message: content.length > 50 ? `${content.substring(0, 50)}...` : content,
        type: 'message',
        related_id: bookId || null,
        is_read: false
      });
    
    if (error) throw error;
    
    return { success: true, error: null };
  } catch (error) {
    console.error('Error creating notification:', error);
    return { success: false, error };
  }
}

/**
 * কনভারসেশন সার্চ করার ফাংশন
 */
export async function searchConversations(userId: string, searchTerm: string) {
  try {
    // Search for conversations based on profile name or message content
    const { data, error } = await supabase
      .rpc('search_conversations', {
        p_user_id: userId,
        p_search_term: searchTerm
      });
    
    if (error) throw error;
    
    return { data, error: null };
  } catch (error) {
    console.error('Error searching conversations:', error);
    return { data: null, error };
  }
}

/**
 * পঠিত/অপঠিত মেসেজের হিসাব আপডেট করা
 */
export async function getUnreadMessageCounts(userId: string) {
  try {
    const { data, error } = await supabase
      .from('messages')
      .select('receiver_id, sender_id, count')
      .eq('receiver_id', userId)
      .eq('is_read', false)
      .group('sender_id');
      
    if (error) throw error;
    
    // Format as a map of sender_id -> count
    const unreadCounts: Record<string, number> = {};
    data?.forEach(item => {
      unreadCounts[item.sender_id] = parseInt(item.count);
    });
    
    return { data: unreadCounts, error: null };
  } catch (error) {
    console.error('Error getting unread counts:', error);
    return { data: {}, error };
  }
} 