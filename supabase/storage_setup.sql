-- Execute no SQL Editor do Supabase para criar o bucket usado pelo upload de imagens.
-- Nome padrao usado pelo projeto: sintia-b-makeup-site-images

insert into storage.buckets (id, name, public)
values ('sintia-b-makeup-site-images', 'sintia-b-makeup-site-images', true)
on conflict (id) do update set public = true;

-- Politicas simples para site sem login. Use apenas se voce quer que o painel /admin consiga subir imagens sem Auth.
-- Como o painel tem senha no front-end, isso e pratico para uso simples, mas nao e seguranca forte.

drop policy if exists "Public read sintia makeup images" on storage.objects;
create policy "Public read sintia makeup images"
on storage.objects for select
using (bucket_id = 'sintia-b-makeup-site-images');

drop policy if exists "Public upload sintia makeup images" on storage.objects;
create policy "Public upload sintia makeup images"
on storage.objects for insert
to anon
with check (bucket_id = 'sintia-b-makeup-site-images');
