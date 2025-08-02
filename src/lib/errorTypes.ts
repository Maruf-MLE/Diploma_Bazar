export type ErrorState = 
  | 'expiredLink'
  | 'invalidLink'
  | 'accessDenied'
  | 'networkError'
  | 'serverError'
  | 'notFound'
  | 'unauthorized'
  | 'forbidden'
  | 'sessionExpired'
  | 'validationError'
  | 'uploadError'
  | 'downloadError'
  | 'connectionLost'
  | 'accountSuspended'
  | 'maintenanceMode'
  | 'rateLimitExceeded'
  | 'paymentRequired'
  | 'serviceUnavailable';

export const errorMessages: Record<ErrorState, string> = {
  expiredLink: 'লিঙ্কের মেয়াদ শেষ হয়েছে',
  invalidLink: 'অবৈধ লিঙ্ক প্রদান করা হয়েছে',
  accessDenied: 'প্রবেশাধিকার নিষিদ্ধ',
  networkError: 'নেটওয়ার্ক সংযোগে সমস্যা',
  serverError: 'সার্ভারে অভ্যন্তরীণ ত্রুটি',
  notFound: 'অনুরোধকৃত তথ্য খুঁজে পাওয়া যায়নি',
  unauthorized: 'অনুমোদনহীন প্রবেশ',
  forbidden: 'এই কাজটি করার অনুমতি নেই',
  sessionExpired: 'সেশনের মেয়াদ শেষ হয়েছে',
  validationError: 'তথ্য যাচাইয়ে ত্রুটি',
  uploadError: 'ফাইল আপলোডে সমস্যা',
  downloadError: 'ফাইল ডাউনলোডে সমস্যা',
  connectionLost: 'ইন্টারনেট সংযোগ বিচ্ছিন্ন',
  accountSuspended: 'অ্যাকাউন্ট সাময়িকভাবে স্থগিত',
  maintenanceMode: 'সিস্টেম রক্ষণাবেক্ষণের অধীনে',
  rateLimitExceeded: 'অনুরোধের সীমা অতিক্রম করেছে',
  paymentRequired: 'পেমেন্ট প্রয়োজন',
  serviceUnavailable: 'সেবা বর্তমানে অনুপলব্ধ'
};

export interface ErrorInfo {
  type: ErrorState;
  message?: string;
  details?: string;
  timestamp?: Date;
  code?: string | number;
}
