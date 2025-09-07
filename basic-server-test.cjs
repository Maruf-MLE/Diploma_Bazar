// Basic Server Test WITHOUT Rate Limiting
const express = require('express');

const app = express();
const PORT = 3003;

// Basic middleware
app.use(express.json());

// Simple test middleware
app.use((req, res, next) => {
  console.log(`📝 Request: ${req.method} ${req.path}`);
  next();
});

// Simple test route
app.get('/test', (req, res) => {
  res.json({
    message: 'Basic test endpoint (no rate limiting)',
    timestamp: new Date().toISOString(),
    path: req.path
  });
});

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'ok', port: PORT, rateLimiting: false });
});

// Start server
app.listen(PORT, () => {
  console.log(`🚀 Basic server running on port ${PORT}`);
  console.log(`   Test: http://localhost:${PORT}/test`);
});
