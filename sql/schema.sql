-- ============================================================
-- study : Neon (Postgres + Neon Auth + Data API) schema
-- 認証は Neon Auth(Better Auth)。JWT の sub は auth.user_id() で取得
-- クライアントから直接変更できるのは自分の chats / memos / watched_videos /
-- link_clicks と profiles.username のみ。ポイントは apply_points() 経由
-- ============================================================

create table public.profiles (
  id          text primary key default auth.user_id(),
  username    text not null unique check (char_length(username) between 1 and 40),
  is_admin    boolean not null default false,
  points      integer not null default 20000 check (points >= 0),
  created_at  timestamptz not null default now()
);

-- ポイントのルール表（金額はサーバー側で固定。クライアントは action 名しか渡せない）
create table public.point_rules (
  action      text primary key,
  delta       integer not null check (delta <> 0),
  limit_type  text not null default 'none' check (limit_type in ('none', 'daily', 'once_ref')),
  description text
);

insert into public.point_rules (action, delta, limit_type, description) values
  ('quiz_answer',     -100,  'none',     'クイズ回答'),
  ('chat_send',       -100,  'none',     'チャット送信'),
  ('term_search',      -50,  'none',     '用語検索'),
  ('elearning_visit', 2000,  'daily',    'eラーニング参加(1日1回)'),
  ('survey_answer',   1000,  'once_ref', 'アンケート回答'),
  ('story_read',      1000,  'once_ref', '物語閲覧(各物語1回)'),
  ('video_watch',     1000,  'once_ref', '動画視聴完了(各動画1回)'),
  ('weather_check',    500,  'daily',    '天気情報確認(1日1回)'),
  ('train_check',      500,  'daily',    '電車情報確認(1日1回)'),
  ('manual_view',      300,  'daily',    'マニュアル閲覧(1日1回)'),
  ('daily_login',      500,  'daily',    'デイリーログインボーナス'),
  ('story_link_click', 200,  'once_ref', '物語リンククリック(各リンク1回)');

create table public.point_history (
  id             bigint generated always as identity primary key,
  user_id        text not null references public.profiles(id) on delete cascade,
  action         text not null,
  ref            text,
  delta          integer not null,
  balance_after  integer not null,
  created_at     timestamptz not null default now()
);
create index point_history_user_idx on public.point_history (user_id, created_at desc);
create unique index point_history_once_ref_idx on public.point_history (user_id, action, ref) where ref is not null;

create table public.chat_messages (
  id          bigint generated always as identity primary key,
  user_id     text not null default auth.user_id() references public.profiles(id) on delete cascade,
  msg_id      text not null,
  sender      text not null,
  body        text not null check (char_length(body) <= 10000),
  is_read     boolean not null default false,
  created_at  timestamptz not null default now(),
  unique (user_id, msg_id)
);
create index chat_messages_user_idx on public.chat_messages (user_id, id);

create table public.memos (
  id          bigint generated always as identity primary key,
  user_id     text not null default auth.user_id() references public.profiles(id) on delete cascade,
  target      text not null default '',
  body        text not null check (char_length(body) <= 10000),
  updated_at  timestamptz not null default now(),
  unique (user_id, target)
);

create table public.watched_videos (
  user_id     text not null default auth.user_id() references public.profiles(id) on delete cascade,
  video_id    text not null,
  watched_at  timestamptz not null default now(),
  primary key (user_id, video_id)
);

create table public.link_clicks (
  user_id  text not null default auth.user_id() references public.profiles(id) on delete cascade,
  url      text not null,
  count    integer not null default 0 check (count >= 0),
  primary key (user_id, url)
);

-- ============================================================
-- Functions
-- ============================================================

-- サインアップ/ログイン後に呼ぶ。プロフィールが無ければ作る（is_admin は常に false）
create or replace function public.ensure_profile(p_username text)
returns public.profiles
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_uid text := auth.user_id();
  v_row public.profiles;
begin
  if v_uid is null then
    raise exception 'not authenticated';
  end if;
  insert into public.profiles (id, username)
  values (v_uid, btrim(p_username))
  on conflict (id) do nothing;
  select * into v_row from public.profiles where id = v_uid;
  return v_row;
end;
$$;

-- ポイント増減。戻り値: 新しい残高 / すでに付与済み(daily・once_ref)の場合は NULL
create or replace function public.apply_points(p_action text, p_ref text default null)
returns integer
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_uid  text := auth.user_id();
  v_rule public.point_rules;
  v_cur  integer;
  v_new  integer;
begin
  if v_uid is null then
    raise exception 'not authenticated';
  end if;

  select * into v_rule from public.point_rules where action = p_action;
  if not found then
    raise exception 'unknown action: %', p_action;
  end if;

  select points into v_cur from public.profiles where id = v_uid for update;
  if not found then
    raise exception 'profile not found';
  end if;

  if v_rule.limit_type = 'daily' and exists (
    select 1 from public.point_history h
     where h.user_id = v_uid and h.action = p_action
       and (h.created_at at time zone 'Asia/Tokyo')::date = (now() at time zone 'Asia/Tokyo')::date
  ) then
    return null;
  end if;

  if v_rule.limit_type = 'once_ref' then
    if p_ref is null or p_ref = '' then
      raise exception 'ref required';
    end if;
    if exists (
      select 1 from public.point_history h
       where h.user_id = v_uid and h.action = p_action and h.ref = p_ref
    ) then
      return null;
    end if;
  end if;

  if v_cur + v_rule.delta < 0 then
    raise exception 'insufficient points';
  end if;

  update public.profiles set points = points + v_rule.delta where id = v_uid
  returning points into v_new;

  insert into public.point_history (user_id, action, ref, delta, balance_after)
  values (v_uid, p_action,
          case when v_rule.limit_type = 'once_ref' then p_ref else null end,
          v_rule.delta, v_new);

  return v_new;
end;
$$;

-- 管理者判定（is_admin は SQL からのみ変更可能。クライアントは書き換えられない）
create or replace function public.is_admin()
returns boolean
language sql stable security definer
set search_path = ''
as $$ select coalesce((select p.is_admin from public.profiles p where p.id = auth.user_id()), false) $$;

revoke execute on function public.is_admin()                 from public;
grant  execute on function public.is_admin()                 to authenticated;
revoke execute on function public.ensure_profile(text)       from public;
revoke execute on function public.apply_points(text, text)   from public;
grant  execute on function public.ensure_profile(text)       to authenticated;
grant  execute on function public.apply_points(text, text)   to authenticated;

-- ============================================================
-- Row Level Security
-- ============================================================
alter table public.profiles       enable row level security;
alter table public.point_rules    enable row level security;
alter table public.point_history  enable row level security;
alter table public.chat_messages enable row level security;
alter table public.memos          enable row level security;
alter table public.watched_videos enable row level security;
alter table public.link_clicks    enable row level security;

create policy profiles_select_own on public.profiles
  for select to authenticated using (id = (select auth.user_id()));
create policy profiles_update_own on public.profiles
  for update to authenticated
  using (id = (select auth.user_id())) with check (id = (select auth.user_id()));

create policy point_rules_select on public.point_rules
  for select to authenticated using (true);

create policy point_history_select_own on public.point_history
  for select to authenticated using (user_id = (select auth.user_id()));

create policy chat_messages_own on public.chat_messages
  for all to authenticated
  using (user_id = (select auth.user_id())) with check (user_id = (select auth.user_id()));
create policy chat_messages_admin_select on public.chat_messages
  for select to authenticated using (public.is_admin());
create policy chat_messages_admin_insert on public.chat_messages
  for insert to authenticated with check (public.is_admin());
create policy profiles_admin_select on public.profiles
  for select to authenticated using (public.is_admin());
create policy memos_admin_select on public.memos
  for select to authenticated using (public.is_admin());
create policy memos_own on public.memos
  for all to authenticated
  using (user_id = (select auth.user_id())) with check (user_id = (select auth.user_id()));
create policy watched_videos_own on public.watched_videos
  for all to authenticated
  using (user_id = (select auth.user_id())) with check (user_id = (select auth.user_id()));
create policy link_clicks_own on public.link_clicks
  for all to authenticated
  using (user_id = (select auth.user_id())) with check (user_id = (select auth.user_id()));

-- ============================================================
-- Grants（Data API は GRANT + RLS で認可される）
-- ============================================================
grant usage on schema public to authenticated;
grant select on public.profiles, public.point_history, public.point_rules to authenticated;
grant update (username) on public.profiles to authenticated;
grant select, insert, update, delete on public.chat_messages, public.memos,
      public.watched_videos, public.link_clicks to authenticated;
grant usage, select on all sequences in schema public to authenticated;

-- ============================================================
-- 自動取得データ（天気・電車）。Neon Function `scraper` が書き込み、画面は読むだけ
-- ============================================================
create table public.site_data (
  key         text primary key,            -- 'weather' | 'train'
  payload     jsonb not null,
  updated_at  timestamptz not null default now()
);
alter table public.site_data enable row level security;
create policy site_data_select on public.site_data for select to authenticated using (true);
grant select on public.site_data to authenticated;
