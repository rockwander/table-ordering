#!/bin/bash

echo "=========================================="
echo "Bill ID Migration Runner"
echo "=========================================="
echo ""
echo "This script will help you run the migration."
echo ""
echo "OPTION 1: Run via Supabase Dashboard (RECOMMENDED)"
echo "1. Go to: https://supabase.com/dashboard"
echo "2. Select your project"
echo "3. Click 'SQL Editor' in the left sidebar"
echo "4. Click 'New query'"
echo "5. Copy and paste the SQL from: migrations/add_sequential_bill_id.sql"
echo "6. Click 'RUN'"
echo ""
echo "OPTION 2: Run via CLI (if you have Supabase linked)"
read -p "Do you want to try running via CLI? (y/n): " choice

if [ "$choice" = "y" ] || [ "$choice" = "Y" ]; then
    echo ""
    echo "Attempting to run migration via Supabase CLI..."
    npx supabase db query --file migrations/add_sequential_bill_id.sql --linked
    
    if [ $? -eq 0 ]; then
        echo ""
        echo "✅ Migration successful!"
    else
        echo ""
        echo "❌ CLI migration failed. Please use OPTION 1 (Supabase Dashboard)."
    fi
else
    echo ""
    echo "Opening migration file for you to copy..."
    cat migrations/add_sequential_bill_id.sql
fi

echo ""
echo "=========================================="
