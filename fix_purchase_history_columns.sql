-- Fix purchase_history table by adding review tracking columns
-- Add buyer_has_reviewed and seller_has_reviewed columns if they don't exist
ALTER TABLE IF EXISTS public.purchase_history
ADD COLUMN IF NOT EXISTS buyer_has_reviewed BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS seller_has_reviewed BOOLEAN DEFAULT FALSE;

-- Update the purchase_history table based on existing reviews
-- Set buyer_has_reviewed to true for purchases where buyer has already reviewed
UPDATE public.purchase_history ph
SET buyer_has_reviewed = TRUE
FROM public.reviews r
WHERE r.purchase_id = ph.id AND r.is_buyer_review = TRUE;

-- Set seller_has_reviewed to true for purchases where seller has already reviewed
UPDATE public.purchase_history ph
SET seller_has_reviewed = TRUE
FROM public.reviews r
WHERE r.purchase_id = ph.id AND r.is_seller_review = TRUE;

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