// Script to fix purchase_history table columns
const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');

// Load environment variables if dotenv is available
try {
  require('dotenv').config();
} catch (err) {
  console.log('dotenv not installed, using environment variables');
}

// Supabase connection details - use direct key for simplicity
const supabaseUrl = 'https://yryerjgidsyfiohmpeoc.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InlyeWVyamdpZHN5ZmlvaG1wZW9jIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTA5NjA1NTIsImV4cCI6MjA2NjUzNjU1Mn0.S2ki-0QyFabstnVnTh9qFiHoz7sqBZgkfPThn77wTno';

// Create Supabase client
const supabase = createClient(supabaseUrl, supabaseKey);

async function executeSqlDirectly() {
  try {
    console.log('Executing SQL directly...');
    
    // Add columns to purchase_history
    const addColumnsQuery = `
      ALTER TABLE IF EXISTS public.purchase_history
      ADD COLUMN IF NOT EXISTS buyer_has_reviewed BOOLEAN DEFAULT FALSE,
      ADD COLUMN IF NOT EXISTS seller_has_reviewed BOOLEAN DEFAULT FALSE;
    `;
    
    console.log('Adding columns to purchase_history table...');
    const { error: columnsError } = await supabase.rpc('exec_sql', { query: addColumnsQuery });
    
    if (columnsError) {
      console.error('Error adding columns:', columnsError);
      return false;
    }
    
    console.log('Columns added successfully!');
    
    // Create trigger function
    const triggerFunctionQuery = `
      CREATE OR REPLACE FUNCTION public.update_purchase_review_status()
      RETURNS TRIGGER AS $$
      BEGIN
        IF NEW.purchase_id IS NOT NULL THEN
          IF NEW.is_buyer_review THEN
            UPDATE public.purchase_history
            SET buyer_has_reviewed = TRUE
            WHERE id = NEW.purchase_id;
          ELSIF NEW.is_seller_review THEN
            UPDATE public.purchase_history
            SET seller_has_reviewed = TRUE
            WHERE id = NEW.purchase_id;
          END IF;
        END IF;
        RETURN NEW;
      END;
      $$ LANGUAGE plpgsql;
    `;
    
    console.log('Creating trigger function...');
    const { error: functionError } = await supabase.rpc('exec_sql', { query: triggerFunctionQuery });
    
    if (functionError) {
      console.error('Error creating trigger function:', functionError);
      return false;
    }
    
    console.log('Trigger function created successfully!');
    
    // Create trigger
    const triggerQuery = `
      DROP TRIGGER IF EXISTS update_purchase_review_status_trigger ON public.reviews;
      CREATE TRIGGER update_purchase_review_status_trigger
      AFTER INSERT ON public.reviews
      FOR EACH ROW
      EXECUTE FUNCTION public.update_purchase_review_status();
    `;
    
    console.log('Creating trigger...');
    const { error: triggerError } = await supabase.rpc('exec_sql', { query: triggerQuery });
    
    if (triggerError) {
      console.error('Error creating trigger:', triggerError);
      return false;
    }
    
    console.log('Trigger created successfully!');
    
    // Update existing reviews
    const updateQuery = `
      -- Update buyer reviews
      UPDATE public.purchase_history ph
      SET buyer_has_reviewed = TRUE
      FROM public.reviews r
      WHERE r.purchase_id = ph.id AND r.is_buyer_review = TRUE;
      
      -- Update seller reviews
      UPDATE public.purchase_history ph
      SET seller_has_reviewed = TRUE
      FROM public.reviews r
      WHERE r.purchase_id = ph.id AND r.is_seller_review = TRUE;
    `;
    
    console.log('Updating existing reviews...');
    const { error: updateError } = await supabase.rpc('exec_sql', { query: updateQuery });
    
    if (updateError) {
      console.error('Error updating existing reviews:', updateError);
      return false;
    }
    
    console.log('Existing reviews updated successfully!');
    
    return true;
  } catch (error) {
    console.error('Error executing SQL directly:', error);
    return false;
  }
}

async function verifyColumns() {
  console.log('Verifying purchase_history columns...');
  
  try {
    // Check if buyer_has_reviewed and seller_has_reviewed columns exist
    const { data, error } = await supabase
      .from('purchase_history')
      .select('buyer_has_reviewed, seller_has_reviewed')
      .limit(1);
    
    if (error) {
      if (error.message.includes('does not exist')) {
        console.error('Column does not exist, fix was not successful');
        return false;
      }
      console.error('Error verifying columns:', error);
      return false;
    }
    
    console.log('Columns verified successfully!');
    return true;
  } catch (error) {
    console.error('Error verifying columns:', error);
    return false;
  }
}

async function main() {
  console.log('Starting fix for purchase_history table...');
  
  try {
    // Execute SQL directly
    const success = await executeSqlDirectly();
    
    if (success) {
      // Verify the columns were added
      const verified = await verifyColumns();
      
      if (verified) {
        console.log('Fix completed successfully!');
      } else {
        console.error('Fix may not have been applied correctly');
      }
    } else {
      console.error('Failed to apply fix');
    }
  } catch (error) {
    console.error('Error fixing purchase_history table:', error);
  }
}

main(); 