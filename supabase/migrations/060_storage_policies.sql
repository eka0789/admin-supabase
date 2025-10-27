-- Enable RLS on storage objects (default true)
-- Create policies per bucket.

-- QRIS: Public read, write only by service role (Edge) or admin endpoints.
drop policy if exists qris_public_read on storage.objects;
create policy qris_public_read
  on storage.objects for select
  using ( bucket_id = 'qris' );

drop policy if exists qris_service_write on storage.objects;
create policy qris_service_write
  on storage.objects for insert
  to authenticated
  with check ( bucket_id = 'qris' and auth.role() = 'service_role' );

-- Allow service role to update/delete if needed (regenerate/cleanup)
drop policy if exists qris_service_update on storage.objects;
create policy qris_service_update
  on storage.objects for update
  using ( bucket_id = 'qris' and auth.role() = 'service_role' )
  with check ( bucket_id = 'qris' and auth.role() = 'service_role' );

drop policy if exists qris_service_delete on storage.objects;
create policy qris_service_delete
  on storage.objects for delete
  using ( bucket_id = 'qris' and auth.role() = 'service_role' );

-- PROOFS: Private (owner + service role)
-- Assumption: we store proofs with metadata 'owner' = auth.uid() or path='proofs/{uid}/...'
-- The simplest robust approach: path is 'proofs/{user_id}/...'

-- Read: owner can read their folder; service role can read all
drop policy if exists proofs_owner_read on storage.objects;
create policy proofs_owner_read
  on storage.objects for select
  using (
    bucket_id = 'proofs'
    and (
      auth.role() = 'service_role'
      or (storage.foldername(name))[1] = auth.uid()::text
    )
  );

-- Insert: owner can upload only into their folder; service role allowed
drop policy if exists proofs_owner_insert on storage.objects;
create policy proofs_owner_insert
  on storage.objects for insert
  to authenticated
  with check (
    bucket_id = 'proofs'
    and (
      auth.role() = 'service_role'
      or (storage.foldername(name))[1] = auth.uid()::text
    )
  );

-- Update/Delete: owner only their files; service role full
drop policy if exists proofs_owner_update on storage.objects;
create policy proofs_owner_update
  on storage.objects for update
  using (
    bucket_id = 'proofs'
    and (
      auth.role() = 'service_role'
      or (storage.foldername(name))[1] = auth.uid()::text
    )
  )
  with check (
    bucket_id = 'proofs'
    and (
      auth.role() = 'service_role'
      or (storage.foldername(name))[1] = auth.uid()::text
    )
  );

drop policy if exists proofs_owner_delete on storage.objects;
create policy proofs_owner_delete
  on storage.objects for delete
  using (
    bucket_id = 'proofs'
    and (
      auth.role() = 'service_role'
      or (storage.foldername(name))[1] = auth.uid()::text
    )
  );
