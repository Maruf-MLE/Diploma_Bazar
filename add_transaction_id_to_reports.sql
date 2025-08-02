-- Add transaction_id column to reports table
ALTER TABLE public.reports ADD COLUMN IF NOT EXISTS transaction_id UUID REFERENCES public.purchase_history(id);

-- Create index on transaction_id for faster lookups
CREATE INDEX IF NOT EXISTS reports_transaction_id_idx ON public.reports(transaction_id);

-- Create a unique constraint to prevent multiple reports for the same transaction from the same reporter
-- First drop the constraint if it exists
ALTER TABLE public.reports DROP CONSTRAINT IF EXISTS unique_reporter_transaction;

-- Use a partial index instead of a constraint with WHERE clause
DROP INDEX IF EXISTS unique_reporter_transaction_idx;
CREATE UNIQUE INDEX unique_reporter_transaction_idx ON public.reports(reporter_id, transaction_id) 
WHERE transaction_id IS NOT NULL; 