-- Check for items missing Gujarati translations
-- This will show items where gujarati_name is NULL, empty, or same as English name

SELECT
  name as english_name,
  gujarati_name,
  CASE
    WHEN gujarati_name IS NULL THEN 'NULL - No translation'
    WHEN gujarati_name = '' THEN 'EMPTY - No translation'
    WHEN gujarati_name = name THEN 'SAME AS ENGLISH - Using fallback'
    ELSE 'HAS TRANSLATION'
  END as translation_status
FROM menu_items
WHERE gujarati_name IS NULL
   OR gujarati_name = ''
   OR gujarati_name = name
ORDER BY name;

-- Count summary
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
