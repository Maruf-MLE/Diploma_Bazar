-- Alternative SQL commands to update Supabase auth settings
-- Try this if the previous SQL commands don't work

-- View current config
-- SELECT * FROM auth.config;

-- 1. Direct update to the SITE_URL in the raw config_data
UPDATE auth.config
SET config_data = jsonb_set(
  config_data,
  '{site_url}',
  '"http://localhost:8080"'
);

-- 2. Update redirect URLs
UPDATE auth.config
SET config_data = jsonb_set(
  config_data,
  '{additional_redirect_urls}',
  '["http://localhost:8080/auth/callback", "http://localhost:8080", "http://localhost:8080/login", "http://localhost:8080/register", "http://localhost:8080/profile", "http://localhost"]'
);

-- 3. Update email confirmation token expiration time
UPDATE auth.config
SET config_data = jsonb_set(
  config_data,
  '{security,email_confirmation_token_expiration_time}',
  '86400'
);

-- 4. Update email templates directly
-- First, check if the template exists
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM auth.email_templates WHERE template_id = 'confirmation') THEN
    UPDATE auth.email_templates
    SET
      subject = 'ইমেইল যাচাইকরণ',
      html_body = '<h2>ইমেইল যাচাইকরণ</h2><p>প্রিয় ব্যবহারকারী,</p><p>আপনার ইমেইল যাচাই করতে নিচের বাটনে ক্লিক করুন:</p><a href="{{.ConfirmationURL}}" style="background-color: #4F46E5; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px; display: inline-block; margin: 20px 0;">ইমেইল যাচাই করুন</a><p>অথবা এই লিংকে ক্লিক করুন: <a href="{{.ConfirmationURL}}">{{.ConfirmationURL}}</a></p><p>যদি আপনি এই অনুরোধ না করে থাকেন, তাহলে এই ইমেইল উপেক্ষা করুন।</p><p>ধন্যবাদান্তে,<br>বই চাপা বাজার টিম</p>'
    WHERE template_id = 'confirmation';
  ELSE
    INSERT INTO auth.email_templates (template_id, subject, html_body)
    VALUES (
      'confirmation',
      'ইমেইল যাচাইকরণ',
      '<h2>ইমেইল যাচাইকরণ</h2><p>প্রিয় ব্যবহারকারী,</p><p>আপনার ইমেইল যাচাই করতে নিচের বাটনে ক্লিক করুন:</p><a href="{{.ConfirmationURL}}" style="background-color: #4F46E5; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px; display: inline-block; margin: 20px 0;">ইমেইল যাচাই করুন</a><p>অথবা এই লিংকে ক্লিক করুন: <a href="{{.ConfirmationURL}}">{{.ConfirmationURL}}</a></p><p>যদি আপনি এই অনুরোধ না করে থাকেন, তাহলে এই ইমেইল উপেক্ষা করুন।</p><p>ধন্যবাদান্তে,<br>বই চাপা বাজার টিম</p>'
    );
  END IF;
END $$; 