-- Add sequential bill_id to bills table
ALTER TABLE bills ADD COLUMN IF NOT EXISTS display_bill_id INTEGER;

-- Create a sequence for bill IDs that cycles from 1 to 999
CREATE SEQUENCE IF NOT EXISTS bill_id_seq
  START WITH 1
  INCREMENT BY 1
  MINVALUE 1
  MAXVALUE 999
  CYCLE;

-- Create a function to generate the next bill ID
CREATE OR REPLACE FUNCTION generate_bill_id()
RETURNS INTEGER AS $$
BEGIN
  RETURN nextval('bill_id_seq');
END;
$$ LANGUAGE plpgsql;

-- Set default value for display_bill_id
ALTER TABLE bills ALTER COLUMN display_bill_id SET DEFAULT generate_bill_id();

-- Update existing bills with sequential IDs if any exist
DO $$
DECLARE
  bill_record RECORD;
  counter INTEGER := 1;
BEGIN
  FOR bill_record IN SELECT id FROM bills WHERE display_bill_id IS NULL ORDER BY created_at
  LOOP
    UPDATE bills SET display_bill_id = counter WHERE id = bill_record.id;
    counter := counter + 1;
    IF counter > 999 THEN
      counter := 1;
    END IF;
  END LOOP;
END $$;

-- Create index for display_bill_id
CREATE INDEX IF NOT EXISTS idx_bills_display_bill_id ON bills(display_bill_id);
