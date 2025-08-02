-- Create reviews table if it doesn't exist
CREATE TABLE IF NOT EXISTS public.reviews (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  seller_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  reviewer_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  rating INTEGER NOT NULL CHECK (rating BETWEEN 1 AND 5),
  comment TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- Enable RLS on reviews table
ALTER TABLE public.reviews ENABLE ROW LEVEL SECURITY;

-- Create basic RLS policies for reviews
CREATE POLICY "Anyone can read reviews"
  ON public.reviews
  FOR SELECT
  USING (true);

CREATE POLICY "Users can create their own reviews"
  ON public.reviews
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = reviewer_id);

CREATE POLICY "Users can update their own reviews"
  ON public.reviews
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = reviewer_id);

CREATE POLICY "Users can delete their own reviews"
  ON public.reviews
  FOR DELETE
  TO authenticated
  USING (auth.uid() = reviewer_id);

-- Create function to calculate average rating
CREATE OR REPLACE FUNCTION get_user_rating(user_id UUID)
RETURNS FLOAT AS $$
DECLARE
  avg_rating FLOAT;
BEGIN
  SELECT AVG(rating)::FLOAT INTO avg_rating
  FROM public.reviews
  WHERE seller_id = user_id;
  
  RETURN COALESCE(avg_rating, 0);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create function to count total reviews
CREATE OR REPLACE FUNCTION get_user_review_count(user_id UUID)
RETURNS INTEGER AS $$
DECLARE
  review_count INTEGER;
BEGIN
  SELECT COUNT(*) INTO review_count
  FROM public.reviews
  WHERE seller_id = user_id;
  
  RETURN COALESCE(review_count, 0);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create reports table
CREATE TABLE IF NOT EXISTS public.reports (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  reported_user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  reporter_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  reason TEXT NOT NULL,
  details TEXT,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'resolved', 'dismissed')),
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  CONSTRAINT unique_report_per_user UNIQUE (reported_user_id, reporter_id)
);

-- Enable RLS
ALTER TABLE public.reports ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Only admins can read reports" ON public.reports
  FOR SELECT USING (auth.uid() IN (SELECT id FROM auth.users WHERE auth.uid() = id AND is_admin = true));

CREATE POLICY "Users can create reports" ON public.reports
  FOR INSERT TO authenticated USING (auth.uid() = reporter_id);

-- Grant permissions
GRANT SELECT, INSERT ON public.reviews TO authenticated;
GRANT SELECT, INSERT ON public.reports TO authenticated; 