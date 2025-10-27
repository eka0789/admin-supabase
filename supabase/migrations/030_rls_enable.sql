-- Enable Row Level Security on sensitive tables
alter table public.profiles           enable row level security;
alter table public.accounts           enable row level security;
alter table public.transactions       enable row level security;
alter table public.withdrawals        enable row level security;
alter table public.transfers          enable row level security;
alter table public.payouts            enable row level security;
alter table public.marketing_commissions enable row level security;
alter table public.mpb_contracts      enable row level security;

-- Optional (can be RLS-free or read-only):
-- alter table public.savings_types   enable row level security;
-- alter table public.branch_incentives enable row level security;
-- alter table public.holidays        enable row level security;
-- alter table public.app_settings    enable row level security;
-- alter table public.nik_blacklist   enable row level security;
