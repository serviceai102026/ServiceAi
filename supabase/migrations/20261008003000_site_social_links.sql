create table if not exists public.site_social_links (
  id bigint primary key,
  facebook text,
  tiktok text,
  youtube text,
  instagram text,
  whatsapp text,
  twitter text,
  linkedin text,
  created_at timestamptz default now()
);

insert into public.site_social_links (id)
values (1)
on conflict (id) do nothing;

alter table public.site_social_links enable row level security;

drop policy if exists "public read" on public.site_social_links;
drop policy if exists "allow all write" on public.site_social_links;
drop policy if exists "public read social links" on public.site_social_links;

create policy "public read social links"
  on public.site_social_links
  for select
  to anon, authenticated
  using (true);

revoke all on table public.site_social_links from anon, authenticated;
grant select on table public.site_social_links to anon, authenticated;
grant select, insert, update, delete on table public.site_social_links to service_role;
