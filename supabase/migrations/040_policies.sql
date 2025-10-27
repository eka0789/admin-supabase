-- Helper: admin shortcut (service role)
-- Use: auth.role() = 'service_role' to grant unrestricted access for server-side ops.

-- PROFILES
drop policy if exists prof_member_read_self on public.profiles;
create policy prof_member_read_self
  on public.profiles
  for select
  using ( id = auth.uid() or auth.role() = 'service_role' );

drop policy if exists prof_admin_update on public.profiles;
create policy prof_admin_update
  on public.profiles
  for update
  using ( auth.role() = 'service_role' )
  with check ( true );

-- (Optional) Kacab / Marketing scoped reads can be added later with org hierarchy.

-- ACCOUNTS
drop policy if exists acc_member_read_own on public.accounts;
create policy acc_member_read_own
  on public.accounts
  for select
  using ( user_id = auth.uid() or auth.role() = 'service_role' );

-- Block direct writes from clients; only service role (Edge Functions) may write
drop policy if exists acc_service_write on public.accounts;
create policy acc_service_write
  on public.accounts
  for insert
  to authenticated
  with check ( auth.role() = 'service_role' );

create policy acc_service_update
  on public.accounts
  for update
  using ( auth.role() = 'service_role' )
  with check ( auth.role() = 'service_role' );

-- TRANSACTIONS
drop policy if exists tx_member_read_own on public.transactions;
create policy tx_member_read_own
  on public.transactions
  for select
  using ( user_id = auth.uid() or auth.role() = 'service_role' );

-- Insert/Update only via service role (webhook/edge)
drop policy if exists tx_service_insert on public.transactions;
create policy tx_service_insert
  on public.transactions
  for insert
  to authenticated
  with check ( auth.role() = 'service_role' );

drop policy if exists tx_service_update on public.transactions;
create policy tx_service_update
  on public.transactions
  for update
  using ( auth.role() = 'service_role' )
  with check ( auth.role() = 'service_role' );

-- WITHDRAWALS
drop policy if exists wd_member_select_own on public.withdrawals;
create policy wd_member_select_own
  on public.withdrawals
  for select
  using ( user_id = auth.uid() or auth.role() = 'service_role' );

drop policy if exists wd_member_insert_own on public.withdrawals;
create policy wd_member_insert_own
  on public.withdrawals
  for insert
  to authenticated
  with check ( user_id = auth.uid() );

-- member can cancel own pending (example: update limited by app logic later)
drop policy if exists wd_member_update_own on public.withdrawals;
create policy wd_member_update_own
  on public.withdrawals
  for update
  using ( user_id = auth.uid() )
  with check ( user_id = auth.uid() );

-- admin/service approves
drop policy if exists wd_admin_update on public.withdrawals;
create policy wd_admin_update
  on public.withdrawals
  for update
  using ( auth.role() = 'service_role' )
  with check ( true );

-- TRANSFERS
drop policy if exists tr_member_select_own on public.transfers;
create policy tr_member_select_own
  on public.transfers
  for select
  using ( sender_id = auth.uid() or receiver_id = auth.uid() or auth.role() = 'service_role' );

drop policy if exists tr_member_insert_sender on public.transfers;
create policy tr_member_insert_sender
  on public.transfers
  for insert
  to authenticated
  with check ( sender_id = auth.uid() );

-- PAYOUTS
drop policy if exists po_member_select_own on public.payouts;
create policy po_member_select_own
  on public.payouts
  for select
  using ( user_id = auth.uid() or auth.role() = 'service_role' );

-- MPB CONTRACTS (view only by owner; admin full)
drop policy if exists mpb_member_select_own on public.mpb_contracts;
create policy mpb_member_select_own
  on public.mpb_contracts
  for select
  using ( user_id = auth.uid() or auth.role() = 'service_role' );

-- MARKETING COMMISSIONS (admin/service view)
drop policy if exists mc_service_select on public.marketing_commissions;
create policy mc_service_select
  on public.marketing_commissions
  for select
  using ( auth.role() = 'service_role' );
