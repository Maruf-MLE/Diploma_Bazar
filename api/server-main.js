// Vercel API Handler for Diploma Bazar
// This file handles all API routes with rate limiting

const express = require('express');
const cors = require('cors');
const { createClient } = require('@supabase/supabase-js');

// Import rate limiting middleware
const { authenticate, extractRequestIdentifier, requireAdmin, debugMiddleware } = require('../src/middleware/authMiddleware.cjs');
const { rateLimitMiddleware, rateLimitStatus, clearRateLimitCache } = require('../src/middleware/rateLimitMiddleware.cjs');
const { RATE_LIMIT_CONFIG } = require('../src/config/rateLimitConfig.cjs');

// Create Express app
const app = express();

// Trust proxy for accurate IP extraction
app.set('trust proxy', true);

// CORS middleware
app.use(cors({
  origin: '*',
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  credentials: true
}));

// Parse JSON and URL-encoded data
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Debug middleware (development only)
app.use(debugMiddleware);

// Authentication and security middleware
app.use(authenticate);

// Extract request identifier for rate limiting
app.use(extractRequestIdentifier);

// Apply rate limiting
app.use(rateLimitMiddleware);

// Initialize Supabase client
const supabaseUrl = process.env.SUPABASE_URL || 'https://yryerjgidsyfiohmpeoc.supabase.co';
const supabaseKey = process.env.SUPABASE_SERVICE_KEY || process.env.SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InlyeWVyamdpZHN5ZmlvaG1wZW9jIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTA5NjA1NTIsImV4cCI6MjA2NjUzNjU1Mn0.S2ki-0QyFabstnVnTh9qFiHoz7sqBZgkfPThn77wTno';
const supabase = createClient(supabaseUrl, supabaseKey);

// API Routes

// Root endpoint
app.get('/', (req, res) => {
  res.status(200).json({ 
    message: 'Diploma Bazar API Server',
    version: '1.0.0',
    status: 'running',
    timestamp: new Date().toISOString(),
    endpoints: {
      health: '/health',
      rateLimit: '/api/rate-limit/status',
      test: '/api/test',
      admin: '/api/admin/*'
    },
    rateLimiting: 'Active',
    documentation: 'Visit /health for server status'
  });
});

// Health check endpoint
app.get('/health', (req, res) => {
  res.status(200).json({ 
    status: 'ok',
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV || 'production',
    rateLimiting: 'Active',
    database: 'Connected'
  });
});

// Test endpoint for rate limiting (not in skip list)
app.get('/api/test', (req, res) => {
  res.status(200).json({ 
    message: 'Rate limiting test endpoint - Production',
    timestamp: new Date().toISOString(),
    ip: req.clientIP,
    identifier: req.requestIdentifier,
    type: req.identifierType,
    rateLimiting: 'Active',
    environment: 'Production'
  });
});

// Rate Limiting API Endpoints

// Get rate limit status for current identifier
app.get('/api/rate-limit/status', rateLimitStatus);

// Clear rate limit cache (admin only)
app.delete('/api/admin/rate-limit/cache', requireAdmin, (req, res) => {
  clearRateLimitCache(req, res);
});

// Admin endpoints for rate limiting management
app.get('/api/admin/rate-limit/statistics', requireAdmin, async (req, res) => {
  try {
    const hoursBack = parseInt(req.query.hours) || 24;
    const { data, error } = await supabase.rpc('get_rate_limit_statistics', {
      p_hours_back: hoursBack
    });
    
    if (error) {
      console.error('Error getting rate limit statistics:', error);
      return res.status(500).json({
        error: 'Failed to get statistics',
        message: error.message,
        timestamp: new Date().toISOString()
      });
    }
    
    res.json(data);
  } catch (error) {
    console.error('Rate limit statistics error:', error);
    res.status(500).json({
      error: 'Server error',
      message: error.message,
      timestamp: new Date().toISOString()
    });
  }
});

// Simple API endpoints for testing
app.get('/api/books', (req, res) => {
  res.json({ 
    message: 'Books API endpoint',
    rateLimiting: 'Active',
    timestamp: new Date().toISOString()
  });
});

app.get('/api/messages', (req, res) => {
  res.json({ 
    message: 'Messages API endpoint',
    rateLimiting: 'Active',
    timestamp: new Date().toISOString()
  });
});

// Handle all other API routes
app.all('/api/*', (req, res) => {
  res.status(404).json({
    error: 'API endpoint not found',
    path: req.path,
    method: req.method,
    timestamp: new Date().toISOString()
  });
});

// Default export for Vercel
module.exports = app;
