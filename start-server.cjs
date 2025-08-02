/**
 * Server Starter Script
 * This script helps to start the server with environment variables
 */

// Set environment variables directly if .env file is not available
process.env.PORT = process.env.PORT || 3001;
process.env.CLIENT_URL = process.env.CLIENT_URL || 'http://localhost:8080';
process.env.SUPABASE_URL = process.env.SUPABASE_URL || 'https://yryerjgidsyfiohmpeoc.supabase.co';
process.env.SUPABASE_ANON_KEY = process.env.SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InlyeWVyamdpZHN5ZmlvaG1wZW9jIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTA5NjA1NTIsImV4cCI6MjA2NjUzNjU1Mn0.S2ki-0QyFabstnVnTh9qFiHoz7sqBZgkfPThn77wTno';
process.env.JWT_SECRET = process.env.JWT_SECRET || 'boi-chapa-bazar-secure-jwt-token-for-calls';
process.env.STUN_SERVERS = process.env.STUN_SERVERS || 'stun:stun.l.google.com:19302,stun:stun1.l.google.com:19302';

// Load the server
console.log('Starting server with the following configuration:');
console.log('PORT:', process.env.PORT);
console.log('CLIENT_URL:', process.env.CLIENT_URL);
console.log('SUPABASE_URL:', process.env.SUPABASE_URL);
console.log('JWT_SECRET is set:', !!process.env.JWT_SECRET);

// Run the server
require('./server.cjs'); 
require('./server.js'); 