-- Add run_id to sms_log so we can track which texts were sent for which run
ALTER TABLE public.sms_log ADD COLUMN run_id uuid REFERENCES public.runs(id) ON DELETE SET NULL;
CREATE INDEX idx_sms_log_run ON public.sms_log(run_id);
