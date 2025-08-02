-- Create purchase_requests table
CREATE TABLE IF NOT EXISTS public.purchase_requests (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  book_id UUID NOT NULL REFERENCES public.books(id) ON DELETE CASCADE,
  buyer_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  seller_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  meetup_date TIMESTAMP WITH TIME ZONE NOT NULL,
  meetup_location TEXT NOT NULL,
  proposed_price DECIMAL(10, 2) NOT NULL,
  message TEXT,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'accepted', 'rejected')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create notifications table
CREATE TABLE IF NOT EXISTS public.notifications (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  type TEXT NOT NULL,
  related_id UUID,
  is_read BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Add RLS policies for purchase_requests
ALTER TABLE public.purchase_requests ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow users to view their own purchase requests (as buyer or seller)" 
  ON public.purchase_requests 
  FOR SELECT 
  USING (auth.uid() = buyer_id OR auth.uid() = seller_id);

CREATE POLICY "Allow buyers to create purchase requests" 
  ON public.purchase_requests 
  FOR INSERT 
  WITH CHECK (auth.uid() = buyer_id);

CREATE POLICY "Allow buyers to update their own purchase requests" 
  ON public.purchase_requests 
  FOR UPDATE 
  USING (auth.uid() = buyer_id)
  WITH CHECK (auth.uid() = buyer_id AND status = 'pending');

CREATE POLICY "Allow sellers to update status of purchase requests" 
  ON public.purchase_requests 
  FOR UPDATE 
  USING (auth.uid() = seller_id)
  WITH CHECK (auth.uid() = seller_id AND status = 'pending');

-- Add RLS policies for notifications
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow users to view their own notifications" 
  ON public.notifications 
  FOR SELECT 
  USING (auth.uid() = user_id);

CREATE POLICY "Allow users to update their own notifications" 
  ON public.notifications 
  FOR UPDATE 
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Allow any authenticated user to create notifications" 
  ON public.notifications 
  FOR INSERT 
  WITH CHECK (auth.role() = 'authenticated');

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_purchase_requests_buyer_id ON public.purchase_requests(buyer_id);
CREATE INDEX IF NOT EXISTS idx_purchase_requests_seller_id ON public.purchase_requests(seller_id);
CREATE INDEX IF NOT EXISTS idx_purchase_requests_book_id ON public.purchase_requests(book_id);
CREATE INDEX IF NOT EXISTS idx_purchase_requests_status ON public.purchase_requests(status);
CREATE INDEX IF NOT EXISTS idx_notifications_user_id ON public.notifications(user_id);
CREATE INDEX IF NOT EXISTS idx_notifications_is_read ON public.notifications(is_read);
CREATE INDEX IF NOT EXISTS idx_notifications_type ON public.notifications(type);

-- Add trigger for purchase_requests
DROP TRIGGER IF EXISTS set_purchase_requests_updated_at ON public.purchase_requests;
CREATE TRIGGER set_purchase_requests_updated_at
BEFORE UPDATE ON public.purchase_requests
FOR EACH ROW
EXECUTE FUNCTION public.handle_updated_at(); 