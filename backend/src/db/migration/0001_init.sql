create table pdf_file (
  sha256        text primary key check (sha256 ~ '^[0-9a-f]{64}$'),
  byte_size     integer not null check (byte_size > 0),
  page_count    integer not null check (page_count > 0),
  has_thumbnail boolean not null default false,
  created_at    timestamptz not null default now()
);

create table score (
  id             uuid primary key default gen_random_uuid(),
  title          text not null check (length(title) > 0),
  composer       text not null default '',
  bpm            integer not null default 120 check (bpm between 20 and 300),
  time_signature text not null default '4/4',
  created_at     timestamptz not null default now(),
  updated_at     timestamptz not null default now(),
  last_opened_at timestamptz
);

create index score_title_lower_idx on score (lower(title), lower(composer));

create table part (
  id           uuid primary key default gen_random_uuid(),
  score_id     uuid not null references score(id) on delete cascade,
  instrument   text not null check (instrument in ('vocal', 'keyboard', 'guitar', 'bass', 'drums', 'custom')),
  custom_label text,
  pdf_sha256   text not null references pdf_file(sha256),
  position     integer not null,
  created_at   timestamptz not null default now(),
  check ((instrument = 'custom') = (custom_label is not null))
);

create unique index part_instrument_unique on part (score_id, instrument, coalesce(custom_label, ''));
create index part_pdf_sha256_idx on part (pdf_sha256);

create table annotation_page (
  part_id     uuid not null references part(id) on delete cascade,
  page_number integer not null check (page_number > 0),
  strokes     jsonb not null,
  updated_at  timestamptz not null default now(),
  primary key (part_id, page_number)
);

create table setlist (
  id             uuid primary key default gen_random_uuid(),
  name           text not null check (length(name) > 0),
  description    text not null default '',
  created_at     timestamptz not null default now(),
  updated_at     timestamptz not null default now(),
  last_opened_at timestamptz
);

create table setlist_item (
  setlist_id uuid not null references setlist(id) on delete cascade,
  score_id   uuid not null references score(id) on delete cascade,
  position   integer not null,
  primary key (setlist_id, score_id)
);

create index setlist_item_score_idx on setlist_item (score_id);
