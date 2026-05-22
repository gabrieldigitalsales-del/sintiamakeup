-- Supabase setup unico para este projeto.
-- Execute tudo no SQL Editor do Supabase.
-- Nomes pensados para nao conflitar com outros projetos.

create table if not exists public.sbm_sikiomi_bw_v1_site_config (
  id text primary key,
  content jsonb not null default '{}'::jsonb,
  updated_at timestamptz not null default now()
);

alter table public.sbm_sikiomi_bw_v1_site_config enable row level security;

drop policy if exists "sbm_sikiomi_bw_v1_public_read_config" on public.sbm_sikiomi_bw_v1_site_config;
create policy "sbm_sikiomi_bw_v1_public_read_config"
on public.sbm_sikiomi_bw_v1_site_config
for select
to anon
using (true);

drop policy if exists "sbm_sikiomi_bw_v1_public_upsert_config" on public.sbm_sikiomi_bw_v1_site_config;
create policy "sbm_sikiomi_bw_v1_public_upsert_config"
on public.sbm_sikiomi_bw_v1_site_config
for insert
to anon
with check (true);

drop policy if exists "sbm_sikiomi_bw_v1_public_update_config" on public.sbm_sikiomi_bw_v1_site_config;
create policy "sbm_sikiomi_bw_v1_public_update_config"
on public.sbm_sikiomi_bw_v1_site_config
for update
to anon
using (true)
with check (true);

insert into public.sbm_sikiomi_bw_v1_site_config (id, content)
values ('sintia-b-makeup-public-site', '{}'::jsonb)
on conflict (id) do nothing;

insert into storage.buckets (id, name, public)
values ('sbm-sikiomi-bw-v1-assets', 'sbm-sikiomi-bw-v1-assets', true)
on conflict (id) do update set public = true;

drop policy if exists "sbm_sikiomi_bw_v1_public_read_assets" on storage.objects;
create policy "sbm_sikiomi_bw_v1_public_read_assets"
on storage.objects for select
to anon
using (bucket_id = 'sbm-sikiomi-bw-v1-assets');

drop policy if exists "sbm_sikiomi_bw_v1_public_upload_assets" on storage.objects;
create policy "sbm_sikiomi_bw_v1_public_upload_assets"
on storage.objects for insert
to anon
with check (bucket_id = 'sbm-sikiomi-bw-v1-assets');
