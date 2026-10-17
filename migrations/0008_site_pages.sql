create table if not exists site_pages (
  slug text primary key,
  title text not null default '',
  note text not null default '',
  constraint site_pages_slug_len check (char_length(slug) between 1 and 40),
  constraint site_pages_title_len check (char_length(title) <= 120),
  constraint site_pages_note_len check (char_length(note) <= 400)
);
