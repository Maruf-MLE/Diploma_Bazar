-- Fix relationships for purchase_requests table
-- This migration properly sets up foreign key relationships for purchase requests

-- Add proper foreign key constraint for books
ALTER TABLE public.purchase_requests
  DROP CONSTRAINT IF EXISTS purchase_requests_book_id_fkey,
  ADD CONSTRAINT purchase_requests_book_id_fkey
  FOREIGN KEY (book_id) REFERENCES public.books(id)
  ON DELETE CASCADE;

-- Add proper foreign key constraint for buyer_id
ALTER TABLE public.purchase_requests
  DROP CONSTRAINT IF EXISTS purchase_requests_buyer_id_fkey,
  ADD CONSTRAINT purchase_requests_buyer_id_fkey
  FOREIGN KEY (buyer_id) REFERENCES auth.users(id)
  ON DELETE CASCADE;

-- Add proper foreign key constraint for seller_id
ALTER TABLE public.purchase_requests
  DROP CONSTRAINT IF EXISTS purchase_requests_seller_id_fkey,
  ADD CONSTRAINT purchase_requests_seller_id_fkey
  FOREIGN KEY (seller_id) REFERENCES auth.users(id)
  ON DELETE CASCADE;

-- Create a view that joins purchase requests with user and book data
-- This makes it easier to query purchase requests with related data
CREATE OR REPLACE VIEW public.purchase_requests_with_details AS
SELECT
  pr.id,
  pr.book_id,
  pr.buyer_id, 
  pr.seller_id,
  pr.meetup_date,
  pr.meetup_location,
  pr.proposed_price,
  pr.message,
  pr.status,
  pr.created_at,
  b.title AS book_title,
  b.author AS book_author,
  b.price AS original_price,
  b.cover_image_url AS book_cover,
  buyer_profile.name AS buyer_name,
  seller_profile.name AS seller_name
FROM public.purchase_requests pr
JOIN public.books b ON pr.book_id = b.id
LEFT JOIN public.profiles buyer_profile ON pr.buyer_id = buyer_profile.id
LEFT JOIN public.profiles seller_profile ON pr.seller_id = seller_profile.id;

-- Grant permissions for the new view
GRANT SELECT ON public.purchase_requests_with_details TO authenticated;
GRANT SELECT ON public.purchase_requests_with_details TO anon;
GRANT SELECT ON public.purchase_requests_with_details TO service_role; 