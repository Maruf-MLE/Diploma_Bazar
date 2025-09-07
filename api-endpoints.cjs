/**
 * API Endpoints for testing rate limiting
 */

// Set up test route handlers
function setupApiEndpoints(app, { rateLimitMiddleware }) {
  // Health endpoint - should bypass rate limiting
  app.get('/health', (req, res) => {
    res.status(200).json({
      status: 'ok',
      timestamp: new Date().toISOString(),
      environment: process.env.NODE_ENV || 'development',
      service: 'diploma-bazar-api'
    });
  });
  
  // Test endpoint - should be rate limited
  app.get('/api/books', (req, res) => {
    res.status(200).json({
      message: 'This is a test endpoint that should be rate limited',
      books: [
        { id: 1, title: 'Test Book 1' },
        { id: 2, title: 'Test Book 2' },
        { id: 3, title: 'Test Book 3' }
      ],
      timestamp: new Date().toISOString()
    });
  });
  
  // API test endpoint
  app.get('/api/test', (req, res) => {
    res.status(200).json({
      message: 'API test endpoint',
      timestamp: new Date().toISOString()
    });
  });
  
  // Rate limit status endpoint
  app.get('/api/rate-limit/status', (req, res) => {
    const identifier = req.requestIdentifier || req.ip;
    const identifierType = req.identifierType || 'IP';
    
    res.status(200).json({
      identifier,
      identifierType,
      timestamp: new Date().toISOString(),
      headers: {
        'X-RateLimit-Limit': res.getHeader('X-RateLimit-Limit'),
        'X-RateLimit-Remaining': res.getHeader('X-RateLimit-Remaining'),
        'X-RateLimit-Reset': res.getHeader('X-RateLimit-Reset')
      }
    });
  });
  
  return app;
}

module.exports = { setupApiEndpoints };
