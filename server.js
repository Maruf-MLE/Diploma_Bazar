require('dotenv').config();
const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const cors = require('cors');
const jwt = require('jsonwebtoken');
const { createClient } = require('@supabase/supabase-js');

// Initialize Express app
const app = express();
app.use(cors({
  origin: '*',
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  credentials: true
}));
app.use(express.json());

// Create HTTP server
const server = http.createServer(app);

// Initialize Socket.IO with CORS settings
const io = new Server(server, {
  cors: {
    origin: '*',
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    credentials: true
  },
  pingTimeout: 60000,
  transports: ['websocket', 'polling'],
  allowEIO3: true
});

// Initialize Supabase client
const supabaseUrl = process.env.SUPABASE_URL || 'https://yryerjgidsyfiohmpeoc.supabase.co';
const supabaseKey = process.env.SUPABASE_SERVICE_KEY || process.env.SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InlyeWVyamdpZHN5ZmlvaG1wZW9jIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTA5NjA1NTIsImV4cCI6MjA2NjUzNjU1Mn0.S2ki-0QyFabstnVnTh9qFiHoz7sqBZgkfPThn77wTno';
const supabase = createClient(supabaseUrl, supabaseKey);

// Store active users and their socket IDs
const users = {};
const callSessions = {};

// JWT secret key
const JWT_SECRET = process.env.JWT_SECRET || 'your-default-jwt-secret-key-change-in-production';

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
  
  // Handle call initiation
  socket.on('call_initiate', async ({ receiverId, callType }) => {
    try {
      const receiverSocketId = users[receiverId];
      
      if (!receiverSocketId) {
        socket.emit('call_error', { 
          message: 'Receiver is offline',
          errorType: 'RECEIVER_OFFLINE'
        });
        return;
      }
      
      // Generate a unique call ID
      const callId = `${userId}_${receiverId}_${Date.now()}`;
      
      // Store call session
      callSessions[callId] = {
        callId,
        callerId: userId,
        receiverId,
        status: 'initiated',
        callType,
        startTime: null,
        endTime: null
      };
      
      // Store the call in database
      const { data, error } = await supabase
        .from('calls')
        .insert({
          caller_id: userId,
          receiver_id: receiverId,
          status: 'initiated',
          call_type: callType
        })
        .select()
        .single();
      
      if (error) {
        console.error('Error storing call:', error);
        socket.emit('call_error', { 
          message: 'Failed to create call record',
          errorType: 'DATABASE_ERROR'
        });
        return;
      }
      
      // Update call session with database ID
      callSessions[callId].dbCallId = data.id;
      
      // Notify receiver about incoming call
      io.to(receiverSocketId).emit('incoming_call', {
        callId,
        callerId: userId,
        callType
      });
      
      // Acknowledge call initiation to caller
      socket.emit('call_initiated', {
        callId,
        receiverId,
        callType
      });
      
    } catch (error) {
      console.error('Error initiating call:', error);
      socket.emit('call_error', { 
        message: 'Server error initiating call',
        errorType: 'SERVER_ERROR'
      });
    }
  });
  
  // Handle call acceptance
  socket.on('call_accept', async ({ callId }) => {
    try {
      const callSession = callSessions[callId];
      
      if (!callSession) {
        socket.emit('call_error', { 
          message: 'Call session not found',
          errorType: 'INVALID_CALL_SESSION'
        });
        return;
      }
      
      const callerSocketId = users[callSession.callerId];
      
      if (!callerSocketId) {
        socket.emit('call_error', { 
          message: 'Caller is no longer available',
          errorType: 'CALLER_UNAVAILABLE'
        });
        return;
      }
      
      // Update call session status
      callSession.status = 'connected';
      callSession.startTime = new Date();
      
      // Update database record
      await supabase
        .from('calls')
        .update({
          status: 'connected',
          start_time: callSession.startTime
        })
        .eq('id', callSession.dbCallId);
      
      // Notify caller that call was accepted
      io.to(callerSocketId).emit('call_accepted', { callId });
      
    } catch (error) {
      console.error('Error accepting call:', error);
      socket.emit('call_error', { 
        message: 'Server error accepting call',
        errorType: 'SERVER_ERROR'
      });
    }
  });
  
  // Handle call rejection
  socket.on('call_reject', async ({ callId, reason }) => {
    try {
      const callSession = callSessions[callId];
      
      if (!callSession) {
        return; // Call session might have been cleared already
      }
      
      const otherPartyId = userId === callSession.callerId ? 
        callSession.receiverId : callSession.callerId;
      
      const otherPartySocketId = users[otherPartyId];
      
      if (otherPartySocketId) {
        io.to(otherPartySocketId).emit('call_rejected', { 
          callId,
          reason: reason || 'Call rejected by user'
        });
      }
      
      // Update database record
      await supabase
        .from('calls')
        .update({
          status: 'rejected',
          end_time: new Date()
        })
        .eq('id', callSession.dbCallId);
      
      // Clean up call session
      delete callSessions[callId];
      
    } catch (error) {
      console.error('Error rejecting call:', error);
    }
  });
  
  // Handle call end
  socket.on('call_end', async ({ callId }) => {
    try {
      const callSession = callSessions[callId];
      
      if (!callSession) {
        return; // Call session might have been cleared already
      }
      
      const otherPartyId = userId === callSession.callerId ? 
        callSession.receiverId : callSession.callerId;
      
      const otherPartySocketId = users[otherPartyId];
      
      if (otherPartySocketId) {
        io.to(otherPartySocketId).emit('call_ended', { callId });
      }
      
      // Update database record
      await supabase
        .from('calls')
        .update({
          status: 'ended',
          end_time: new Date()
        })
        .eq('id', callSession.dbCallId);
      
      // Clean up call session
      delete callSessions[callId];
      
    } catch (error) {
      console.error('Error ending call:', error);
    }
  });
  
  // Handle WebRTC signaling (ICE candidates, SDP offers/answers)
  socket.on('webrtc_signal', ({ callId, signal, targetUserId }) => {
    try {
      const targetSocketId = users[targetUserId];
      
      if (targetSocketId) {
        io.to(targetSocketId).emit('webrtc_signal', {
          callId,
          signal,
          fromUserId: userId
        });
      }
    } catch (error) {
      console.error('Error handling WebRTC signal:', error);
    }
  });
  
  // Handle disconnection
  socket.on('disconnect', async () => {
    console.log(`User disconnected: ${userId}`);
    
    // Find any active calls involving this user and mark them as ended
    for (const callId in callSessions) {
      const callSession = callSessions[callId];
      
      if (callSession.callerId === userId || callSession.receiverId === userId) {
        const otherPartyId = userId === callSession.callerId ? 
          callSession.receiverId : callSession.callerId;
          
        const otherPartySocketId = users[otherPartyId];
        
        if (otherPartySocketId) {
          io.to(otherPartySocketId).emit('call_ended', { 
            callId,
            reason: 'User disconnected'
          });
        }
        
        // Update database record
        await supabase
          .from('calls')
          .update({
            status: 'ended',
            end_time: new Date()
          })
          .eq('id', callSession.dbCallId);
        
        // Clean up call session
        delete callSessions[callId];
      }
    }
    
    // Remove user from active users
    delete users[userId];
  });
});

// API Routes

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
    
    // Verify Supabase token (optional but recommended)
    // You might want to verify the token with Supabase here
    
    // Generate JWT token
    const token = jwt.sign({ userId }, JWT_SECRET, { expiresIn: '24h' });
    
    res.status(200).send({ token });
  } catch (error) {
    console.error('Error generating token:', error);
    res.status(500).send({ error: 'Server error' });
  }
});

// Get call history for a user
app.get('/calls/history', async (req, res) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).send({ error: 'Authorization token required' });
    }
    
    const token = authHeader.split(' ')[1];
    const decoded = jwt.verify(token, JWT_SECRET);
    const userId = decoded.userId;
    
    const { data, error } = await supabase
      .from('calls')
      .select(`
        id,
        caller_id,
        receiver_id,
        start_time,
        end_time,
        status,
        call_type,
        created_at
      `)
      .or(`caller_id.eq.${userId},receiver_id.eq.${userId}`)
      .order('created_at', { ascending: false })
      .limit(50);
    
    if (error) {
      console.error('Error fetching call history:', error);
      return res.status(500).send({ error: 'Database error' });
    }
    
    res.status(200).send({ data });
  } catch (error) {
    console.error('Error getting call history:', error);
    res.status(500).send({ error: 'Server error' });
  }
});

// Start server
const PORT = process.env.PORT || 3001;
server.listen(PORT, () => {
  console.log(`🚀 Signaling server running on port ${PORT}`);
});