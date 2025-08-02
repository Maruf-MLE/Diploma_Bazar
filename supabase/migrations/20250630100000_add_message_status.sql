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
CREATE INDEX IF NOT EXISTS idx_messages_status ON messages(receiver_id, status) WHERE status != 'read';

-- Create function to update message status
CREATE OR REPLACE FUNCTION update_message_status()
RETURNS TRIGGER AS $$
BEGIN
    -- Update message status
    IF NEW.status = 'delivered' OR NEW.status = 'read' THEN
        IF OLD.status = 'sent' THEN
            NEW.updated_at = NOW();
            RETURN NEW;
        END IF;
    END IF;
    
    IF NEW.status = 'read' THEN
        IF OLD.status = 'delivered' OR OLD.status = 'sent' THEN
            NEW.updated_at = NOW();
            RETURN NEW;
        END IF;
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for updating message status
CREATE TRIGGER trigger_update_message_status
BEFORE UPDATE ON messages
FOR EACH ROW
EXECUTE FUNCTION update_message_status(); 