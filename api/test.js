// Simple API Test Handler for Vercel
// This file tests basic API functionality without complex middleware

module.exports = async (req, res) => {
  // Set CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  
  // Handle preflight OPTIONS request
  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }
  
  // Basic response
  try {
    const response = {
      message: 'API is working!',
      timestamp: new Date().toISOString(),
      method: req.method,
      url: req.url,
      headers: {
        'user-agent': req.headers['user-agent'],
        'x-forwarded-for': req.headers['x-forwarded-for'],
        'x-real-ip': req.headers['x-real-ip']
      },
      ip: req.headers['x-forwarded-for'] || req.headers['x-real-ip'] || 'unknown',
      environment: 'production',
      status: 'success'
    };
    
    res.status(200).json(response);
  } catch (error) {
    res.status(500).json({
      error: 'Internal Server Error',
      message: error.message,
      timestamp: new Date().toISOString()
    });
  }
};
