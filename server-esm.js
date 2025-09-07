/**
 * Signaling Server (ES Module version)
 */

import dotenv from 'dotenv';
import express from 'express';
import http from 'http';
import { Server } from 'socket.io';
import cors from 'cors';
import jwt from 'jsonwebtoken';
import { createClient } from '@supabase/supabase-js';

// Initialize environment
dotenv.config();

// Initialize Express app
const app = express();
app.use(cors({
  origin: process.env.CLIENT_URL || '*',
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  credentials: true
}));
app.use(express.json());

// Create HTTP server
const server = http.createServer(app);

// Initialize Socket.IO with CORS settings
const io = new Server(server, {
  cors: {
    origin: process.env.CLIENT_URL || '*',
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    credentials: true
  },
  pingTimeout: 60000,
  transports: ['websocket', 'polling'],
  allowEIO3: true
});

// Initialize Supabase client
const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_KEY || process.env.SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ CRITICAL: Missing Supabase credentials');
  console.error('Please set SUPABASE_URL and SUPABASE_SERVICE_KEY in environment variables');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

// Store active users and their socket IDs
const users = {};
const callSessions = {};

// JWT secret key
const JWT_SECRET = process.env.JWT_SECRET;

if (!JWT_SECRET) {
  console.error('❌ CRITICAL: Missing JWT_SECRET in environment variables');
  console.error('Please set JWT_SECRET in your .env file or environment variables');
  process.exit(1);
}

// Middleware to verify JWT token
function authenticateToken(socket, next) {
  const token = socket.handshake.auth.token;
  
  // Development mode bypass - allow connections without token for testing
  const isDev = process.env.NODE_ENV !== 'production';
  if (isDev && !token) {
    console.log('Development mode: Bypassing token authentication');
    socket.userId = `dev-user-${Date.now()}`;
    return next();
  }
  
  if (!token) {
    return next(new Error('Authentication error: Token required'));
  }
  
  jwt.verify(token, JWT_SECRET, (err, decoded) => {
    if (err) {
      return next(new Error('Authentication error: Invalid token'));
    }
    
    socket.userId = decoded.userId;
    next();
  });
}

// Apply middleware to all Socket.IO connections
io.use(authenticateToken);

// Socket.IO connection handler
io.on('connection', (socket) => {
  const userId = socket.userId;
  console.log(`User connected: ${userId}, Socket ID: ${socket.id}`);
  
  // Store user's socket connection
  users[userId] = socket.id;
  
  // Inform client about successful connection
  socket.emit('connection_success', { userId });
  
  // Handle disconnection
  socket.on('disconnect', async () => {
    console.log(`User disconnected: ${userId}`);
    
    // Remove user from active users
    delete users[userId];
  });
});

// API Routes

// Root endpoint
app.get('/', (req, res) => {
  res.status(200).send({ 
    message: 'Boi Chapa Bazar Signaling Server',
    status: 'running',
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV || 'development',
    endpoints: {
      health: '/health',
      auth: '/auth/token'
    }
  });
});

// Health check endpoint
app.get('/health', (req, res) => {
  res.status(200).send({ 
    status: 'ok',
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV || 'development',
    clientUrl: process.env.CLIENT_URL || 'not set',
    connectedUsers: Object.keys(users).length
  });
});

// Generate JWT token for authentication
app.post('/auth/token', async (req, res) => {
  try {
    const { userId, userToken } = req.body;
    
    if (!userId || !userToken) {
      return res.status(400).send({ error: 'User ID and token are required' });
    }
    
    // Generate JWT token
    const token = jwt.sign({ userId }, JWT_SECRET, { expiresIn: '24h' });
    
    res.status(200).send({ token });
  } catch (error) {
    console.error('Error generating token:', error);
    res.status(500).send({ error: 'Server error' });
  }
});

// Start server
const PORT = process.env.PORT || 3001;
server.listen(PORT, () => {
  console.log(`🚀 Signaling server running on port ${PORT}`);
  console.log(`🔗 Client URL: ${process.env.CLIENT_URL || '*'}`);
  console.log(`🌐 Server URL: http://localhost:${PORT}`);
  console.log(`🏥 Health check: http://localhost:${PORT}/health`);
}); 