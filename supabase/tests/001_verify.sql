-- Basic existence checks
select 'profiles' as tbl, count(*) from information_schema.tables where table_name='profiles'
union all
select 'accounts', count(*) from information_schema.tables where table_name='accounts'
union all
select 'transactions', count(*) from information_schema.tables where table_name='transactions'
union all
select 'withdrawals', count(*) from information_schema.tables where table_name='withdrawals'
union all
select 'transfers', count(*) from information_schema.tables where table_name='transfers'
union all
select 'payouts', count(*) from information_schema.tables where table_name='payouts';

-- RLS check status
select relname as table, relrowsecurity as rls_enabled
from pg_class c
join pg_namespace n on n.oid=c.relnamespace
where n.nspname='public' and relname in ('profiles','accounts','transactions','withdrawals','transfers','payouts','marketing_commissions','mpb_contracts')
order by relname;

-- Index sanity checks
-- (example)
select indexname, indexdef from pg_indexes
where tablename in ('transactions','accounts','payouts')
order by tablename, indexname;

-- Seed sanity
select id, name, role from public.profiles order by created_at desc limit 5;
