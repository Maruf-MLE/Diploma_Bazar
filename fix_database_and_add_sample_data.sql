-- Fix purchase_history table by adding review tracking columns
ALTER TABLE IF EXISTS public.purchase_history
ADD COLUMN IF NOT EXISTS buyer_has_reviewed BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS seller_has_reviewed BOOLEAN DEFAULT FALSE;

-- Create function to update purchase_history review status when a review is submitted
CREATE OR REPLACE FUNCTION public.update_purchase_review_status()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.purchase_id IS NOT NULL THEN
    IF NEW.is_buyer_review THEN
      UPDATE public.purchase_history
      SET buyer_has_reviewed = TRUE
      WHERE id = NEW.purchase_id;
    ELSIF NEW.is_seller_review THEN
      UPDATE public.purchase_history
      SET seller_has_reviewed = TRUE
      WHERE id = NEW.purchase_id;
    END IF;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger to update purchase_history when review is submitted
DROP TRIGGER IF EXISTS update_purchase_review_status_trigger ON public.reviews;
CREATE TRIGGER update_purchase_review_status_trigger
AFTER INSERT ON public.reviews
FOR EACH ROW
EXECUTE FUNCTION public.update_purchase_review_status();

-- Ensure reviews table has necessary columns for transaction tracking
ALTER TABLE IF EXISTS public.reviews
ADD COLUMN IF NOT EXISTS purchase_id UUID REFERENCES public.purchase_history(id) ON DELETE SET NULL,
ADD COLUMN IF NOT EXISTS is_buyer_review BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS is_seller_review BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS completed_transaction BOOLEAN DEFAULT TRUE;

-- Add a unique constraint to prevent multiple reviews of the same type for the same purchase
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint 
    WHERE conname = 'unique_review_per_transaction_type'
  ) THEN
    ALTER TABLE public.reviews
    ADD CONSTRAINT unique_review_per_transaction_type 
    UNIQUE (purchase_id, is_buyer_review, is_seller_review);
  END IF;
EXCEPTION
  WHEN undefined_table THEN
    -- Table doesn't exist yet, which is fine
    NULL;
END
$$;

-- Add sample data for purchase_history (if table is empty)
DO $$
DECLARE
  purchase_count INTEGER;
  sample_book_id UUID;
  sample_buyer_id UUID;
  sample_seller_id UUID;
  new_purchase_id UUID;
BEGIN
  -- Check if purchase_history is empty
  SELECT COUNT(*) INTO purchase_count FROM public.purchase_history;
  
  IF purchase_count = 0 THEN
    -- Get a sample book
    SELECT id, seller_id INTO sample_book_id, sample_seller_id 
    FROM public.books 
    WHERE status = 'available' 
    LIMIT 1;
    
    -- Get a sample buyer (different from seller)
    SELECT id INTO sample_buyer_id 
    FROM public.profiles 
    WHERE id != sample_seller_id 
    LIMIT 1;
    
    -- If we have both a book and buyer/seller
    IF sample_book_id IS NOT NULL AND sample_buyer_id IS NOT NULL AND sample_seller_id IS NOT NULL THEN
      -- Insert sample purchase history
      INSERT INTO public.purchase_history (
        book_id, 
        buyer_id, 
        seller_id, 
        price, 
        purchase_date, 
        meetup_location, 
        meetup_date,
        buyer_has_reviewed,
        seller_has_reviewed
      ) 
      VALUES (
        sample_book_id,
        sample_buyer_id,
        sample_seller_id,
        (SELECT price FROM public.books WHERE id = sample_book_id),
        NOW(),
        'ক্যাম্পাস',
        NOW() + interval '2 days',
        FALSE,
        FALSE
      )
      RETURNING id INTO new_purchase_id;
      
      -- Update book status to sold
      UPDATE public.books
      SET status = 'sold'
      WHERE id = sample_book_id;
      
      -- Add a sample review
      INSERT INTO public.reviews (
        reviewer_id,
        reviewee_id,
        rating,
        comment,
        created_at,
        purchase_id,
        is_buyer_review,
        is_seller_review,
        completed_transaction
      )
      VALUES (
        sample_buyer_id,
        sample_seller_id,
        5,
        'খুব ভালো বই এবং সেবা',
        NOW(),
        new_purchase_id,
        TRUE,
        FALSE,
        TRUE
      );
      
      -- Update buyer_has_reviewed status
      UPDATE public.purchase_history
      SET buyer_has_reviewed = TRUE
      WHERE id = new_purchase_id;
    END IF;
  END IF;
END
$$; 