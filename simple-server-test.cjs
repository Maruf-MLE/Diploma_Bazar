// Simple Server Test for Rate Limiting
const express = require('express');
const { rateLimitMiddleware } = require('./src/middleware/rateLimitMiddleware.cjs');

const app = express();
const PORT = 3002; // Different port

// Basic middleware
app.use(express.json());

// Add a simple test middleware to see if it works
app.use((req, res, next) => {
  console.log(`📝 Simple middleware: ${req.method} ${req.path}`);
  next();
});

// Add rate limiting middleware
app.use(rateLimitMiddleware);

// Simple test route
app.get('/test', (req, res) => {
  res.json({
    message: 'Simple test endpoint',
    timestamp: new Date().toISOString(),
    path: req.path
  });
});

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'ok', port: PORT });
});

// Error handling
app.use((err, req, res, next) => {
  console.error('Server Error:', err);
  res.status(500).json({
    error: 'Server Error',
    message: err.message
  });
});

// Start server
app.listen(PORT, () => {
  console.log(`🚀 Simple test server running on port ${PORT}`);
  console.log(`   Test: http://localhost:${PORT}/test`);
  console.log(`   Health: http://localhost:${PORT}/health`);
});

// Handle uncaught errors
process.on('uncaughtException', (err) => {
  console.error('Uncaught Exception:', err);
  process.exit(1);
});

process.on('unhandledRejection', (reason, promise) => {
  console.error('Unhandled Rejection at:', promise, 'reason:', reason);
  process.exit(1);
});
