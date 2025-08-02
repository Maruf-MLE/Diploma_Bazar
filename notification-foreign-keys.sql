-- Add foreign key constraint for user_id referencing profiles table
ALTER TABLE public.notifications
ADD CONSTRAINT fk_notifications_user_id
FOREIGN KEY (user_id)
REFERENCES public.profiles(id)
ON DELETE CASCADE;

-- Add foreign key constraint for sender_id referencing profiles table
ALTER TABLE public.notifications
ADD CONSTRAINT fk_notifications_sender_id
FOREIGN KEY (sender_id)
REFERENCES public.profiles(id)
ON DELETE SET NULL; 