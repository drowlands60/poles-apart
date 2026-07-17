-- Allow 'skipped' status in sms_log for customers who weren't sent a message
ALTER TABLE public.sms_log DROP CONSTRAINT sms_log_status_check;
ALTER TABLE public.sms_log ADD CONSTRAINT sms_log_status_check CHECK (status IN ('sent', 'failed', 'pending', 'skipped'));
