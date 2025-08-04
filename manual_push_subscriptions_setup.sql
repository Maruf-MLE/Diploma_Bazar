-- Manual Push Subscriptions Table Setup
-- Copy and paste this SQL into Supabase Dashboard -> SQL Editor

-- Step 1: Create the table
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
);

-- Step 2: Create indexes
CREATE UNIQUE INDEX IF NOT EXISTS idx_push_subscriptions_user_endpoint 
ON public.push_subscriptions USING btree (user_id, endpoint);

CREATE INDEX IF NOT EXISTS idx_push_subscriptions_user_id 
ON public.push_subscriptions USING btree (user_id);

CREATE INDEX IF NOT EXISTS idx_push_subscriptions_active 
ON public.push_subscriptions USING btree (is_active);

-- Step 3: Enable RLS
ALTER TABLE public.push_subscriptions ENABLE ROW LEVEL SECURITY;

-- Step 4: Create RLS Policies
CREATE POLICY "Users can view their own push subscriptions" 
  ON public.push_subscriptions 
  FOR SELECT 
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own push subscriptions" 
  ON public.push_subscriptions 
  FOR INSERT 
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own push subscriptions" 
  ON public.push_subscriptions 
  FOR UPDATE 
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete their own push subscriptions" 
  ON public.push_subscriptions 
  FOR DELETE 
  USING (auth.uid() = user_id);

-- Step 5: Grant permissions
GRANT SELECT, INSERT, UPDATE, DELETE ON public.push_subscriptions TO authenticated;

-- Step 6: Create updated_at function and trigger
CREATE OR REPLACE FUNCTION handle_push_subscriptions_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = timezone('utc'::text, now());
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER handle_push_subscriptions_updated_at
  BEFORE UPDATE ON public.push_subscriptions
  FOR EACH ROW
  EXECUTE FUNCTION handle_push_subscriptions_updated_at();

-- Step 7: Create function to get user subscriptions
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

GRANT EXECUTE ON FUNCTION get_user_push_subscriptions(uuid) TO authenticated;
