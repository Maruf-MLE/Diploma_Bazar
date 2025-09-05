#!/usr/bin/env node

/**
 * Clear Toast Data Utility
 * 
 * This script helps clear stored toast data from localStorage
 * Useful for development and testing
 */

console.log('🧹 Toast Data Cleaner');
console.log('====================');

const TOAST_STORAGE_KEYS = {
  MESSAGES: 'messageToaster_shownIds',
  NOTIFICATIONS: 'notificationToaster_shownIds',
};

// Since this is a Node.js script, we can't directly access localStorage
// This script is meant to be run in the browser console or as documentation

const clearScript = `
// Run this in your browser console to clear toast data
try {
  localStorage.removeItem('${TOAST_STORAGE_KEYS.MESSAGES}');
  localStorage.removeItem('${TOAST_STORAGE_KEYS.NOTIFICATIONS}');
  console.log('✅ All toast data cleared successfully');
} catch (error) {
  console.error('❌ Failed to clear toast data:', error);
}
`;

const statsScript = `
// Run this in your browser console to see toast data stats
try {
  const messageData = localStorage.getItem('${TOAST_STORAGE_KEYS.MESSAGES}');
  const notificationData = localStorage.getItem('${TOAST_STORAGE_KEYS.NOTIFICATIONS}');
  
  const messageCount = messageData ? Object.keys(JSON.parse(messageData)).length : 0;
  const notificationCount = notificationData ? Object.keys(JSON.parse(notificationData)).length : 0;
  
  console.log('📊 Toast Data Statistics:');
  console.log('Message toasts stored:', messageCount);
  console.log('Notification toasts stored:', notificationCount);
  console.log('Total:', messageCount + notificationCount);
} catch (error) {
  console.error('❌ Failed to get toast data stats:', error);
}
`;

console.log('To clear toast data, run this in your browser console:');
console.log('');
console.log(clearScript);
console.log('');
console.log('To see toast data statistics, run this in your browser console:');
console.log('');
console.log(statsScript);
console.log('');
console.log('💡 Tip: Toast data is automatically cleaned when:');
console.log('   - App starts (expired data only)');
console.log('   - User logs out (all data)');
console.log('   - Page is refreshed or closed (expired data only)');