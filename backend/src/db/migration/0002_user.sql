-- Accounts created by root. Root itself has no row: its credentials live in .env.
create table app_user (
  id            uuid primary key default gen_random_uuid(),
  account       text not null check (length(account) between 1 and 40),
  password_hash text not null,
  -- Bumped on password change; session tokens carry it, so older sessions stop validating.
  session_epoch integer not null default 0,
  created_at    timestamptz not null default now()
);

create unique index app_user_account_unique on app_user (lower(account));

-- Keyed by text rather than a foreign key so root ('root') can have an avatar too.
-- No row means the default letter avatar.
create table user_avatar (
  user_id      text primary key,
  preset       text,
  image_sha256 text check (image_sha256 ~ '^[0-9a-f]{64}$'),
  check ((preset is null) <> (image_sha256 is null))
);

create index user_avatar_image_idx on user_avatar (image_sha256);
