-- Add paid tracking to run_customers
-- When a run is completed, non-skipped houses become "payments due"
-- They can then be marked as paid

ALTER TABLE public.run_customers ADD COLUMN paid boolean NOT NULL DEFAULT false;
ALTER TABLE public.run_customers ADD COLUMN paid_at timestamptz;

CREATE INDEX idx_run_customers_paid ON public.run_customers(paid) WHERE status = 'completed';
