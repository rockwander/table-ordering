-- Step 1: Check which items are missing translations
SELECT
  name as english_name,
  gujarati_name,
  CASE
    WHEN gujarati_name IS NULL THEN 'NULL'
    WHEN gujarati_name = '' THEN 'EMPTY'
    WHEN gujarati_name = name THEN 'FALLBACK (same as English)'
    ELSE 'TRANSLATED'
  END as status
FROM menu_items
ORDER BY
  CASE
    WHEN gujarati_name IS NULL THEN 1
    WHEN gujarati_name = '' THEN 2
    WHEN gujarati_name = name THEN 3
    ELSE 4
  END,
  name;

-- Step 2: Count by status
SELECT
  CASE
    WHEN gujarati_name IS NULL THEN 'NULL'
    WHEN gujarati_name = '' THEN 'EMPTY'
    WHEN gujarati_name = name THEN 'FALLBACK (English)'
    ELSE 'TRANSLATED'
  END as status,
  COUNT(*) as count
FROM menu_items
GROUP BY
  CASE
    WHEN gujarati_name IS NULL THEN 'NULL'
    WHEN gujarati_name = '' THEN 'EMPTY'
    WHEN gujarati_name = name THEN 'FALLBACK (English)'
    ELSE 'TRANSLATED'
  END
ORDER BY count DESC;
