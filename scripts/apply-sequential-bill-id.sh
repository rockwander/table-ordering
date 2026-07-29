#!/bin/bash

# This script applies the sequential bill ID migration to the database

echo "Applying sequential bill ID migration..."

# Read the SQL migration file
SQL_FILE="migrations/add_sequential_bill_id.sql"

if [ ! -f "$SQL_FILE" ]; then
  echo "Error: Migration file not found at $SQL_FILE"
  exit 1
fi

# Execute the migration using Supabase query command
npx supabase db query --file "$SQL_FILE" || {
  echo "Error: Failed to execute migration"
  echo "Please run this migration manually in your Supabase SQL editor"
  echo "File location: $SQL_FILE"
  exit 1
}

echo "Migration applied successfully!"
echo "Bill IDs will now auto-increment from 1 to 999 and cycle"
