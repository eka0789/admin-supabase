-- PROFILES
create index if not exists idx_profiles_role on public.profiles(role);

-- ACCOUNTS
create index if not exists idx_accounts_user on public.accounts(user_id);
create index if not exists idx_accounts_saving_type on public.accounts(saving_type_id);

-- TRANSACTIONS
create index if not exists idx_tx_user on public.transactions(user_id);
create index if not exists idx_tx_status on public.transactions(status);
create index if not exists idx_tx_created on public.transactions(created_at desc);
create unique index if not exists idx_tx_idempotency on public.transactions(idempotency_key) where idempotency_key is not null;

-- WITHDRAWALS
create index if not exists idx_wd_user on public.withdrawals(user_id);
create index if not exists idx_wd_status on public.withdrawals(status);

-- TRANSFERS
create index if not exists idx_tr_sender on public.transfers(sender_id);
create index if not exists idx_tr_receiver on public.transfers(receiver_id);

-- MPB / COMMISSIONS / PAYOUTS
create index if not exists idx_mpb_user on public.mpb_contracts(user_id);
create index if not exists idx_comm_marketer on public.marketing_commissions(marketer_id);
create index if not exists idx_comm_member on public.marketing_commissions(member_id);
create index if not exists idx_payouts_user on public.payouts(user_id);
create index if not exists idx_payouts_period on public.payouts(period);
create unique index if not exists uq_payouts_user_period_source on public.payouts(user_id, period, source);

-- HOLIDAYS, NIK BLACKLIST
-- (PKs already indexed)
