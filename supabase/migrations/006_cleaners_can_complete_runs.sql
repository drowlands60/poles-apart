-- Allow cleaners assigned to a run to update it (e.g. mark as complete)
create policy "Assigned cleaners can update runs"
  on public.runs for update
  to authenticated
  using (
    exists (
      select 1 from public.run_cleaners rc
      where rc.run_id = runs.id
      and rc.cleaner_id = auth.uid()
    )
  );
