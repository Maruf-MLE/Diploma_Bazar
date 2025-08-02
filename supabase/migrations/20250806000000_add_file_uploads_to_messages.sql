-- Add file columns to messages table if they don't exist
DO $$
BEGIN
  -- Add file_url column
  IF NOT EXISTS (
    SELECT 1 
    FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'messages' 
    AND column_name = 'file_url'
  ) THEN
    ALTER TABLE public.messages 
    ADD COLUMN file_url TEXT;
  END IF;

  -- Add file_type column
  IF NOT EXISTS (
    SELECT 1 
    FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'messages' 
    AND column_name = 'file_type'
  ) THEN
    ALTER TABLE public.messages 
    ADD COLUMN file_type TEXT;
  END IF;

  -- Add file_name column
  IF NOT EXISTS (
    SELECT 1 
    FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'messages' 
    AND column_name = 'file_name'
  ) THEN
    ALTER TABLE public.messages 
    ADD COLUMN file_name TEXT;
  END IF;
END
$$;

-- Create a function to check and create storage buckets
CREATE OR REPLACE FUNCTION create_messages_bucket()
RETURNS void AS $$
DECLARE
    bucket_exists boolean;
BEGIN
    -- Check if the storage schema exists
    IF EXISTS (SELECT 1 FROM pg_namespace WHERE nspname = 'storage') THEN
        -- Check if the messages bucket exists
        SELECT EXISTS(
            SELECT 1 FROM storage.buckets WHERE id = 'messages'
        ) INTO bucket_exists;
        
        -- Create the messages bucket if it doesn't exist
        IF NOT bucket_exists THEN
            INSERT INTO storage.buckets (id, name)
            VALUES ('messages', 'messages');
            RAISE NOTICE 'Created messages bucket';
        ELSE
            RAISE NOTICE 'Messages bucket already exists';
        END IF;
    ELSE
        RAISE NOTICE 'Storage extension is not installed';
    END IF;
    
    -- Create storage policies regardless
    BEGIN
        -- Create policy for authenticated users to upload files
        INSERT INTO storage.policies (name, object, definition)
        VALUES ('allow_authenticated_uploads', 'buckets', 
                '{"name":"allow_authenticated_uploads","definition":{"roles":["authenticated"],"id":"messages","action":"INSERT","check":{"id":"eq.messages"}}}')
        ON CONFLICT DO NOTHING;
        
        -- Create policy for authenticated users to download files
        INSERT INTO storage.policies (name, object, definition)
        VALUES ('allow_authenticated_downloads', 'objects', 
                '{"name":"allow_authenticated_downloads","definition":{"roles":["authenticated"],"id":"messages","action":"SELECT","check":{"bucket_id":"eq.messages"}}}')
        ON CONFLICT DO NOTHING;
        
        RAISE NOTICE 'Created storage policies';
    EXCEPTION WHEN OTHERS THEN
        RAISE NOTICE 'Error creating storage policies: %', SQLERRM;
    END;
END;
$$ LANGUAGE plpgsql;

-- Execute the function to create the bucket
SELECT create_messages_bucket(); 