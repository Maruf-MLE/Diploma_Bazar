/**
 * Application Configuration
 */

// সিগন্যালিং সার্ভার URL
export const SIGNALING_SERVER_URL = 'http://localhost:3001';

// ডেভেলপমেন্ট মোড
export const IS_DEV = true;

// ফলব্যাক টোকেন জেনারেশন
export const generateFallbackToken = (userId: string) => {
  return `dev_token_${userId}_${Date.now()}`;
}; 
 