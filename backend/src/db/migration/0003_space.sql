-- Every score and setlist lives in one space: a user's id (personal library) or 'team' (shared).
-- Content created before accounts existed belonged to the single admin, i.e. root.
alter table score add column space_key text;
update score set space_key = 'root';
alter table score alter column space_key set not null;
create index score_space_idx on score (space_key);

alter table setlist add column space_key text;
update setlist set space_key = 'root';
alter table setlist alter column space_key set not null;
create index setlist_space_idx on setlist (space_key);
