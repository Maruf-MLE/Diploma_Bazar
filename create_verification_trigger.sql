CREATE OR REPLACE FUNCTION check_verification_data_roll_no_trigger()
RETURNS TRIGGER AS $$
BEGIN
  IF NOT check_roll_no_unique(NEW.roll_no) THEN
    RAISE EXCEPTION 'Roll number already exists for a verified user.';
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE TRIGGER check_verification_data_roll_no
BEFORE INSERT OR UPDATE ON verification_data
FOR EACH ROW
EXECUTE FUNCTION check_verification_data_roll_no_trigger();