-- Check if sender_id column exists in the notifications table and add it if it doesn't
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 
    FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'notifications' 
    AND column_name = 'sender_id'
  ) THEN
    ALTER TABLE public.notifications 
    ADD COLUMN sender_id UUID REFERENCES auth.users(id) ON DELETE SET NULL;
  END IF;
END
$$; 