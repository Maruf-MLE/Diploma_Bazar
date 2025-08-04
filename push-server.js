import webpush from 'web-push';
import express from 'express';
import cors from 'cors';
import bodyParser from 'body-parser';
import dotenv from 'dotenv';

dotenv.config();

const app = express();

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

// In-memory subscription store (use DB in production)
// Structure: { userId: subscription }
const subscriptions = new Map();

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
  console.log('Notification request:', { userId, title, body, url });
  
  if (!userId) {
    return res.status(400).json({ error: 'userId is required' });
  }
  
  const subscription = subscriptions.get(userId);
  if (!subscription) {
    console.log('No subscription found for user:', userId);
    return res.json({ success: false, message: 'No subscription found for user' });
  }
  
  const payload = JSON.stringify({ title, body, url });
  console.log('Sending notification to user:', userId);
  
  try {
    await webpush.sendNotification(subscription, payload);
    console.log('Notification sent successfully to:', userId);
    res.json({ success: true });
  } catch (error) {
    console.error('Failed to send notification:', error);
    // Remove invalid subscription
    subscriptions.delete(userId);
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

