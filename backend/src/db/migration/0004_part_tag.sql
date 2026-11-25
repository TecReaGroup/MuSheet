-- Parts are labelled by a free-text tag picked from one shared, editable list instead of a fixed
-- instrument enum. A score may hold several parts with the same tag (e.g. two keyboard charts).
create table part_tag (
  name     text primary key,
  position integer not null
);

create unique index part_tag_name_lower_unique on part_tag (lower(name));

insert into part_tag (name, position) values
  ('Vocal', 0), ('Keyboard', 1), ('Guitar', 2), ('Bass', 3), ('Drums', 4);

alter table part add column tag text;
update part set tag = coalesce(custom_label, initcap(instrument));
alter table part alter column tag set not null;

-- Dropping the columns also drops the instrument check and part_instrument_unique.
alter table part drop column instrument, drop column custom_label;
