-- Script to make the content column nullable in the messages table
-- This allows sending image-only messages without text content

BEGIN;

-- Attempt to alter the content column to be nullable
ALTER TABLE public.messages
ALTER COLUMN content DROP NOT NULL;

-- Add a comment explaining the change
COMMENT ON COLUMN public.messages.content IS 'Message text content. Can be NULL for image-only messages';

-- Ensure message_type has the correct default
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 
    FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'messages' 
    AND column_name = 'message_type'
  ) THEN
    ALTER TABLE public.messages 
    ALTER COLUMN message_type SET DEFAULT 'text';
  END IF;
END
$$;

COMMIT; 