-- Create push_subscriptions table for storing user push notification subscriptions
-- This table stores the push subscription keys needed for web push notifications

CREATE TABLE IF NOT EXISTS public.push_subscriptions (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  endpoint text NOT NULL,
  auth_key text NOT NULL,
  p256dh_key text NOT NULL,
  created_at timestamp with time zone DEFAULT timezone('utc'::text, now()),
  updated_at timestamp with time zone DEFAULT timezone('utc'::text, now()),
  is_active boolean DEFAULT true,
  device_info jsonb DEFAULT '{}',
  CONSTRAINT push_subscriptions_pkey PRIMARY KEY (id),
  CONSTRAINT fk_push_subscriptions_user_id FOREIGN KEY (user_id) REFERENCES profiles (id) ON DELETE CASCADE
) TABLESPACE pg_default;

-- Create unique index to prevent duplicate subscriptions per user
CREATE UNIQUE INDEX IF NOT EXISTS idx_push_subscriptions_user_endpoint 
ON public.push_subscriptions USING btree (user_id, endpoint) 
TABLESPACE pg_default;

-- Create index for user_id for faster queries
CREATE INDEX IF NOT EXISTS idx_push_subscriptions_user_id 
ON public.push_subscriptions USING btree (user_id) 
TABLESPACE pg_default;

-- Create index for active subscriptions
CREATE INDEX IF NOT EXISTS idx_push_subscriptions_active 
ON public.push_subscriptions USING btree (is_active) 
TABLESPACE pg_default;

-- Enable Row Level Security
ALTER TABLE public.push_subscriptions ENABLE ROW LEVEL SECURITY;

-- RLS Policies for push_subscriptions table

-- Policy 1: Users can view their own subscriptions
CREATE POLICY "Users can view their own push subscriptions" 
  ON public.push_subscriptions 
  FOR SELECT 
  USING (auth.uid() = user_id);

-- Policy 2: Users can insert their own subscriptions
CREATE POLICY "Users can insert their own push subscriptions" 
  ON public.push_subscriptions 
  FOR INSERT 
  WITH CHECK (auth.uid() = user_id);

-- Policy 3: Users can update their own subscriptions
CREATE POLICY "Users can update their own push subscriptions" 
  ON public.push_subscriptions 
  FOR UPDATE 
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Policy 4: Users can delete their own subscriptions
CREATE POLICY "Users can delete their own push subscriptions" 
  ON public.push_subscriptions 
  FOR DELETE 
  USING (auth.uid() = user_id);

-- Grant permissions to authenticated users
GRANT SELECT, INSERT, UPDATE, DELETE ON public.push_subscriptions TO authenticated;
GRANT USAGE ON SEQUENCE push_subscriptions_id_seq TO authenticated;

-- Create function to handle updated_at timestamp
CREATE OR REPLACE FUNCTION handle_push_subscriptions_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = timezone('utc'::text, now());
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for updated_at
CREATE TRIGGER handle_push_subscriptions_updated_at
  BEFORE UPDATE ON public.push_subscriptions
  FOR EACH ROW
  EXECUTE FUNCTION handle_push_subscriptions_updated_at();

-- Create function to get active subscriptions for a user
CREATE OR REPLACE FUNCTION get_user_push_subscriptions(target_user_id uuid)
RETURNS TABLE (
  id uuid,
  endpoint text,
  auth_key text,
  p256dh_key text,
  device_info jsonb
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
    ps.device_info
  FROM public.push_subscriptions ps
  WHERE ps.user_id = target_user_id 
    AND ps.is_active = true;
END;
$$ LANGUAGE plpgsql;

-- Grant execute permission on the function
GRANT EXECUTE ON FUNCTION get_user_push_subscriptions(uuid) TO authenticated;

COMMENT ON TABLE public.push_subscriptions IS 'Stores push notification subscriptions for users';
COMMENT ON COLUMN public.push_subscriptions.endpoint IS 'Push service endpoint URL';
COMMENT ON COLUMN public.push_subscriptions.auth_key IS 'Authentication key for push subscription';
COMMENT ON COLUMN public.push_subscriptions.p256dh_key IS 'P256DH public key for push subscription';
COMMENT ON COLUMN public.push_subscriptions.device_info IS 'Optional device information in JSON format';
