import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

const supabase = createClient(supabaseUrl, supabaseKey);

async function runMigration() {
  console.log('🚀 Running migration using Supabase client...\n');

  try {
    // Step 1: Create bills table
    console.log('Creating bills table...');
    const { error: createTableError } = await supabase.rpc('exec_sql', {
      query: `
        CREATE TABLE IF NOT EXISTS bills (
          id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
          bill_number TEXT UNIQUE NOT NULL,
          table_number TEXT NOT NULL,
          subtotal DECIMAL(10, 2) NOT NULL DEFAULT 0,
          total DECIMAL(10, 2) NOT NULL DEFAULT 0,
          settled_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
          created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
          updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
        );
      `
    });

    if (createTableError) {
      console.error('❌ Error creating bills table:', createTableError);
      console.log('\nℹ️  The exec_sql function may not be available.');
      console.log('Please run the migration manually in Supabase SQL Editor.\n');
      return;
    }

    console.log('✅ Bills table created\n');

    console.log('✨ Migration completed successfully!');
  } catch (error) {
    console.error('❌ Unexpected error:', error);
    console.log('\nPlease run the migration manually using Supabase SQL Editor.');
  }
}

runMigration();
