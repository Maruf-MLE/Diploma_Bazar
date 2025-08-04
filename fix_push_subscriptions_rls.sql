-- Fix Push Subscriptions Table RLS Policies
-- Copy and paste this into Supabase Dashboard -> SQL Editor

-- Step 1: Drop existing policies if they exist
DROP POLICY IF EXISTS "Users can view their own push subscriptions" ON public.push_subscriptions;
DROP POLICY IF EXISTS "Users can insert their own push subscriptions" ON public.push_subscriptions;
DROP POLICY IF EXISTS "Users can update their own push subscriptions" ON public.push_subscriptions;
DROP POLICY IF EXISTS "Users can delete their own push subscriptions" ON public.push_subscriptions;

-- Step 2: Ensure RLS is enabled
ALTER TABLE public.push_subscriptions ENABLE ROW LEVEL SECURITY;

-- Step 3: Create new RLS policies
-- Policy 1: Users can view their own subscriptions
CREATE POLICY "Enable read access for users based on user_id"
  ON public.push_subscriptions 
  FOR SELECT 
  USING (auth.uid() = user_id);

-- Policy 2: Users can insert their own subscriptions
CREATE POLICY "Enable insert for authenticated users based on user_id"
  ON public.push_subscriptions 
  FOR INSERT 
  WITH CHECK (auth.uid() = user_id);

-- Policy 3: Users can update their own subscriptions
CREATE POLICY "Enable update for users based on user_id"
  ON public.push_subscriptions 
  FOR UPDATE 
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Policy 4: Users can delete their own subscriptions
CREATE POLICY "Enable delete for users based on user_id"
  ON public.push_subscriptions 
  FOR DELETE 
  USING (auth.uid() = user_id);

-- Step 4: Grant necessary permissions
GRANT ALL ON public.push_subscriptions TO authenticated;
GRANT ALL ON public.push_subscriptions TO anon;

-- Step 5: Grant sequence permissions (if sequence exists)
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_sequences WHERE schemaname = 'public' AND sequencename = 'push_subscriptions_id_seq') THEN
    GRANT USAGE ON SEQUENCE public.push_subscriptions_id_seq TO authenticated;
    GRANT USAGE ON SEQUENCE public.push_subscriptions_id_seq TO anon;
  END IF;
END
$$;

-- Step 6: Create or update trigger function for updated_at
CREATE OR REPLACE FUNCTION public.handle_push_subscriptions_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = timezone('utc'::text, now());
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Step 7: Create trigger if it doesn't exist
DROP TRIGGER IF EXISTS handle_push_subscriptions_updated_at ON public.push_subscriptions;
CREATE TRIGGER handle_push_subscriptions_updated_at
  BEFORE UPDATE ON public.push_subscriptions
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_push_subscriptions_updated_at();

-- Step 8: Drop old function first
DROP FUNCTION IF EXISTS public.get_user_push_subscriptions(uuid);

-- Step 9: Create function to get user subscriptions (for push server)
CREATE OR REPLACE FUNCTION public.get_user_push_subscriptions(target_user_id uuid)
RETURNS TABLE (
  id uuid,
  endpoint text,
  auth_key text,
  p256dh_key text,
  device_info jsonb,
  created_at timestamp with time zone
) 
SECURITY DEFINER
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    ps.id,
    ps.endpoint,
    ps.auth_key,
    ps.p256dh_key,
    ps.device_info,
    ps.created_at
  FROM public.push_subscriptions ps
  WHERE ps.user_id = target_user_id 
    AND ps.is_active = true
  ORDER BY ps.created_at DESC;
END;
$$ LANGUAGE plpgsql;

-- Grant execute permissions on the function
GRANT EXECUTE ON FUNCTION public.get_user_push_subscriptions(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_user_push_subscriptions(uuid) TO anon;

-- Step 10: Add comments for documentation
COMMENT ON TABLE public.push_subscriptions IS 'Stores push notification subscriptions for users';
COMMENT ON COLUMN public.push_subscriptions.endpoint IS 'Push service endpoint URL';
COMMENT ON COLUMN public.push_subscriptions.auth_key IS 'Authentication key for push subscription (base64 encoded)';
COMMENT ON COLUMN public.push_subscriptions.p256dh_key IS 'P256DH public key for push subscription (base64 encoded)';
COMMENT ON COLUMN public.push_subscriptions.device_info IS 'Optional device information in JSON format';

-- Test the setup with a simple query
SELECT 'Push subscriptions table setup completed successfully!' as status;
