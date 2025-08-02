-- Create purchase_history table
CREATE TABLE IF NOT EXISTS public.purchase_history (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  book_id UUID NOT NULL REFERENCES public.books(id),
  buyer_id UUID NOT NULL REFERENCES auth.users(id),
  seller_id UUID NOT NULL REFERENCES auth.users(id),
  purchase_request_id UUID REFERENCES public.purchase_requests(id),
  price DECIMAL(10, 2) NOT NULL,
  purchase_date TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  meetup_location TEXT,
  meetup_date TIMESTAMP WITH TIME ZONE,
  book_title TEXT,
  book_author TEXT,
  book_cover_image_url TEXT
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_purchase_history_buyer_id ON public.purchase_history(buyer_id);
CREATE INDEX IF NOT EXISTS idx_purchase_history_seller_id ON public.purchase_history(seller_id);
CREATE INDEX IF NOT EXISTS idx_purchase_history_book_id ON public.purchase_history(book_id);

-- RLS policies for purchase history
ALTER TABLE public.purchase_history ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow users to view their own purchase history"
  ON public.purchase_history
  FOR SELECT
  USING (auth.uid() = buyer_id OR auth.uid() = seller_id);

-- Create stored procedure to handle purchase request acceptance
CREATE OR REPLACE FUNCTION public.accept_purchase_request(request_id UUID)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_book_id UUID;
  v_buyer_id UUID;
  v_seller_id UUID;
  v_price DECIMAL(10, 2);
  v_meetup_location TEXT;
  v_meetup_date TIMESTAMP WITH TIME ZONE;
  v_book_title TEXT;
  v_book_author TEXT;
  v_book_cover_image_url TEXT;
BEGIN
  -- Get the purchase request details
  SELECT 
    pr.book_id, 
    pr.buyer_id, 
    pr.seller_id, 
    pr.proposed_price, 
    pr.meetup_location, 
    pr.meetup_date,
    b.title,
    b.author,
    b.cover_image_url
  INTO 
    v_book_id, 
    v_buyer_id, 
    v_seller_id, 
    v_price, 
    v_meetup_location, 
    v_meetup_date,
    v_book_title,
    v_book_author,
    v_book_cover_image_url
  FROM 
    public.purchase_requests pr
  JOIN 
    public.books b ON pr.book_id = b.id
  WHERE 
    pr.id = request_id;

  -- Check if the purchase request was found
  IF v_book_id IS NULL THEN
    RAISE EXCEPTION 'Purchase request not found';
  END IF;

  -- Update the purchase request status
  UPDATE public.purchase_requests
  SET status = 'accepted'
  WHERE id = request_id;

  -- Update the book status to sold
  UPDATE public.books
  SET status = 'sold'
  WHERE id = v_book_id;

  -- Create purchase history record
  INSERT INTO public.purchase_history (
    book_id, 
    buyer_id, 
    seller_id, 
    purchase_request_id, 
    price, 
    meetup_location, 
    meetup_date,
    book_title,
    book_author,
    book_cover_image_url
  ) VALUES (
    v_book_id, 
    v_buyer_id, 
    v_seller_id, 
    request_id, 
    v_price, 
    v_meetup_location, 
    v_meetup_date,
    v_book_title,
    v_book_author,
    v_book_cover_image_url
  );
END;
$$; 