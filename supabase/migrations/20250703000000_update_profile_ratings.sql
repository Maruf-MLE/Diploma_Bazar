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
AFTER INSERT OR UPDATE OR DELETE ON public.reviews
FOR EACH ROW
EXECUTE FUNCTION update_profile_rating();

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