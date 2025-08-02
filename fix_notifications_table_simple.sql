-- Add sender_id column to notifications table
ALTER TABLE public.notifications 
ADD COLUMN IF NOT EXISTS sender_id UUID REFERENCES auth.users(id) ON DELETE SET NULL; 