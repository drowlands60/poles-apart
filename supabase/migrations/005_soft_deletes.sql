-- Soft deletes: instead of removing data, mark as deleted
-- Protects against accidental deletions

ALTER TABLE public.customers ADD COLUMN deleted_at timestamptz DEFAULT NULL;
ALTER TABLE public.rounds ADD COLUMN deleted_at timestamptz DEFAULT NULL;
ALTER TABLE public.runs ADD COLUMN deleted_at timestamptz DEFAULT NULL;

-- Indexes for filtering out deleted records
CREATE INDEX idx_customers_not_deleted ON public.customers(id) WHERE deleted_at IS NULL;
CREATE INDEX idx_rounds_not_deleted ON public.rounds(id) WHERE deleted_at IS NULL;
CREATE INDEX idx_runs_not_deleted ON public.runs(id) WHERE deleted_at IS NULL;
