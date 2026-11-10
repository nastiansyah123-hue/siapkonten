create table public.products (id uuid primary key default gen_random_uuid(), name text not null check(length(trim(name))>0));
create table public.accounts (id uuid primary key default gen_random_uuid(), product uuid not null references public.products(id), name text not null check(length(trim(name))>0), handle text not null check(length(trim(handle))>0));
create table public.members (email text primary key check(email=lower(email)), name text not null, role text not null check(role in ('admin','editor','sosmed')), accounts uuid[] not null default '{}');
create table public.videos (id uuid primary key default gen_random_uuid(), account uuid not null references public.accounts(id), title text not null check(length(trim(title))>0), url text not null check(url ~ '^https://drive[.]google[.]com/(file/d/[A-Za-z0-9_-]+|open[?]id=[A-Za-z0-9_-]+|uc[?].*id=[A-Za-z0-9_-]+)'), notes text not null default '', creator text not null default lower(auth.jwt()->>'email'), creator_id uuid not null default auth.uid() references auth.users(id), created timestamptz not null default now(), posted timestamptz, posted_by text);
create index videos_account_created on public.videos(account,created desc);
create function public.workspace_role() returns text language sql stable security definer set search_path='' as $$ select role from public.members where email=lower(auth.jwt()->>'email') $$;
create function public.account_access(target uuid) returns boolean language sql stable security definer set search_path='' as $$ select exists(select 1 from public.members where email=lower(auth.jwt()->>'email') and (role='admin' or target=any(accounts))) $$;
alter table public.products enable row level security;
alter table public.accounts enable row level security;
alter table public.members enable row level security;
alter table public.videos enable row level security;
create policy products_read on public.products for select to authenticated using(public.workspace_role()='admin' or exists(select 1 from public.accounts a where a.product=products.id and public.account_access(a.id)));
create policy products_add on public.products for insert to authenticated with check(public.workspace_role()='admin');
create policy accounts_read on public.accounts for select to authenticated using(public.account_access(id));
create policy accounts_add on public.accounts for insert to authenticated with check(public.workspace_role()='admin');
create policy members_read on public.members for select to authenticated using(email=lower(auth.jwt()->>'email') or public.workspace_role()='admin');
create policy videos_read on public.videos for select to authenticated using(public.account_access(account));
create policy videos_add on public.videos for insert to authenticated with check(public.workspace_role() in ('admin','editor') and public.account_access(account) and creator_id=auth.uid() and creator=lower(auth.jwt()->>'email') and posted is null and posted_by is null);
-- No direct UPDATE or DELETE grants: workflow changes go through checked RPCs.
revoke all on public.products,public.accounts,public.members,public.videos from anon,authenticated;
grant select,insert on public.products,public.accounts,public.videos to authenticated;
grant select on public.members to authenticated;
create function public.save_member(member_email text,member_name text,member_role text,member_accounts uuid[]) returns void language plpgsql security definer set search_path='' as $$
begin
 if public.workspace_role() is distinct from 'admin' then raise exception 'Khusus admin'; end if;
 if member_role not in ('editor','sosmed') or member_email !~ '^[^[:space:]@]+@[^[:space:]@]+[.][^[:space:]@]+$' or length(trim(member_name))=0 then raise exception 'Periksa data anggota'; end if;
 if exists(select 1 from public.members where email=lower(member_email) and role='admin') then raise exception 'Admin tidak bisa diubah';end if;
 if exists(select 1 from unnest(member_accounts) a where not exists(select 1 from public.accounts where id=a)) then raise exception 'Akun tidak ditemukan';end if;
 insert into public.members(email,name,role,accounts) values(lower(member_email),member_name,member_role,coalesce(member_accounts,'{}')) on conflict(email) do update set name=excluded.name,role=excluded.role,accounts=excluded.accounts;
end $$;
create function public.set_posted(video_id uuid,is_posted boolean) returns void language plpgsql security definer set search_path='' as $$
declare target uuid;
begin
 select account into target from public.videos where id=video_id;
 if public.workspace_role() is null or public.workspace_role() not in ('admin','sosmed') or not public.account_access(target) then raise exception 'Tidak memiliki akses';end if;
 update public.videos set posted=case when is_posted then now() else null end,posted_by=case when is_posted then lower(auth.jwt()->>'email') else null end where id=video_id;
end $$;
revoke all on function public.workspace_role(),public.account_access(uuid),public.save_member(text,text,text,uuid[]),public.set_posted(uuid,boolean) from public,anon;
grant execute on function public.workspace_role(),public.account_access(uuid),public.save_member(text,text,text,uuid[]),public.set_posted(uuid,boolean) to authenticated;
