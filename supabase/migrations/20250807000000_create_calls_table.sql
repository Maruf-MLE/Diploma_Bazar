-- Create a calls table for video/audio calls
CREATE TABLE IF NOT EXISTS public.calls (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  caller_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  receiver_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  start_time TIMESTAMPTZ,
  end_time TIMESTAMPTZ,
  status TEXT NOT NULL CHECK (status IN ('initiated', 'ringing', 'connected', 'missed', 'rejected', 'ended', 'failed')),
  call_type TEXT NOT NULL CHECK (call_type IN ('audio', 'video')),
  signaling_data JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Add an index for faster queries
CREATE INDEX calls_participants_idx ON public.calls (caller_id, receiver_id);

-- Add RLS policies
ALTER TABLE public.calls ENABLE ROW LEVEL SECURITY;

-- Both caller and receiver can view their calls
CREATE POLICY "Users can view their own calls" 
  ON public.calls
  FOR SELECT 
  USING (auth.uid() = caller_id OR auth.uid() = receiver_id);

-- Only authenticated users can create calls they're initiating
CREATE POLICY "Users can create their own calls" 
  ON public.calls
  FOR INSERT
  WITH CHECK (auth.uid() = caller_id);

-- Both caller and receiver can update call status
CREATE POLICY "Users can update their own calls" 
  ON public.calls
  FOR UPDATE
  USING (auth.uid() = caller_id OR auth.uid() = receiver_id);

-- Create updated_at trigger for the calls table
CREATE TRIGGER calls_updated_at
  BEFORE UPDATE ON public.calls
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_updated_at(); 