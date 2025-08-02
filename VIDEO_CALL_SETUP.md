# বই চাপা বাজার অডিও/ভিডিও কল সিস্টেম

## সেটআপ গাইড

### 1. ডাটাবেস সেটআপ

প্রথমে Supabase ড্যাশবোর্ডে গিয়ে `calls` টেবিল তৈরি করুন:

1. [Supabase ড্যাশবোর্ড](https://app.supabase.com/) -এ যান
2. প্রজেক্ট সিলেক্ট করুন
3. SQL এডিটর এ যান
4. নতুন SQL কোয়েরী তৈরি করুন
5. নিচের SQL কোড রান করুন:

```sql
-- Create a calls table for video/audio calls
CREATE TABLE IF NOT EXISTS public.calls (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  caller_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  receiver_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  start_time TIMESTAMPTZ,
  end_time TIMESTAMPTZ,
  status TEXT NOT NULL CHECK (status IN ('initiated', 'ringing', 'connected', 'missed', 'rejected', 'ended', 'failed')),
  call_type TEXT NOT NULL CHECK (call_type IN ('audio', 'video')),
  signaling_data JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Add an index for faster queries
CREATE INDEX calls_participants_idx ON public.calls (caller_id, receiver_id);

-- Add RLS policies
ALTER TABLE public.calls ENABLE ROW LEVEL SECURITY;

-- Both caller and receiver can view their calls
CREATE POLICY "Users can view their own calls" 
  ON public.calls
  FOR SELECT 
  USING (auth.uid() = caller_id OR auth.uid() = receiver_id);

-- Only authenticated users can create calls they're initiating
CREATE POLICY "Users can create their own calls" 
  ON public.calls
  FOR INSERT
  WITH CHECK (auth.uid() = caller_id);

-- Both caller and receiver can update call status
CREATE POLICY "Users can update their own calls" 
  ON public.calls
  FOR UPDATE
  USING (auth.uid() = caller_id OR auth.uid() = receiver_id);

-- Create updated_at trigger for the calls table
CREATE TRIGGER calls_updated_at
  BEFORE UPDATE ON public.calls
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_updated_at();
```

### 2. সিগন্যালিং সার্ভার সেটআপ

#### নতুন ফাইলস যা তৈরি করা হয়েছে:

- `server.js` - সিগন্যালিং সার্ভার 
- `env.example` - এনভায়রনমেন্ট ভ্যারিয়েবলস
- `src/lib/CallService.ts` - ক্লায়েন্ট সাইড WebRTC সার্ভিস
- `src/components/VideoCallDialog.tsx` - ভিডিও কল ইউআই
- `src/components/CallButton.tsx` - কল বাটন কম্পোনেন্ট
- `src/components/CallHistoryDialog.tsx` - কল হিস্টোরি ইউআই
- `src/components/CallManager.tsx` - কল ম্যানেজার কম্পোনেন্ট
- `src/contexts/CallContext.tsx` - কল কনটেক্সট

#### সেটআপ স্টেপস:

1. প্রথমে `.env` ফাইল তৈরি করুন (`env.example` ফাইল থেকে কপি করে):

```bash
cp env.example .env
```

2. সিগন্যালিং সার্ভার চালাতে প্রয়োজনীয় প্যাকেজ ইন্সটল করুন:

```bash
npm install socket.io socket.io-client jsonwebtoken dotenv cors express @supabase/supabase-js
```

3. সিগন্যালিং সার্ভার চালু করুন:

```bash
node server.js
```

4. ওয়েব অ্যাপ্লিকেশন চালু করুন অন্য টার্মিনাল উইন্ডোতে:

```bash
npm run dev
```

### 3. STUN/TURN সার্ভার সেটআপ (প্রোডাকশন পরিবেশের জন্য)

প্রোডাকশন পরিবেশে সমস্ত নেটওয়ার্ক কনফিগারেশনে কল কাজ করার জন্য একটি TURN সার্ভার প্রয়োজন। 

#### coturn সেটআপ উদাহরণ:

1. সার্ভারে coturn ইন্সটল করুন:

```bash
sudo apt-get update
sudo apt-get install coturn
```

2. coturn কনফিগার করুন:

```bash
sudo nano /etc/turnserver.conf
```

3. কনফিগারেশন ফাইলে যোগ করুন:

```
listening-port=3478
fingerprint
lt-cred-mech
realm=your-domain.com
user=username:password
```

4. coturn চালু করুন:

```bash
sudo systemctl start coturn
```

5. এবার CallService.ts ফাইলে ICE_SERVERS অ্যারেতে আপনার TURN সার্ভারের তথ্য যোগ করুন:

```typescript
const ICE_SERVERS = [
  { urls: 'stun:stun.l.google.com:19302' },
  { urls: 'stun:stun1.l.google.com:19302' },
  {
    urls: 'turn:your-domain.com:3478',
    username: 'username',
    credential: 'password'
  }
];
```

### 4. ব্যবহার পদ্ধতি

1. মেসেজ পেজে অন্য ব্যবহারকারীর সাথে চ্যাট করতে থাকুন
2. চ্যাট হেডারে কল বাটনে ক্লিক করুন
3. অডিও বা ভিডিও কল বেছে নিন
4. কল কানেকশন স্থাপন হবে
5. কল শেষে "কল শেষ করুন" বাটনে ক্লিক করুন

### 5. কল সিস্টেম কাস্টমাইজ করা

- `CallService.ts` - WebRTC কানেকশন লজিক পরিবর্তন করতে
- `VideoCallDialog.tsx` - ভিডিও কল UI পরিবর্তন করতে
- `CallButton.tsx` - কল বাটন ডিজাইন পরিবর্তন করতে
- `CallHistoryDialog.tsx` - কল ইতিহাস UI পরিবর্তন করতে

### 6. ট্রাবলশুটিং

যদি কল কানেকশন সমস্যা হয়:

1. STUN/TURN সার্ভার কানেকশন চেক করুন
2. ব্রাউজার কনসোলে WebRTC সংক্রান্ত এরর চেক করুন
3. সিগন্যালিং সার্ভার চালু আছে কিনা চেক করুন
4. ব্যবহারকারীকে ক্যামেরা এবং মাইক্রোফোন অ্যাক্সেস দিতে অনুমতি দিয়েছেন কিনা চেক করুন
5. সিগন্যালিং সার্ভারে WebSocket কানেকশন চেক করুন 