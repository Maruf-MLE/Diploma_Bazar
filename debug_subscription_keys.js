// Debug subscription keys issue
import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';

dotenv.config();

const app = express();
app.use(cors());
app.use(express.json());

// In-memory subscription store for debugging
const subscriptions = new Map();

// Debug endpoint to check subscription structure
app.post('/debug-subscribe', (req, res) => {
  console.log('🔍 DEBUG: Full request body:', JSON.stringify(req.body, null, 2));
  
  const { userId, endpoint, keys } = req.body;
  
  console.log('📊 Extracted data:');
  console.log('  - userId:', userId);
  console.log('  - endpoint:', endpoint);
  console.log('  - keys:', keys);
  console.log('  - keys.auth:', keys?.auth);
  console.log('  - keys.p256dh:', keys?.p256dh);
  
  if (!keys || !keys.auth || !keys.p256dh) {
    console.log('❌ Missing keys detected!');
    return res.status(400).json({
      error: 'Missing keys',
      received: { userId, endpoint, keys }
    });
  }
  
  console.log('✅ Keys are present and valid');
  
  const subscription = {
    endpoint,
    keys: {
      auth: keys.auth,
      p256dh: keys.p256dh
    }
  };
  
  subscriptions.set(userId, subscription);
  console.log('💾 Subscription stored for user:', userId);
  
  res.json({ success: true, storedSubscription: subscription });
});

// Check stored subscriptions
app.get('/debug-subscriptions', (req, res) => {
  const allSubs = {};
  subscriptions.forEach((sub, userId) => {
    allSubs[userId] = {
      endpoint: sub.endpoint,
      hasAuth: !!sub.keys?.auth,
      hasP256dh: !!sub.keys?.p256dh,
      authLength: sub.keys?.auth?.length,
      p256dhLength: sub.keys?.p256dh?.length
    };
  });
  
  res.json({
    count: subscriptions.size,
    subscriptions: allSubs
  });
});

const PORT = 4001;
app.listen(PORT, () => {
  console.log(`🔍 Debug server running on http://localhost:${PORT}`);
  console.log('📋 Test endpoints:');
  console.log('  POST /debug-subscribe - Debug subscription creation');
  console.log('  GET /debug-subscriptions - Check stored subscriptions');
});
