import webpush from 'web-push';
import express from 'express';
import cors from 'cors';
import bodyParser from 'body-parser';
import dotenv from 'dotenv';
import { createClient } from '@supabase/supabase-js';

dotenv.config();

const app = express();

// Initialize Supabase client
const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Missing Supabase environment variables');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);
console.log('✅ Supabase client initialized');

// CORS configuration for production
const corsOptions = {
  origin: [
    'http://localhost:5173',  // Vite dev server
    'http://localhost:3000',  // Alternative dev server
    'http://localhost:8080',  // Production dev server
    // Add your production domains here
    'https://your-production-domain.com',
    'https://your-site.netlify.app',
    'https://your-site.vercel.app'
  ],
  credentials: true,
  optionsSuccessStatus: 200
};

app.use(cors(corsOptions));
app.use(bodyParser.json());

// Configure VAPID keys
webpush.setVapidDetails(
  'mailto:admin@example.com',
  process.env.VAPID_PUBLIC_KEY,
  process.env.VAPID_PRIVATE_KEY
);

console.log('✅ VAPID keys configured');
console.log('Public key:', process.env.VAPID_PUBLIC_KEY ? 'Found' : 'Missing');
console.log('Private key:', process.env.VAPID_PRIVATE_KEY ? 'Found' : 'Missing');

// In-memory subscription store (fallback)
// Structure: { userId: subscription }
const subscriptions = new Map();

// Helper function to convert base64 to ArrayBuffer
function base64ToArrayBuffer(base64) {
  const binaryString = atob(base64);
  const bytes = new Uint8Array(binaryString.length);
  for (let i = 0; i < binaryString.length; i++) {
    bytes[i] = binaryString.charCodeAt(i);
  }
  return bytes.buffer;
}

// Helper function to send notification to a subscription
async function sendNotificationToSubscription(subscription, { title, body, url }) {
  const payload = JSON.stringify({ title, body, url });
  console.log('📤 Sending notification payload:', { title, body, url });
  
  try {
    await webpush.sendNotification(subscription, payload);
    console.log('✅ Notification sent successfully');
  } catch (error) {
    console.error('❌ Failed to send notification:', error);
    throw error;
  }
}

app.post('/subscribe', (req, res) => {
  const { userId, ...subscription } = req.body;
  console.log('New subscription for user:', userId);
  
  if (userId) {
    subscriptions.set(userId, subscription);
    console.log('Total subscriptions:', subscriptions.size);
  }
  
  res.status(201).json({ success: true });
});

app.post('/notify', async (req, res) => {
  const { userId, title, body, url } = req.body;
  console.log('🔔 Notification request:', { userId, title, body, url });
  
  if (!userId) {
    return res.status(400).json({ error: 'userId is required' });
  }
  
  try {
    // First try to get subscription from database
    const { data: dbSubscriptions, error } = await supabase
      .from('push_subscriptions')
      .select('*')
      .eq('user_id', userId)
      .eq('is_active', true);
    
    if (error) {
      console.error('❌ Database error:', error);
      // Fallback to in-memory subscriptions
      const memorySubscription = subscriptions.get(userId);
      if (!memorySubscription) {
        return res.json({ success: false, message: 'No subscription found for user' });
      }
      
      await sendNotificationToSubscription(memorySubscription, { title, body, url });
      return res.json({ success: true, source: 'memory' });
    }
    
    if (!dbSubscriptions || dbSubscriptions.length === 0) {
      console.log('🔍 No database subscription found, checking memory...');
      // Fallback to in-memory subscriptions
      const memorySubscription = subscriptions.get(userId);
      if (!memorySubscription) {
        return res.json({ success: false, message: 'No subscription found for user' });
      }
      
      await sendNotificationToSubscription(memorySubscription, { title, body, url });
      return res.json({ success: true, source: 'memory' });
    }
    
    console.log(`📤 Found ${dbSubscriptions.length} subscription(s) in database`);
    
    let successCount = 0;
    let errorCount = 0;
    
    // Send notification to all active subscriptions for this user
    for (const dbSub of dbSubscriptions) {
      try {
        // Convert database subscription to webpush format
        const subscription = {
          endpoint: dbSub.endpoint,
          keys: {
            auth: base64ToArrayBuffer(dbSub.auth_key),
            p256dh: base64ToArrayBuffer(dbSub.p256dh_key)
          }
        };
        
        await sendNotificationToSubscription(subscription, { title, body, url });
        successCount++;
        console.log(`✅ Notification sent to subscription ${dbSub.id}`);
        
      } catch (error) {
        console.error(`❌ Failed to send to subscription ${dbSub.id}:`, error);
        errorCount++;
        
        // Deactivate invalid subscription
        await supabase
          .from('push_subscriptions')
          .update({ is_active: false })
          .eq('id', dbSub.id);
      }
    }
    
    res.json({ 
      success: successCount > 0, 
      successCount, 
      errorCount,
      source: 'database'
    });
    
  } catch (error) {
    console.error('❌ Notification error:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// Debug endpoint to see all subscriptions
app.get('/subscriptions', (req, res) => {
  const userIds = Array.from(subscriptions.keys());
  res.json({ 
    count: subscriptions.size,
    userIds 
  });
});

// Home route for testing
app.get('/', (req, res) => {
  res.json({
    message: 'Push Notification Server is running!',
    endpoints: {
      subscribe: 'POST /subscribe',
      notify: 'POST /notify',
      subscriptions: 'GET /subscriptions'
    },
    status: 'active',
    subscriptions: subscriptions.size
  });
});

const PORT = process.env.PUSH_PORT || 4000;
app.listen(PORT, () => console.log(`Push server running on ${PORT}`));

