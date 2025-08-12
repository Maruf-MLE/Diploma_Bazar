# বই এডিট ডায়ালগ ফিল্ড পরিবর্তন (Book Edit Dialog Field Changes)

## সমস্যা (Problem)
আগে প্রোফাইল পেইজের "আমার বই" ট্যাবে বই এডিট করার সময় **প্রতিষ্ঠান (institute_name)** এবং **বিভাগ (department)** ফিল্ড দুটি পরিবর্তন করা যেত না। এগুলো `disabled={true}` এবং `readonly` অবস্থায় ছিল।

## সমাধান (Solution)
নিচের পরিবর্তনগুলো করা হয়েছে **BookEditDialog.tsx** ফাইলে:

### ১. প্রতিষ্ঠান ফিল্ড (Institute Name Field)
**আগে:**
```tsx
<Input
  id="institute_name"
  name="institute_name"
  value={formData.institute_name}
  placeholder="ঐচ্ছিক"
  disabled={true}  // সবসময় disabled
  className="bg-muted/50"
/>
{canEdit && (
  <p className="text-xs text-muted-foreground">প্রতিষ্ঠান পরিবর্তন করা যাবে না</p>
)}
```

**এখন:**
```tsx
<Input
  id="institute_name"
  name="institute_name"
  value={formData.institute_name}
  onChange={handleInputChange}  // onChange handler যোগ করা হয়েছে
  placeholder="ঐচ্ছিক"
  disabled={!canEdit}  // শুধুমাত্র user edit করতে না পারলে disabled
/>
```

### ২. বিভাগ ফিল্ড (Department Field)
**আগে:**
```tsx
<Input
  id="department"
  name="department"
  value={formData.department}
  placeholder="ঐচ্ছিক"
  disabled={true}  // সবসময় disabled
  className="bg-muted/50"
/>
{canEdit && (
  <p className="text-xs text-muted-foreground">বিভাগ পরিবর্তন করা যাবে না</p>
)}
```

**এখন:**
```tsx
<Input
  id="department"
  name="department"
  value={formData.department}
  onChange={handleInputChange}  // onChange handler যোগ করা হয়েছে
  placeholder="ঐচ্ছিক"
  disabled={!canEdit}  // শুধুমাত্র user edit করতে না পারলে disabled
/>
```

### ৩. ফর্ম সাবমিশন (Form Submission)
**আগে:**
```tsx
const updatesData: Partial<BookEntity> = {
  title: formData.title,
  author: formData.author,
  description: formData.description,
  price: formData.price,
  condition: formData.condition,
  condition_description: formData.condition_description,
  semester: formData.semester,
  location: formData.location,
  is_negotiable: formData.is_negotiable,
  cover_image_url: formData.cover_image_url,
  // department এবং institute_name পাঠানো হতো না
};
```

**এখন:**
```tsx
const updatesData: Partial<BookEntity> = {
  title: formData.title,
  author: formData.author,
  description: formData.description,
  price: formData.price,
  condition: formData.condition,
  condition_description: formData.condition_description,
  semester: formData.semester,
  department: formData.department,        // যোগ করা হয়েছে
  institute_name: formData.institute_name, // যোগ করা হয়েছে
  location: formData.location,
  is_negotiable: formData.is_negotiable,
  cover_image_url: formData.cover_image_url,
};
```

## ফলাফল (Result)
এখন ব্যবহারকারীরা:
- ✅ প্রতিষ্ঠানের নাম পরিবর্তন করতে পারবেন
- ✅ বিভাগের নাম পরিবর্তন করতে পারবেন
- ✅ অন্যান্য সকল ফিল্ড আগের মতোই এডিট করতে পারবেন
- ✅ RLS (Row Level Security) policy এখন আর সমস্যা করবে না

## নোট (Notes)
- এই পরিবর্তনগুলো শুধুমাত্র ফ্রন্টএন্ড কোডে করা হয়েছে
- ব্যাকএন্ডে RLS policy আপডেট করা হয়েছে যাতে এই ফিল্ডগুলো আপডেট করা যায়
- ব্যবহারকারী শুধুমাত্র নিজের বই এডিট করতে পারবেন (security বজায় থাকবে)

## টেস্ট করুন (Testing)
1. প্রোফাইল পেইজে যান
2. "আমার বই" ট্যাবে ক্লিক করুন
3. কোনো একটি বইয়ের Edit বাটনে ক্লিক করুন
4. প্রতিষ্ঠান এবং বিভাগের ফিল্ড এখন পরিবর্তন করা যাবে
5. সেভ করে দেখুন পরিবর্তন সংরক্ষিত হচ্ছে কিনা
