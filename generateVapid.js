/* generateVapid.js
 * Run: npm run generate-vapid
 * Generates VAPID public / private keys for Web Push.
 */
import webpush from 'web-push';

const vapidKeys = webpush.generateVAPIDKeys();

console.log('VAPID_PUBLIC_KEY=', vapidKeys.publicKey);
console.log('VAPID_PRIVATE_KEY=', vapidKeys.privateKey);

