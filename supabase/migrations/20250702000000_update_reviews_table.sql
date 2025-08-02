-- First, create reviews table if it doesn't exist
CREATE TABLE IF NOT EXISTS public.reviews (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  seller_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  reviewer_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  rating INTEGER NOT NULL CHECK (rating BETWEEN 1 AND 5),
  comment TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- Update purchase_history table to add review tracking fields
ALTER TABLE IF EXISTS public.purchase_history
ADD COLUMN IF NOT EXISTS buyer_has_reviewed BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS seller_has_reviewed BOOLEAN DEFAULT FALSE;

-- Update reviews table to include transaction reference
ALTER TABLE IF EXISTS public.reviews
ADD COLUMN IF NOT EXISTS purchase_id UUID REFERENCES public.purchase_history(id) ON DELETE SET NULL,
ADD COLUMN IF NOT EXISTS is_buyer_review BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS is_seller_review BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS completed_transaction BOOLEAN DEFAULT TRUE;

-- Drop the existing unique constraint if it exists
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM pg_constraint 
    WHERE conname = 'unique_review_per_seller_reviewer' 
    AND pg_class.oid = (SELECT oid FROM pg_class WHERE relname = 'reviews')
    AND conrelid = (SELECT oid FROM pg_class WHERE relname = 'reviews')
  ) THEN
    ALTER TABLE public.reviews DROP CONSTRAINT unique_review_per_seller_reviewer;
  END IF;
EXCEPTION
  WHEN undefined_table THEN
    -- Table doesn't exist yet, which is fine
    NULL;
END
$$;

-- Add a new unique constraint that includes the purchase_id
ALTER TABLE IF EXISTS public.reviews
ADD CONSTRAINT unique_review_per_transaction_type 
UNIQUE (purchase_id, is_buyer_review, is_seller_review);

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

-- Create function to check if user can review a transaction
CREATE OR REPLACE FUNCTION can_review_transaction(
  p_user_id UUID,
  p_purchase_id UUID,
  p_is_buyer_review BOOLEAN
)
RETURNS BOOLEAN AS $$
DECLARE
  v_can_review BOOLEAN;
  v_buyer_id UUID;
  v_seller_id UUID;
  v_buyer_has_reviewed BOOLEAN;
  v_seller_has_reviewed BOOLEAN;
BEGIN
  -- Get purchase info
  SELECT 
    buyer_id, 
    seller_id, 
    buyer_has_reviewed, 
    seller_has_reviewed
  INTO 
    v_buyer_id, 
    v_seller_id, 
    v_buyer_has_reviewed, 
    v_seller_has_reviewed
  FROM public.purchase_history
  WHERE id = p_purchase_id;
  
  -- Check if user is part of the transaction
  IF p_is_buyer_review AND p_user_id = v_buyer_id AND NOT v_buyer_has_reviewed THEN
    v_can_review := TRUE;
  ELSIF NOT p_is_buyer_review AND p_user_id = v_seller_id AND NOT v_seller_has_reviewed THEN
    v_can_review := TRUE;
  ELSE
    v_can_review := FALSE;
  END IF;
  
  RETURN v_can_review;
END;
$$ LANGUAGE plpgsql;

-- Update RLS policies for reviews
ALTER TABLE public.reviews ENABLE ROW LEVEL SECURITY;

-- Allow users to insert their own reviews
CREATE POLICY "Users can insert their own reviews"
  ON public.reviews
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = reviewer_id);

-- Allow users to view reviews
CREATE POLICY "Users can view reviews"
  ON public.reviews
  FOR SELECT
  USING (true);

-- Allow users to update their own reviews
CREATE POLICY "Users can update their own reviews"
  ON public.reviews
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = reviewer_id);

-- Allow users to delete their own reviews
CREATE POLICY "Users can delete their own reviews"
  ON public.reviews
  FOR DELETE
  TO authenticated
  USING (auth.uid() = reviewer_id);

-- Create function to update profile rating when a review is submitted
CREATE OR REPLACE FUNCTION update_profile_rating()
RETURNS TRIGGER AS $$
DECLARE
  v_avg_rating FLOAT;
  v_review_count INTEGER;
BEGIN
  -- Calculate average rating for the seller
  SELECT AVG(rating)::FLOAT, COUNT(*)
  INTO v_avg_rating, v_review_count
  FROM public.reviews
  WHERE seller_id = NEW.seller_id;
  
  -- Update the seller's profile with new rating data
  UPDATE public.profiles
  SET 
    avg_rating = COALESCE(v_avg_rating, 0),
    review_count = COALESCE(v_review_count, 0),
    updated_at = NOW()
  WHERE id = NEW.seller_id;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger to update profile rating when review is submitted
DROP TRIGGER IF EXISTS update_profile_rating_trigger ON public.reviews;
CREATE TRIGGER update_profile_rating_trigger
AFTER INSERT OR UPDATE ON public.reviews
FOR EACH ROW
EXECUTE FUNCTION update_profile_rating();

-- Ensure profiles table has required columns
DO $$
BEGIN
  -- Add avg_rating column if it doesn't exist
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'profiles' 
    AND column_name = 'avg_rating'
  ) THEN
    ALTER TABLE public.profiles ADD COLUMN avg_rating FLOAT DEFAULT 0;
  END IF;
  
  -- Add review_count column if it doesn't exist
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'profiles' 
    AND column_name = 'review_count'
  ) THEN
    ALTER TABLE public.profiles ADD COLUMN review_count INTEGER DEFAULT 0;
  END IF;
END
$$;

-- Update all profiles with current ratings (recalculate for all users)
DO $$
DECLARE
  r RECORD;
BEGIN
  FOR r IN SELECT DISTINCT seller_id FROM public.reviews LOOP
    UPDATE public.profiles p
    SET 
      avg_rating = (SELECT COALESCE(AVG(rating)::FLOAT, 0) FROM public.reviews WHERE seller_id = r.seller_id),
      review_count = (SELECT COUNT(*) FROM public.reviews WHERE seller_id = r.seller_id)
    WHERE p.id = r.seller_id;
  END LOOP;
END
$$; 