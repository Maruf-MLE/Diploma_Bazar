-- SQL স্ক্রিপ্ট: মেসেজ বাকেট এবং পলিসি সেটআপ
-- এই স্ক্রিপ্টটি সুপাবেস SQL এডিটরে রান করুন

-- মেসেজ বাকেট তৈরি করার ফাংশন
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
        VALUES (
            'allow_authenticated_uploads', 
            'objects', 
            jsonb_build_object(
                'name', 'allow_authenticated_uploads',
                'definition', jsonb_build_object(
                    'roles', ARRAY['authenticated'],
                    'bucket_id', 'messages',
                    'operation', 'INSERT',
                    'check', 'bucket_id = ''messages'''
                )
            )
        )
        ON CONFLICT (name, object) DO NOTHING;
        
        -- Create policy for authenticated users to download files
        INSERT INTO storage.policies (name, object, definition)
        VALUES (
            'allow_authenticated_downloads', 
            'objects', 
            jsonb_build_object(
                'name', 'allow_authenticated_downloads',
                'definition', jsonb_build_object(
                    'roles', ARRAY['authenticated'],
                    'bucket_id', 'messages',
                    'operation', 'SELECT',
                    'check', 'bucket_id = ''messages'''
                )
            )
        )
        ON CONFLICT (name, object) DO NOTHING;
        
        -- Create policy for authenticated users to update files
        INSERT INTO storage.policies (name, object, definition)
        VALUES (
            'allow_authenticated_updates', 
            'objects', 
            jsonb_build_object(
                'name', 'allow_authenticated_updates',
                'definition', jsonb_build_object(
                    'roles', ARRAY['authenticated'],
                    'bucket_id', 'messages',
                    'operation', 'UPDATE',
                    'check', 'bucket_id = ''messages'''
                )
            )
        )
        ON CONFLICT (name, object) DO NOTHING;
        
        -- Create policy for authenticated users to delete files
        INSERT INTO storage.policies (name, object, definition)
        VALUES (
            'allow_authenticated_deletes', 
            'objects', 
            jsonb_build_object(
                'name', 'allow_authenticated_deletes',
                'definition', jsonb_build_object(
                    'roles', ARRAY['authenticated'],
                    'bucket_id', 'messages',
                    'operation', 'DELETE',
                    'check', 'bucket_id = ''messages'''
                )
            )
        )
        ON CONFLICT (name, object) DO NOTHING;
        
        RAISE NOTICE 'Created storage policies';
    EXCEPTION WHEN OTHERS THEN
        RAISE NOTICE 'Error creating storage policies: %', SQLERRM;
    END;
END;
$$ LANGUAGE plpgsql;

-- ফাংশনটি রান করুন
SELECT create_messages_bucket();

-- ফোল্ডার স্ট্রাকচার তৈরি করার জন্য ডামি ফাইল তৈরি করুন
-- (এটি সুপাবেস ড্যাশবোর্ড থেকে ম্যানুয়ালি করতে হবে)
/*
1. সুপাবেস ড্যাশবোর্ডে যান
2. Storage সেকশনে যান
3. 'messages' বাকেট সিলেক্ট করুন
4. 'Create Folder' বাটনে ক্লিক করুন
5. 'message_images' নামে একটি ফোল্ডার তৈরি করুন
6. আবার 'Create Folder' বাটনে ক্লিক করুন
7. 'message_documents' নামে আরেকটি ফোল্ডার তৈরি করুন
*/ 