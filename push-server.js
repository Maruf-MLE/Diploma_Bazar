import webpush from 'web-push';
import express from 'express';
import cors from 'cors';
import bodyParser from 'body-parser';
import dotenv from 'dotenv';

dotenv.config();

const app = express();
app.use(cors());
app.use(bodyParser.json());

// Configure VAPID keys
webpush.setVapidDetails(
  'mailto:admin@example.com',
  process.env.VAPID_PUBLIC_KEY,
  process.env.VAPID_PRIVATE_KEY
);

// In-memory subscription store (use DB in production)
const subscriptions = [];

app.post('/subscribe', (req, res) => {
  const subscription = req.body;
  subscriptions.push(subscription);
  res.status(201).json({});
});

app.post('/notify', async (req, res) => {
  const { title, body, url } = req.body;
  const payload = JSON.stringify({ title, body, url });

  const results = await Promise.allSettled(
    subscriptions.map((sub) => webpush.sendNotification(sub, payload))
  );
  console.log(results);
  res.json({ success: true });
});

const PORT = process.env.PUSH_PORT || 4000;
app.listen(PORT, () => console.log(`Push server running on ${PORT}`));

