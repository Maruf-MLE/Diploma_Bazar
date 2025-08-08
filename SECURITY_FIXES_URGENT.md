# 🚨 জরুরি নিরাপত্তা সমাধান

## ১. Environment Variables সুরক্ষিত করুন

### .env.production থেকে sensitive data সরান:
```bash
# এই ফাইলটি GitHub থেকে মুছুন
git rm --cached .env.production
```

### .gitignore এ যোগ করুন:
```gitignore
.env*
!.env.example
*.key
secrets.json
```

### Vercel/Netlify তে environment variables set করুন:
- VAPID_PRIVATE_KEY
- VAPID_PUBLIC_KEY
- Database credentials (if any)

## ২. Password Policy শক্তিশালী করুন

```sql
-- Supabase Dashboard > Authentication > Settings এ যান
-- অথবা config.toml আপডেট করুন:
minimum_password_length = 8
password_requirements = "lower_upper_letters_digits"
```

## ৩. File Upload Security

```typescript
// File validation function
export const validateFile = (file: File) => {
  const allowedTypes = ['image/jpeg', 'image/png', 'image/gif', 'application/pdf'];
  const maxSize = 10 * 1024 * 1024; // 10MB
  
  if (!allowedTypes.includes(file.type)) {
    throw new Error('Invalid file type');
  }
  
  if (file.size > maxSize) {
    throw new Error('File too large');
  }
  
  return true;
};
```

## ৪. XSS Protection

```typescript
import DOMPurify from 'dompurify';

// User content sanitize করুন
export const sanitizeHTML = (dirty: string) => {
  return DOMPurify.sanitize(dirty);
};
```

## ৫. Rate Limiting বাড়ান

```toml
# supabase/config.toml
[auth.rate_limit]
sign_in_sign_ups = 5  # কমান
token_refresh = 50    # কমান
```
