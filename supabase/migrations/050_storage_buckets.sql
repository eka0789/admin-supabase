-- Buckets for files
-- Run in Supabase SQL editor (project must have storage enabled)
insert into storage.buckets (id, name, public) values ('qris', 'qris', true)
on conflict (id) do nothing;

insert into storage.buckets (id, name, public) values ('proofs', 'proofs', false)
on conflict (id) do nothing;
