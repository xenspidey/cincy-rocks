-- Cincy Rocks database. Paste this whole file into your Supabase project's
-- SQL Editor and press Run. It is safe to run again.

create table if not exists admins (
  user_id uuid primary key references auth.users(id) on delete cascade,
  email text not null,
  created_at timestamptz not null default now()
);

create table if not exists bands (
  id text primary key default ('b' || substr(md5(random()::text), 1, 12)),
  name text not null,
  genre text default '',
  hometown text default '',
  bio text default '',
  website text, instagram text, spotify text, youtube text, image_url text,
  status text not null default 'pending' check (status in ('pending','approved','rejected')),
  created_at timestamptz not null default now(),
  reviewed_at timestamptz
);

-- Private details for each band, kept apart from the public lineup: only admins can read them.
create table if not exists band_contacts (
  band_id text primary key references bands(id) on delete cascade,
  contact_name text,
  contact_email text,
  invite_code text,
  review_note text
);

create table if not exists venues (
  id text primary key default ('v' || substr(md5(random()::text), 1, 12)),
  name text not null,
  address text default '',
  lat double precision not null,
  lng double precision not null,
  description text default '',
  kind text default 'outdoor'
);

create table if not exists performances (
  id text primary key default ('p' || substr(md5(random()::text), 1, 12)),
  band_id text not null references bands(id) on delete cascade,
  venue_id text not null references venues(id) on delete cascade,
  starts_at timestamp not null,
  ends_at timestamp not null
);

create table if not exists news (
  id text primary key default ('n' || substr(md5(random()::text), 1, 12)),
  title text not null,
  body text default '',
  date date not null default current_date
);

create table if not exists invites (
  code text primary key,
  note text default '',
  created_at timestamptz not null default now(),
  expires_at timestamptz,
  max_uses int not null default 1 check (max_uses > 0),
  uses int not null default 0,
  revoked boolean not null default false
);

-- Columns added later (safe to run on an existing database).
alter table bands add column if not exists facebook text;
alter table bands add column if not exists tiktok text;
alter table bands add column if not exists x text;
alter table venues add column if not exists over_21 boolean not null default false;

-- Older databases kept contact details, invite code and review note in the public bands
-- table, where anyone could read them. Move them to band_contacts (runs once).
do $$
begin
  if exists (select 1 from information_schema.columns
             where table_schema = 'public' and table_name = 'bands' and column_name = 'contact_email') then
    insert into band_contacts (band_id, contact_name, contact_email, invite_code, review_note)
      select id, contact_name, contact_email, invite_code, review_note from bands
      on conflict (band_id) do nothing;
    alter table bands drop column contact_name, drop column contact_email,
                      drop column invite_code, drop column review_note;
  end if;
end $$;

-- Helpers ------------------------------------------------------------------

create or replace function is_admin() returns boolean
language sql stable security definer set search_path = public as $$
  select exists(select 1 from admins where user_id = auth.uid());
$$;

create or replace function has_admins() returns boolean
language sql stable security definer set search_path = public as $$
  select exists(select 1 from admins);
$$;

-- The very first person to call this becomes the admin. After that it does nothing.
create or replace function claim_first_admin() returns void
language plpgsql security definer set search_path = public as $$
begin
  if auth.uid() is null then raise exception 'Sign in first'; end if;
  if exists(select 1 from admins) then raise exception 'An admin already exists'; end if;
  insert into admins(user_id, email) values (auth.uid(), coalesce(auth.jwt()->>'email', ''));
end $$;

create or replace function invite_problem(i invites) returns text
language sql stable as $$
  select case
    when i.code is null then 'That invite code was not found. Check the letters and try again.'
    when i.revoked then 'This invite has been turned off by the festival team.'
    when i.expires_at is not null and i.expires_at < now() then 'This invite has expired. Ask the festival team for a new one.'
    when i.uses >= i.max_uses then 'This invite has already been used the maximum number of times.'
    else null end;
$$;

-- Anyone can ask whether a code works (returns null when it does, otherwise the reason).
create or replace function check_invite(p_code text) returns text
language plpgsql stable security definer set search_path = public as $$
declare i invites;
begin
  select * into i from invites where code = upper(p_code);
  return invite_problem(i);
end $$;

-- A band signs up with an invite code. Their profile is saved as "pending" until an admin approves it.
create or replace function apply_with_invite(p_code text, p_band jsonb) returns bands
language plpgsql security definer set search_path = public as $$
declare i invites; problem text; b bands;
begin
  select * into i from invites where code = upper(p_code) for update;
  problem := invite_problem(i);
  if problem is not null then raise exception '%', problem; end if;
  if coalesce(trim(p_band->>'name'), '') = '' then raise exception 'Band name is required'; end if;
  update invites set uses = uses + 1 where code = i.code;
  insert into bands(name, genre, hometown, bio, website, instagram, spotify, youtube, facebook, tiktok, x, image_url, status)
  values (p_band->>'name', p_band->>'genre', p_band->>'hometown', p_band->>'bio', p_band->>'website', p_band->>'instagram',
          p_band->>'spotify', p_band->>'youtube', p_band->>'facebook', p_band->>'tiktok', p_band->>'x', p_band->>'image_url', 'pending')
  returning * into b;
  insert into band_contacts(band_id, contact_name, contact_email, invite_code)
  values (b.id, p_band->>'contact_name', p_band->>'contact_email', i.code);
  return b;
end $$;

-- Security rules -------------------------------------------------------------

alter table admins enable row level security;
alter table bands enable row level security;
alter table band_contacts enable row level security;
alter table venues enable row level security;
alter table performances enable row level security;
alter table news enable row level security;
alter table invites enable row level security;

drop policy if exists "admins read" on admins;
create policy "admins read" on admins for select using (is_admin());

drop policy if exists "public approved bands" on bands;
create policy "public approved bands" on bands for select using (status = 'approved' or is_admin());
drop policy if exists "admin bands" on bands;
create policy "admin bands" on bands for all using (is_admin()) with check (is_admin());

drop policy if exists "admin band contacts" on band_contacts;
create policy "admin band contacts" on band_contacts for all using (is_admin()) with check (is_admin());

drop policy if exists "public venues" on venues;
create policy "public venues" on venues for select using (true);
drop policy if exists "admin venues" on venues;
create policy "admin venues" on venues for all using (is_admin()) with check (is_admin());

drop policy if exists "public performances" on performances;
create policy "public performances" on performances for select
  using (exists(select 1 from bands b where b.id = band_id and (b.status = 'approved' or is_admin())));
drop policy if exists "admin performances" on performances;
create policy "admin performances" on performances for all using (is_admin()) with check (is_admin());

drop policy if exists "public news" on news;
create policy "public news" on news for select using (true);
drop policy if exists "admin news" on news;
create policy "admin news" on news for all using (is_admin()) with check (is_admin());

drop policy if exists "admin invites" on invites;
create policy "admin invites" on invites for all using (is_admin()) with check (is_admin());

-- Table access for the website and apps. Newer Supabase projects don't open new tables to the
-- Data API by default, so it's granted here; the row rules above still decide what each person
-- can see or change (visitors only ever read; only admins can write).
grant usage on schema public to anon, authenticated;
grant select on bands, venues, performances, news to anon, authenticated;
grant select on admins to authenticated;
grant select, insert, update, delete on bands, band_contacts, venues, performances, news, invites to authenticated;

grant execute on function is_admin, has_admins, claim_first_admin, check_invite, apply_with_invite to anon, authenticated;
