const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

// Initialize Supabase client
const supabaseUrl = process.env.SUPABASE_URL || 'https://yryerjgidsyfiohmpeoc.supabase.co';
const supabaseKey = process.env.SUPABASE_SERVICE_KEY || process.env.SUPABASE_ANON_KEY;

if (!supabaseKey) {
  console.error('Missing Supabase key. Please provide SUPABASE_SERVICE_KEY or SUPABASE_ANON_KEY in .env file');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function fixPurchaseRequestRelations() {
  console.log('Starting database relation fixes...');

  try {
    // Fix book_id relationship
    console.log('1. Fixing book_id relationship...');
    const { error: bookRelationError } = await supabase.rpc('exec_sql', { 
      sql: `
        ALTER TABLE public.purchase_requests
        DROP CONSTRAINT IF EXISTS purchase_requests_book_id_fkey,
        ADD CONSTRAINT purchase_requests_book_id_fkey
        FOREIGN KEY (book_id) REFERENCES public.books(id)
        ON DELETE CASCADE;
      `
    });
    
    if (bookRelationError) {
      throw new Error(`Error fixing book relationship: ${bookRelationError.message}`);
    }
    
    // Fix buyer_id relationship
    console.log('2. Fixing buyer_id relationship...');
    const { error: buyerRelationError } = await supabase.rpc('exec_sql', { 
      sql: `
        ALTER TABLE public.purchase_requests
        DROP CONSTRAINT IF EXISTS purchase_requests_buyer_id_fkey,
        ADD CONSTRAINT purchase_requests_buyer_id_fkey
        FOREIGN KEY (buyer_id) REFERENCES auth.users(id)
        ON DELETE CASCADE;
      `
    });
    
    if (buyerRelationError) {
      throw new Error(`Error fixing buyer relationship: ${buyerRelationError.message}`);
    }

    // Fix seller_id relationship
    console.log('3. Fixing seller_id relationship...');
    const { error: sellerRelationError } = await supabase.rpc('exec_sql', { 
      sql: `
        ALTER TABLE public.purchase_requests
        DROP CONSTRAINT IF EXISTS purchase_requests_seller_id_fkey,
        ADD CONSTRAINT purchase_requests_seller_id_fkey
        FOREIGN KEY (seller_id) REFERENCES auth.users(id)
        ON DELETE CASCADE;
      `
    });
    
    if (sellerRelationError) {
      throw new Error(`Error fixing seller relationship: ${sellerRelationError.message}`);
    }

    // Create the view
    console.log('4. Creating purchase_requests_with_details view...');
    const { error: viewError } = await supabase.rpc('exec_sql', { 
      sql: `
        CREATE OR REPLACE VIEW public.purchase_requests_with_details AS
        SELECT
          pr.id,
          pr.book_id,
          pr.buyer_id, 
          pr.seller_id,
          pr.meetup_date,
          pr.meetup_location,
          pr.proposed_price,
          pr.message,
          pr.status,
          pr.created_at,
          b.title AS book_title,
          b.author AS book_author,
          b.price AS original_price,
          b.cover_image_url AS book_cover,
          buyer_profile.name AS buyer_name,
          seller_profile.name AS seller_name
        FROM public.purchase_requests pr
        JOIN public.books b ON pr.book_id = b.id
        LEFT JOIN public.profiles buyer_profile ON pr.buyer_id = buyer_profile.id
        LEFT JOIN public.profiles seller_profile ON pr.seller_id = seller_profile.id;
        
        GRANT SELECT ON public.purchase_requests_with_details TO authenticated;
        GRANT SELECT ON public.purchase_requests_with_details TO anon;
        GRANT SELECT ON public.purchase_requests_with_details TO service_role;
      `
    });
    
    if (viewError) {
      throw new Error(`Error creating view: ${viewError.message}`);
    }

    console.log('✅ All database relations fixed successfully!');
  } catch (error) {
    console.error('❌ Error fixing database relations:', error.message);
    console.error(error);
  }
}

// Run the function
fixPurchaseRequestRelations(); 