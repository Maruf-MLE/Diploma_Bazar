import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config({ path: '.env.production' });

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Missing Supabase environment variables');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

console.log('🔍 Checking Profiles Table Structure');
console.log('===================================');

async function checkProfilesStructure() {
  try {
    // Get profiles table structure by trying to select all columns
    console.log('\n📋 Step 1: Checking profiles table columns...');
    
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .limit(1);
    
    if (error) {
      console.error('❌ Profiles table access failed:', error);
      return;
    }
    
    if (data && data.length > 0) {
      console.log('✅ Profiles table accessible');
      console.log('🔍 Available columns:', Object.keys(data[0]));
    } else {
      console.log('⚠️ Profiles table is empty, but accessible');
      
      // Try to get table schema information
      const { data: schemaData, error: schemaError } = await supabase
        .rpc('get_table_info', { table_name: 'profiles' });
        
      if (!schemaError && schemaData) {
        console.log('📊 Table schema:', schemaData);
      }
    }
    
    // Check for full_name column specifically
    console.log('\n📋 Step 2: Testing full_name column...');
    
    const { data: nameTest, error: nameError } = await supabase
      .from('profiles')
      .select('full_name')
      .limit(1);
    
    if (nameError) {
      if (nameError.code === '42703') {
        console.log('❌ full_name column does not exist');
        console.log('🛠️ Need to add full_name column to profiles table');
        await suggestProfilesTableFix();
      } else {
        console.log('❌ Other error with full_name:', nameError);
      }
    } else {
      console.log('✅ full_name column exists');
    }
    
    // Check common profile columns
    console.log('\n📋 Step 3: Checking common profile columns...');
    
    const commonColumns = ['id', 'email', 'name', 'first_name', 'last_name', 'display_name', 'username'];
    
    for (const column of commonColumns) {
      try {
        const { error } = await supabase
          .from('profiles')
          .select(column)
          .limit(1);
        
        if (error) {
          console.log(`❌ ${column}: Not found`);
        } else {
          console.log(`✅ ${column}: Exists`);
        }
      } catch (error) {
        console.log(`❌ ${column}: Error -`, error.message);
      }
    }
    
  } catch (error) {
    console.error('❌ Profiles structure check failed:', error);
  }
}

async function suggestProfilesTableFix() {
  console.log('\n🛠️ Suggested fix for profiles table:');
  console.log('Copy this SQL to Supabase Dashboard:');
  console.log(`
-- Add missing columns to profiles table
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS full_name text,
ADD COLUMN IF NOT EXISTS display_name text,
ADD COLUMN IF NOT EXISTS first_name text,
ADD COLUMN IF NOT EXISTS last_name text,
ADD COLUMN IF NOT EXISTS username text,
ADD COLUMN IF NOT EXISTS avatar_url text,
ADD COLUMN IF NOT EXISTS phone text,
ADD COLUMN IF NOT EXISTS bio text;

-- Update existing records to have full_name
UPDATE public.profiles 
SET full_name = COALESCE(
  CASE 
    WHEN first_name IS NOT NULL AND last_name IS NOT NULL THEN first_name || ' ' || last_name
    WHEN display_name IS NOT NULL THEN display_name
    WHEN username IS NOT NULL THEN username
    WHEN email IS NOT NULL THEN split_part(email, '@', 1)
    ELSE 'User'
  END
)
WHERE full_name IS NULL;

-- Create function to auto-generate full_name on insert/update
CREATE OR REPLACE FUNCTION public.generate_full_name()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.full_name IS NULL OR NEW.full_name = '' THEN
    NEW.full_name := COALESCE(
      CASE 
        WHEN NEW.first_name IS NOT NULL AND NEW.last_name IS NOT NULL THEN NEW.first_name || ' ' || NEW.last_name
        WHEN NEW.display_name IS NOT NULL THEN NEW.display_name
        WHEN NEW.username IS NOT NULL THEN NEW.username
        WHEN NEW.email IS NOT NULL THEN split_part(NEW.email, '@', 1)
        ELSE 'User'
      END
    );
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for auto-generating full_name
DROP TRIGGER IF EXISTS generate_full_name_trigger ON public.profiles;
CREATE TRIGGER generate_full_name_trigger
  BEFORE INSERT OR UPDATE ON public.profiles
  FOR EACH ROW
  EXECUTE FUNCTION public.generate_full_name();

-- Test
SELECT 'Profiles table columns added successfully!' as status;
  `);
}

// Run the check
checkProfilesStructure();
