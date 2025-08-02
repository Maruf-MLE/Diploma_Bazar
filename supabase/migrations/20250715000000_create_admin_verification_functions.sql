-- Create function to approve verification
-- This function will be used by admins to approve verification
-- It will bypass RLS policies

-- Create function to approve verification
CREATE OR REPLACE FUNCTION public.approve_verification(verification_id UUID)
RETURNS BOOLEAN AS $$
DECLARE
  v_user_id UUID;
BEGIN
  -- Get the user_id from verification_data
  SELECT user_id INTO v_user_id
  FROM public.verification_data
  WHERE id = verification_id;
  
  -- Update verification_data
  UPDATE public.verification_data
  SET is_verified = TRUE
  WHERE id = verification_id;
  
  -- Update face_verification if it exists
  UPDATE public.face_verification
  SET is_verified = TRUE, status = 'approved'
  WHERE user_id = v_user_id;
  
  -- Create notification for the user
  INSERT INTO public.notifications (
    user_id,
    title,
    message,
    type,
    related_id
  ) VALUES (
    v_user_id,
    'ভেরিফিকেশন অনুমোদিত',
    'আপনার ভেরিফিকেশন অনুমোদিত হয়েছে। এখন আপনি সম্পূর্ণ ফিচার ব্যবহার করতে পারবেন।',
    'verification_approved',
    verification_id
  );
  
  RETURN TRUE;
EXCEPTION
  WHEN OTHERS THEN
    RAISE EXCEPTION 'Error approving verification: %', SQLERRM;
    RETURN FALSE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant execute permission to authenticated users
GRANT EXECUTE ON FUNCTION public.approve_verification TO authenticated;

-- Create function to reject verification
CREATE OR REPLACE FUNCTION public.reject_verification(verification_id UUID, feedback_text TEXT)
RETURNS BOOLEAN AS $$
DECLARE
  v_user_id UUID;
BEGIN
  -- Get the user_id from verification_data
  SELECT user_id INTO v_user_id
  FROM public.verification_data
  WHERE id = verification_id;
  
  -- Update verification_data
  UPDATE public.verification_data
  SET is_verified = FALSE
  WHERE id = verification_id;
  
  -- Update face_verification if it exists
  UPDATE public.face_verification
  SET is_verified = FALSE, status = 'rejected', feedback = feedback_text
  WHERE user_id = v_user_id;
  
  -- Create notification for the user
  INSERT INTO public.notifications (
    user_id,
    title,
    message,
    type,
    related_id
  ) VALUES (
    v_user_id,
    'ভেরিফিকেশন বাতিল',
    'আপনার ভেরিফিকেশন বাতিল করা হয়েছে। কারণ: ' || COALESCE(feedback_text, 'আপনার ভেরিফিকেশন তথ্য সঠিক নয়।'),
    'verification_rejected',
    verification_id
  );
  
  RETURN TRUE;
EXCEPTION
  WHEN OTHERS THEN
    RAISE EXCEPTION 'Error rejecting verification: %', SQLERRM;
    RETURN FALSE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant execute permission to authenticated users
GRANT EXECUTE ON FUNCTION public.reject_verification TO authenticated; 