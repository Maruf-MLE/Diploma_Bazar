CREATE POLICY check_roll_no_unique ON verification_data
FOR INSERT
WITH CHECK (
  NOT EXISTS (
    SELECT 1
    FROM verification_data
    WHERE roll_no = NEW.roll_no
    AND is_verified = TRUE
  )
);