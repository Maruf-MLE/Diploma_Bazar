// Global types for the application

export interface PurchaseRequest {
  id: string;
  book_id: string;
  buyer_id: string;
  seller_id: string;
  meetup_date: string;
  meetup_location: string;
  proposed_price: number;
  message: string;
  status: 'pending' | 'accepted' | 'rejected';
  created_at: string;
  buyer_name?: string;
}

export interface Message {
  id: string;
  sender_id: string;
  receiver_id: string;
  book_id?: string;
  content: string;
  created_at: string;
  updated_at: string;
  sender_name?: string;
  sender_avatar_url?: string | undefined;
  isOwn?: boolean;
  isPurchaseRequest?: boolean;
  purchaseRequest?: PurchaseRequest;
  status?: 'sent' | 'delivered' | 'read';
  // Other fields from API
  [key: string]: any;
}

// Re-export error types for convenience
export { ErrorState, ErrorInfo, errorMessages } from './errorTypes';
export { ErrorManager } from './errorManager';
