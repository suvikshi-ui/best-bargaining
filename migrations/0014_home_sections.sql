-- Owner controls for the category sections lower on the homepage:
-- JSON list of { id, show, title, note, dealText } in display order.
-- '[]' means defaults (every category, current titles and "UPTO X% OFF").
alter table shop add column if not exists home_sections text not null default '[]';
