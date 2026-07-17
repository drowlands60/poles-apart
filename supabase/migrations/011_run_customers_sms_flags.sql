-- Track which SMS notifications have been sent per customer on a run
ALTER TABLE public.run_customers ADD COLUMN sms_day_before_sent boolean NOT NULL DEFAULT false;
ALTER TABLE public.run_customers ADD COLUMN sms_completed_sent boolean NOT NULL DEFAULT false;
