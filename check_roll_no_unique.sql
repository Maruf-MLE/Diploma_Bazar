CREATE OR REPLACE FUNCTION check_roll_no_unique(roll_no_input TEXT)
RETURNS BOOLEAN AS $$
BEGIN
  -- Check if the roll_no already exists for verified users
  IF EXISTS (
    SELECT 1
    FROM verification_data
    WHERE roll_no = roll_no_input
    AND is_verified = TRUE
  ) THEN
    -- If the roll_no exists for a verified user, return FALSE
    RETURN FALSE;
  ELSE
    -- If the roll_no does not exist for a verified user, return TRUE
    RETURN TRUE;
  END IF;
END;
$$ LANGUAGE plpgsql;