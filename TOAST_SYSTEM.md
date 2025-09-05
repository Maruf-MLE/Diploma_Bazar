# 🔔 টোস্ট নোটিফিকেশন সিস্টেম

## সমস্যা এবং সমাধান

### আগের সমস্যা
- টোস্ট নোটিফিকেশন বার বার দেখানো হতো
- পেজ চেঞ্জ করলে পুরাতন মেসেজের টোস্ট আবার আসতো
- একই মেসেজের জন্য একাধিক টোস্ট দেখানো হতো
- সাইট রিফ্রেশ করলে পুরাতন নোটিফিকেশন আবার আসতো

### সমাধান
- **localStorage ভিত্তিক ট্র্যাকিং**: প্রতিটি দেখানো টোস্টের ID localStorage এ সেভ করা হয়
- **Expiry System**: পুরাতন টোস্ট ডাটা স্বয়ংক্রিয়ভাবে মুছে যায়
- **Concurrent Limit**: একসাথে সর্বোচ্চ নির্দিষ্ট সংখ্যক টোস্ট দেখানো হয়
- **Age Check**: খুব পুরাতন মেসেজের জন্য টোস্ট দেখানো হয় না

## কিভাবে কাজ করে

### MessageToaster
```typescript
// প্রতিটি মেসেজ ID localStorage এ সেভ করা হয়
markMessageAsShown(message.id);

// 5 মিনিট পর স্বয়ংক্রিয়ভাবে মুছে যায়
MESSAGE_EXPIRY_TIME = 5 * 60 * 1000; // 5 minutes

// সর্বোচ্চ 3টি টোস্ট একসাথে
MAX_CONCURRENT_TOASTS = 3;
```

### NotificationToaster
```typescript
// প্রতিটি নোটিফিকেশন ID localStorage এ সেভ করা হয়
markNotificationAsShown(notification.id);

// 10 মিনিট পর স্বয়ংক্রিয়ভাবে মুছে যায়
NOTIFICATION_EXPIRY_TIME = 10 * 60 * 1000; // 10 minutes

// সর্বোচ্চ 2টি টোস্ট একসাথে
MAX_CONCURRENT_NOTIFICATION_TOASTS = 2;
```

## স্বয়ংক্রিয় পরিষ্কারকরণ

### কখন ডাটা পরিষ্কার হয়
1. **অ্যাপ শুরু হওয়ার সময়**: Expired ডাটা মুছে ফেলা হয়
2. **লগআউটের সময়**: সব টোস্ট ডাটা মুছে ফেলা হয়
3. **পেজ বন্ধ/রিফ্রেশের সময়**: Expired ডাটা মুছে ফেলা হয়
4. **ট্যাব হাইড হওয়ার সময়**: Expired ডাটা মুছে ফেলা হয়

### localStorage Keys
```typescript
const TOAST_STORAGE_KEYS = {
  MESSAGES: 'messageToaster_shownIds',
  NOTIFICATIONS: 'notificationToaster_shownIds',
};
```

## ডিবাগিং

### ডেভেলপমেন্ট মোডে লগ
```javascript
// Console এ দেখা যাবে
MessageToaster initialized with stats: { shownMessages: 5, activeToasts: 0 }
NotificationToaster initialized with stats: { shownNotifications: 3, activeToasts: 0 }
```

### ম্যানুয়াল ক্লিয়ার করা
```bash
# CLI কমান্ড
npm run clear:toast-data

# অথবা ব্রাউজার কনসোলে
localStorage.removeItem('messageToaster_shownIds');
localStorage.removeItem('notificationToaster_shownIds');
```

### স্ট্যাটিস্টিক্স দেখা
```javascript
// ব্রাউজার কনসোলে রান করুন
const messageData = localStorage.getItem('messageToaster_shownIds');
const notificationData = localStorage.getItem('notificationToaster_shownIds');

const messageCount = messageData ? Object.keys(JSON.parse(messageData)).length : 0;
const notificationCount = notificationData ? Object.keys(JSON.parse(notificationData)).length : 0;

console.log('Message toasts stored:', messageCount);
console.log('Notification toasts stored:', notificationCount);
```

## সিকিউরিটি ফিচার

### Age Verification
```typescript
// 5 মিনিটের বেশি পুরাতন মেসেজের জন্য টোস্ট দেখানো হয় না
if (message.created_at) {
  const messageTime = new Date(message.created_at).getTime();
  const now = Date.now();
  const fiveMinutes = 5 * 60 * 1000;
  
  if (now - messageTime > fiveMinutes) {
    return; // Skip old message
  }
}
```

### Duplicate Prevention
```typescript
// একই ID এর জন্য একাধিক টোস্ট প্রতিরোধ
if (hasMessageBeenShown(message.id)) {
  console.log('Message toast already shown for ID:', message.id);
  return;
}
```

### Concurrent Limit
```typescript
// একসাথে অনেক টোস্ট প্রতিরোধ
if (activeToastCount >= MAX_CONCURRENT_TOASTS) {
  console.log('Maximum concurrent toasts reached, skipping new toast');
  return;
}
```

## কাস্টমাইজেশন

### Expiry Time পরিবর্তন
```typescript
// src/lib/toastManager.ts এ
export const TOAST_EXPIRY_TIMES = {
  MESSAGES: 5 * 60 * 1000, // 5 minutes - পরিবর্তন করুন
  NOTIFICATIONS: 10 * 60 * 1000, // 10 minutes - পরিবর্তন করুন
} as const;
```

### Concurrent Limit পরিবর্তন
```typescript
// MessageToaster.tsx এ
const MAX_CONCURRENT_TOASTS = 3; // পরিবর্তন করুন

// NotificationToaster.tsx এ
const MAX_CONCURRENT_NOTIFICATION_TOASTS = 2; // পরিবর্তন করুন
```

## ট্রাবলশুটিং

### সমস্যা: টোস্ট আসছে না
**সমাধান:**
1. localStorage ক্লিয়ার করুন
2. ব্রাউজার রিফ্রেশ করুন
3. Console এ error চেক করুন

### সমস্যা: অনেক টোস্ট একসাথে আসছে
**সমাধান:**
1. `MAX_CONCURRENT_TOASTS` কমান করুন
2. `EXPIRY_TIME` কমান করুন

### সমস্যা: পুরাতন টোস্ট আসছে
**সমাধান:**
1. `npm run clear:toast-data` রান করুন
2. Age verification চেক করুন

## পারফরম্যান্স

### localStorage Usage
- প্রতিটি টোস্ট ID: ~36 bytes (UUID)
- Timestamp: ~13 bytes
- 100টি টোস্ট: ~5KB storage
- স্বয়ংক্রিয় cleanup এর কারণে storage overflow হয় না

### Memory Usage
- Component re-render এ কোনো memory leak নেই
- Event listeners properly cleaned up
- Toast references automatically garbage collected

## ভবিষ্যত উন্নতি

1. **Server-side deduplication**: Server থেকেই duplicate prevention
2. **Push notification integration**: Web Push API এর সাথে sync
3. **User preferences**: ব্যবহারকারী টোস্ট preferences সেট করতে পারবে
4. **Analytics**: টোস্ট interaction tracking