-- PROFILES (root identity)
create table if not exists public.profiles (
  id uuid primary key,
  name text,
  nik text not null unique,
  city text,
  phone text,
  role text default 'member' check (role in ('admin','kacab','marketing','member')),
  referrer_id uuid null,
  bh_enabled boolean default true,
  last_topup_at date,
  created_at timestamptz default now(),
  manager_id uuid null,
  qris_code text unique,
  qris_image_url text,
  qris_merchant_ref text,
  constraint profiles_referrer_fk foreign key (referrer_id) references public.profiles(id),
  constraint profiles_manager_fk  foreign key (manager_id) references public.profiles(id)
);

-- SAVINGS TYPES
create table if not exists public.savings_types (
  id serial primary key,
  code text unique,
  name text not null,
  monthly_rate_bp integer default 0,
  lock_months integer default 0,
  rules jsonb default '{}'::jsonb
);

-- ENUMS FIX ✅
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'tx_kind') THEN
        CREATE TYPE tx_kind AS ENUM ('deposit','topup','withdraw','adjust','p2p_send','p2p_recv');
    END IF;
END$$;

DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'tx_status') THEN
        CREATE TYPE tx_status AS ENUM ('pending','verified','rejected','settled');
    END IF;
END$$;

DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'wd_status') THEN
        CREATE TYPE wd_status AS ENUM ('pending','approved','rejected','paid');
    END IF;
END$$;

DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'mpb_status') THEN
        CREATE TYPE mpb_status AS ENUM ('active','completed','default');
    END IF;
END$$;

DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'payout_source') THEN
        CREATE TYPE payout_source AS ENUM ('BH','KOMISI','INSENTIF');
    END IF;
END$$;

-- ACCOUNTS
create table if not exists public.accounts (
  id bigserial primary key,
  user_id uuid not null references public.profiles(id) on delete cascade,
  saving_type_id integer references public.savings_types(id),
  balance numeric(20,2) default 0 check (balance >= 0),
  locked_until date,
  meta jsonb default '{}'::jsonb
);

-- TRANSACTIONS
create table if not exists public.transactions (
  id bigserial primary key,
  user_id uuid not null references public.profiles(id) on delete cascade,
  saving_type_id integer references public.savings_types(id),
  amount numeric(20,2) not null,
  kind tx_kind not null,
  status tx_status not null default 'pending',
  proof_url text,
  bank_name text,
  remarks text,
  idempotency_key text,
  created_at timestamptz default now()
);

-- WITHDRAWALS
create table if not exists public.withdrawals (
  id bigserial primary key,
  user_id uuid not null references public.profiles(id) on delete cascade,
  amount numeric(20,2) not null,
  bank_name text not null,
  fee_rate_bp integer not null,
  fee_amount numeric(20,2) not null,
  net_amount numeric(20,2) not null,
  status wd_status default 'pending',
  requested_at timestamptz default now(),
  processed_at timestamptz
);

-- TRANSFERS
create table if not exists public.transfers (
  id bigserial primary key,
  sender_id uuid not null references public.profiles(id),
  receiver_id uuid not null references public.profiles(id),
  amount numeric(20,2) not null,
  fee numeric(20,2) default 0,
  created_at timestamptz default now(),
  constraint transfers_sender_receiver_different check (sender_id <> receiver_id)
);

-- MPB CONTRACTS
create table if not exists public.mpb_contracts (
  id bigserial primary key,
  user_id uuid not null references public.profiles(id),
  principal numeric(20,2) not null,
  start_date date not null,
  term_months integer default 20,
  monthly_return_bp integer default 1000,
  month_posted integer default 0,
  status mpb_status default 'active'
);

-- MARKETING COMMISSIONS
create table if not exists public.marketing_commissions (
  id bigserial primary key,
  marketer_id uuid references public.profiles(id),
  member_id uuid references public.profiles(id),
  mpb_contract_id bigint references public.mpb_contracts(id),
  occurrence integer not null,
  amount numeric(20,2) not null,
  created_at timestamptz default now()
);

-- PAYOUTS
create table if not exists public.payouts (
  id bigserial primary key,
  user_id uuid not null references public.profiles(id),
  source payout_source not null,
  saving_type_id integer references public.savings_types(id),
  amount numeric(20,2) not null,
  period text,
  posted_at timestamptz default now(),
  meta jsonb default '{}'::jsonb,
  note text,
  reference_id bigint,
  source_type text,
  processed_at timestamptz,
  created_at timestamptz default now()
);

-- BRANCH INCENTIVES
create table if not exists public.branch_incentives (
  id bigserial primary key,
  kacab_id uuid references public.profiles(id),
  group_volume numeric(20,2) not null,
  rate_bp integer not null default 500,
  amount numeric(20,2) not null,
  period text not null,
  created_at timestamptz default now()
);

-- HOLIDAYS
create table if not exists public.holidays (
  holiday_date date primary key,
  name text not null
);

-- NIK BLACKLIST
create table if not exists public.nik_blacklist (
  nik text primary key,
  reason text,
  blocked_by uuid references auth.users(id),
  blocked_at timestamptz default now()
);

-- APP SETTINGS
create table if not exists public.app_settings (
  key text primary key,
  value jsonb not null
);
