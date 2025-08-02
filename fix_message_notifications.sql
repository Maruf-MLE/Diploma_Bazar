-- Add status column to messages table if it doesn't exist
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 
    FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'messages' 
    AND column_name = 'status'
  ) THEN
    ALTER TABLE public.messages 
    ADD COLUMN status character varying(50) DEFAULT 'sent';
  END IF;
END
$$;

-- Create index for faster status-based queries
CREATE INDEX IF NOT EXISTS idx_messages_status ON public.messages(status);

-- Option 1: Create the notifications table if it doesn't exist
CREATE TABLE IF NOT EXISTS public.notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  sender_id UUID NULL,
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  type TEXT NOT NULL,
  related_id UUID NULL,
  is_read BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()),
  updated_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now())
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_notifications_user_id ON public.notifications(user_id);
CREATE INDEX IF NOT EXISTS idx_notifications_is_read ON public.notifications(is_read);

-- Option 2: If you prefer to disable the trigger instead of creating the table
-- Uncomment the line below to disable the trigger
-- DROP TRIGGER IF EXISTS trigger_create_message_notification ON public.messages;

-- Option 3: Create the function if it doesn't exist
CREATE OR REPLACE FUNCTION create_message_notification()
RETURNS TRIGGER AS $$
BEGIN
  -- Check if notifications table exists before trying to insert
  IF EXISTS (
    SELECT FROM pg_tables
    WHERE schemaname = 'public'
    AND tablename = 'notifications'
  ) THEN
    -- Insert notification only if notifications table exists
    INSERT INTO public.notifications (
      user_id,
      sender_id,
      title,
      message,
      type,
      related_id
    )
    VALUES (
      NEW.receiver_id,
      NEW.sender_id,
      'New message',
      substring(NEW.content, 1, 50) || CASE WHEN length(NEW.content) > 50 THEN '...' ELSE '' END,
      'new_message',
      NEW.id
    );
  END IF;
  
  RETURN NEW;
EXCEPTION
  WHEN OTHERS THEN
    -- If any error occurs, just continue without creating notification
    RETURN NEW;
END;
$$ LANGUAGE plpgsql; 