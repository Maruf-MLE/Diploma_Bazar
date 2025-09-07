// Client-side API Integration Example
// Add this pattern to your frontend API calls

// API Configuration
const API_CONFIG = {
  // Development API key (change in production!)
  API_KEY: 'dev-api-key-12345678901234567890123456789012',
  BASE_URL: process.env.NODE_ENV === 'production' 
    ? 'https://your-backend-url.com' 
    : 'http://localhost:3001'
};

// Enhanced fetch function with rate limiting support
const apiRequest = async (endpoint, options = {}) => {
  const url = `${API_CONFIG.BASE_URL}${endpoint}`;
  
  // Get auth token if available
  const authToken = localStorage.getItem('authToken') || 
                   sessionStorage.getItem('supabase.auth.token');
  
  // Default headers
  const headers = {
    'Content-Type': 'application/json',
    'User-Agent': 'DiplomaBazar/1.0',
    'x-api-key': API_CONFIG.API_KEY,
    ...options.headers
  };
  
  // Add auth header if token exists
  if (authToken) {
    headers.Authorization = `Bearer ${authToken}`;
  }
  
  const config = {
    ...options,
    headers
  };
  
  try {
    const response = await fetch(url, config);
    
    // Handle rate limiting
    if (response.status === 429) {
      const rateLimitData = await response.json();
      const retryAfter = response.headers.get('Retry-After') || 60;
      
      console.warn('Rate limit exceeded:', rateLimitData);
      
      // Show user-friendly message
      showRateLimitMessage(rateLimitData, retryAfter);
      
      // Optional: Auto-retry after delay
      await new Promise(resolve => setTimeout(resolve, retryAfter * 1000));
      return apiRequest(endpoint, options); // Retry
    }
    
    // Handle other errors
    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.message || `HTTP ${response.status}`);
    }
    
    return response.json();
  } catch (error) {
    console.error('API Request failed:', error);
    throw error;
  }
};

// User-friendly rate limit message
const showRateLimitMessage = (rateLimitData, retryAfter) => {
  const message = `
    Too many requests! Please wait ${retryAfter} seconds before trying again.
    
    Your current usage:
    - This minute: ${rateLimitData.current?.minute || 0}/${rateLimitData.limits?.per_minute || 50}
    - This hour: ${rateLimitData.current?.hour || 0}/${rateLimitData.limits?.per_hour || 1000}
  `;
  
  // Show toast notification or modal
  // Replace with your UI library
  alert(message);
};

// Example Usage in your components:

// 1. Get books list
export const getBooks = async (filters = {}) => {
  const queryString = new URLSearchParams(filters).toString();
  return apiRequest(`/api/books${queryString ? `?${queryString}` : ''}`);
};

// 2. Create new book
export const createBook = async (bookData) => {
  return apiRequest('/api/books', {
    method: 'POST',
    body: JSON.stringify(bookData)
  });
};

// 3. Send message
export const sendMessage = async (messageData) => {
  return apiRequest('/api/messages', {
    method: 'POST',
    body: JSON.stringify(messageData)
  });
};

// 4. Check rate limit status
export const getRateLimitStatus = async () => {
  return apiRequest('/api/rate-limit/status');
};

// 5. Admin: Get rate limit statistics
export const getRateLimitStats = async () => {
  return apiRequest('/api/admin/rate-limit/statistics');
};

// React Hook Example
import { useState, useEffect } from 'react';

export const useRateLimit = () => {
  const [rateLimitStatus, setRateLimitStatus] = useState(null);
  const [loading, setLoading] = useState(false);
  
  const checkRateLimit = async () => {
    setLoading(true);
    try {
      const status = await getRateLimitStatus();
      setRateLimitStatus(status);
    } catch (error) {
      console.error('Failed to check rate limit:', error);
    } finally {
      setLoading(false);
    }
  };
  
  useEffect(() => {
    checkRateLimit();
    // Check every minute
    const interval = setInterval(checkRateLimit, 60000);
    return () => clearInterval(interval);
  }, []);
  
  return { rateLimitStatus, loading, checkRateLimit };
};

// Component Usage Example
const BooksList = () => {
  const [books, setBooks] = useState([]);
  const [loading, setLoading] = useState(false);
  const { rateLimitStatus } = useRateLimit();
  
  const loadBooks = async () => {
    setLoading(true);
    try {
      const data = await getBooks();
      setBooks(data);
    } catch (error) {
      console.error('Failed to load books:', error);
      // Handle error (show toast, etc.)
    } finally {
      setLoading(false);
    }
  };
  
  return (
    <div>
      {rateLimitStatus && (
        <div className="rate-limit-info">
          Requests remaining: {rateLimitStatus.limits?.per_minute - rateLimitStatus.current?.minute}
        </div>
      )}
      
      <button onClick={loadBooks} disabled={loading}>
        {loading ? 'Loading...' : 'Load Books'}
      </button>
      
      {books.map(book => (
        <div key={book.id}>{book.title}</div>
      ))}
    </div>
  );
};
