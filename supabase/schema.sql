-- LP 컬렉션
create table if not exists lp_collection (
  id uuid primary key default gen_random_uuid(),
  user_id text not null,
  spotify_track_id text not null,
  track_name text not null,
  artist_name text not null,
  album_name text not null,
  album_art_url text,
  label_color text default '#C87830',
  label_text_color text default '#FFD88A',
  custom_text text,
  is_damaged boolean default false,
  last_played_at timestamptz,
  created_at timestamptz default now(),
  unique(user_id, spotify_track_id)
);

create index if not exists lp_collection_user_id_idx on lp_collection(user_id);

-- RLS 정책
alter table lp_collection enable row level security;

create policy "Users can manage their own LPs"
  on lp_collection for all
  using (auth.uid()::text = user_id OR user_id = current_setting('request.jwt.claims', true)::json->>'sub');

-- 방 상태
create table if not exists room_state (
  user_id text primary key,
  dust_level integer default 0 check (dust_level >= 0 and dust_level <= 100),
  last_cleaned_at timestamptz default now(),
  last_visited_at timestamptz default now(),
  player_skin text default 'classic-walnut',
  room_theme text default 'dark-library',
  coin_balance integer default 3 check (coin_balance >= 0)
);

alter table room_state enable row level security;

create policy "Users can manage their own room"
  on room_state for all
  using (auth.uid()::text = user_id OR user_id = current_setting('request.jwt.claims', true)::json->>'sub');

-- 코인 트랜잭션
create table if not exists coin_transactions (
  id uuid primary key default gen_random_uuid(),
  user_id text not null,
  amount integer not null,
  reason text not null check (reason in ('vending', 'purchase', 'streak_bonus', 'repair', 'custom_label')),
  created_at timestamptz default now()
);

create index if not exists coin_transactions_user_id_idx on coin_transactions(user_id);

alter table coin_transactions enable row level security;

create policy "Users can view their own transactions"
  on coin_transactions for select
  using (auth.uid()::text = user_id);

create policy "Service role can insert transactions"
  on coin_transactions for insert
  with check (true);
