-- Function to reject a purchase request
-- This function will be called from the client to reject a purchase request
-- It handles the security checks and updates the purchase_request status

CREATE OR REPLACE FUNCTION public.reject_purchase_request(request_id UUID)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_seller_id UUID;
  v_book_id UUID;
  v_auth_user_id UUID;
BEGIN
  -- Get the authenticated user ID
  v_auth_user_id := auth.uid();
  
  -- Check if the user is authenticated
  IF v_auth_user_id IS NULL THEN
    RAISE EXCEPTION 'Not authenticated';
  END IF;
  
  -- Get the seller_id from the purchase request
  SELECT seller_id, book_id INTO v_seller_id, v_book_id
  FROM public.purchase_requests
  WHERE id = request_id;
  
  -- Check if the authenticated user is the seller
  IF v_seller_id != v_auth_user_id THEN
    RAISE EXCEPTION 'You are not authorized to reject this request';
  END IF;
  
  -- Update the purchase request status to rejected
  UPDATE public.purchase_requests
  SET status = 'rejected'
  WHERE id = request_id;
  
  RETURN TRUE;
EXCEPTION
  WHEN OTHERS THEN
    RAISE;
END;
$$; 