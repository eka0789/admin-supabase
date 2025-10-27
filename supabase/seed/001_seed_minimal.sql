-- Minimal bootstrap data for staging tests

-- An example admin profile (use an existing auth.users UUID)
-- Replace the UUIDs with real ones from your auth.users
insert into public.profiles (id, name, nik, phone, role, city)
values
  ('11111111-1111-1111-1111-111111111111', 'Admin KK SUKA', '3200000000000001', '081200000001', 'admin', 'Salatiga')
on conflict (id) do nothing;

-- A member
insert into public.profiles (id, name, nik, phone, role, city)
values
  ('22222222-2222-2222-2222-222222222222', 'Eka Prasetyo', '3200000000000002', '081200000002', 'member', 'Salatiga')
on conflict (id) do nothing;

-- Saving types
insert into public.savings_types (code, name, monthly_rate_bp, lock_months)
values
  ('REG', 'Simpanan Reguler', 0, 0),
  ('MPB', 'MPB', 1000, 20)
on conflict (code) do nothing;

-- Accounts seed (optional)
insert into public.accounts (user_id, saving_type_id, balance)
select '22222222-2222-2222-2222-222222222222', id, 0 from public.savings_types where code='REG'
on conflict do nothing;
