-- The "tag" was only ever the part's name, so the column and its shared list now use part vocabulary.
alter table part rename column tag to name;
alter table part_tag rename to part_name;
alter table part_name rename constraint part_tag_pkey to part_name_pkey;
alter index part_tag_name_lower_unique rename to part_name_lower_unique;
