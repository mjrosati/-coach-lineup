-- COACH LINEUP / SUPABASE DATABASE
-- Run this in Supabase SQL Editor.
-- The policies make team data visible only to authenticated members of that team.

create extension if not exists pgcrypto;

create table if not exists public.teams (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  join_code text not null unique,
  owner_id uuid not null references auth.users(id) on delete cascade,
  created_at timestamptz not null default now()
);

create table if not exists public.team_members (
  team_id uuid not null references public.teams(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  role text not null default 'coach' check (role in ('owner','coach','viewer')),
  created_at timestamptz not null default now(),
  primary key(team_id,user_id)
);

create table if not exists public.players (
  id uuid primary key default gen_random_uuid(),
  team_id uuid not null references public.teams(id) on delete cascade,
  jersey_number text not null,
  name text not null,
  position text default '',
  active boolean not null default true,
  created_at timestamptz not null default now()
);

create table if not exists public.lines (
  id uuid primary key default gen_random_uuid(),
  team_id uuid not null references public.teams(id) on delete cascade,
  name text not null,
  color text not null default 'red',
  sort_order int not null default 0
);

create table if not exists public.line_players (
  line_id uuid not null references public.lines(id) on delete cascade,
  player_id uuid not null references public.players(id) on delete cascade,
  position_id text,
  primary key(line_id,player_id)
);

create table if not exists public.position_labels (
  team_id uuid not null references public.teams(id) on delete cascade,
  position_id text not null,
  label text not null,
  x numeric not null,
  y numeric not null,
  primary key(team_id,position_id)
);

create table if not exists public.games (
  id uuid primary key default gen_random_uuid(),
  team_id uuid not null references public.teams(id) on delete cascade,
  name text not null default 'Game',
  threshold numeric not null default 75,
  current_play int not null default 0,
  created_at timestamptz not null default now()
);

create table if not exists public.game_plays (
  id uuid primary key default gen_random_uuid(),
  game_id uuid not null references public.games(id) on delete cascade,
  play_number int not null,
  line_id uuid references public.lines(id) on delete set null,
  created_by uuid references auth.users(id),
  created_at timestamptz not null default now(),
  unique(game_id,play_number)
);

create table if not exists public.play_players (
  game_play_id uuid not null references public.game_plays(id) on delete cascade,
  player_id uuid not null references public.players(id) on delete cascade,
  position_id text,
  primary key(game_play_id,player_id)
);

create or replace function public.is_team_member(tid uuid)
returns boolean language sql stable security definer set search_path=public
as $$ select exists(select 1 from public.team_members tm where tm.team_id=tid and tm.user_id=auth.uid()); $$;

create or replace function public.create_team(team_name text)
returns uuid language plpgsql security definer set search_path=public
as $$
declare tid uuid; code text;
begin
  if auth.uid() is null then raise exception 'Not signed in'; end if;
  code := upper(substr(encode(gen_random_bytes(6),'hex'),1,8));
  insert into public.teams(name,join_code,owner_id) values(team_name,code,auth.uid()) returning id into tid;
  insert into public.team_members(team_id,user_id,role) values(tid,auth.uid(),'owner');
  return tid;
end $$;

create or replace function public.join_team(code text)
returns uuid language plpgsql security definer set search_path=public
as $$
declare tid uuid;
begin
  if auth.uid() is null then raise exception 'Not signed in'; end if;
  select id into tid from public.teams where join_code=upper(trim(code));
  if tid is null then raise exception 'Team code not found'; end if;
  insert into public.team_members(team_id,user_id,role) values(tid,auth.uid(),'coach')
  on conflict(team_id,user_id) do nothing;
  return tid;
end $$;

alter table public.teams enable row level security;
alter table public.team_members enable row level security;
alter table public.players enable row level security;
alter table public.lines enable row level security;
alter table public.line_players enable row level security;
alter table public.position_labels enable row level security;
alter table public.games enable row level security;
alter table public.game_plays enable row level security;
alter table public.play_players enable row level security;

-- Team membership
create policy "members read teams" on public.teams for select to authenticated using(public.is_team_member(id) or owner_id=auth.uid());
create policy "owner update team" on public.teams for update to authenticated using(owner_id=auth.uid()) with check(owner_id=auth.uid());
create policy "members read membership" on public.team_members for select to authenticated using(public.is_team_member(team_id) or user_id=auth.uid());
create policy "owner manages membership" on public.team_members for delete to authenticated using(exists(select 1 from public.teams t where t.id=team_id and t.owner_id=auth.uid()));

-- Team-scoped data
create policy "members read players" on public.players for select to authenticated using(public.is_team_member(team_id));
create policy "coaches write players" on public.players for all to authenticated using(public.is_team_member(team_id)) with check(public.is_team_member(team_id));

create policy "members read lines" on public.lines for select to authenticated using(public.is_team_member(team_id));
create policy "coaches write lines" on public.lines for all to authenticated using(public.is_team_member(team_id)) with check(public.is_team_member(team_id));

create policy "members read line players" on public.line_players for select to authenticated using(exists(select 1 from public.lines l where l.id=line_id and public.is_team_member(l.team_id)));
create policy "coaches write line players" on public.line_players for all to authenticated using(exists(select 1 from public.lines l where l.id=line_id and public.is_team_member(l.team_id))) with check(exists(select 1 from public.lines l where l.id=line_id and public.is_team_member(l.team_id)));

create policy "members read positions" on public.position_labels for select to authenticated using(public.is_team_member(team_id));
create policy "coaches write positions" on public.position_labels for all to authenticated using(public.is_team_member(team_id)) with check(public.is_team_member(team_id));

create policy "members read games" on public.games for select to authenticated using(public.is_team_member(team_id));
create policy "coaches write games" on public.games for all to authenticated using(public.is_team_member(team_id)) with check(public.is_team_member(team_id));

create policy "members read plays" on public.game_plays for select to authenticated using(exists(select 1 from public.games g where g.id=game_id and public.is_team_member(g.team_id)));
create policy "coaches write plays" on public.game_plays for all to authenticated using(exists(select 1 from public.games g where g.id=game_id and public.is_team_member(g.team_id))) with check(exists(select 1 from public.games g where g.id=game_id and public.is_team_member(g.team_id)));

create policy "members read play players" on public.play_players for select to authenticated using(exists(select 1 from public.game_plays gp join public.games g on g.id=gp.game_id where gp.id=game_play_id and public.is_team_member(g.team_id)));
create policy "coaches write play players" on public.play_players for all to authenticated using(exists(select 1 from public.game_plays gp join public.games g on g.id=gp.game_id where gp.id=game_play_id and public.is_team_member(g.team_id))) with check(exists(select 1 from public.game_plays gp join public.games g on g.id=gp.game_id where gp.id=game_play_id and public.is_team_member(g.team_id)));

-- Needed for browser Data API access.
grant usage on schema public to authenticated;
grant select,insert,update,delete on public.teams,public.team_members,public.players,public.lines,public.line_players,public.position_labels,public.games,public.game_plays,public.play_players to authenticated;
grant execute on function public.create_team(text), public.join_team(text) to authenticated;

-- Realtime: add the tables you want to receive updates for in the Supabase dashboard's Realtime publication.
