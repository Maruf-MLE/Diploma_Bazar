-- Manual RLS policy fix for notifications table
-- Run this in your Supabase SQL editor

-- Enable RLS
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;

-- Drop existing policies
DROP POLICY IF EXISTS "Allow users to view their own notifications" ON public.notifications;
DROP POLICY IF EXISTS "Allow users to update their own notifications" ON public.notifications;
DROP POLICY IF EXISTS "Allow authenticated users to create notifications" ON public.notifications;
DROP POLICY IF EXISTS "Allow users to delete their own notifications" ON public.notifications;

-- Create new policies
CREATE POLICY "Allow users to view their own notifications" 
  ON public.notifications 
  FOR SELECT 
  USING (auth.uid() = user_id);

CREATE POLICY "Allow users to update their own notifications" 
  ON public.notifications 
  FOR UPDATE 
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Allow authenticated users to create notifications" 
  ON public.notifications 
  FOR INSERT 
  WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "Allow users to delete their own notifications" 
  ON public.notifications 
  FOR DELETE 
  USING (auth.uid() = user_id);

-- Grant permissions
GRANT SELECT ON public.notifications TO authenticated;
GRANT INSERT ON public.notifications TO authenticated;
GRANT UPDATE ON public.notifications TO authenticated;
GRANT DELETE ON public.notifications TO authenticated;
