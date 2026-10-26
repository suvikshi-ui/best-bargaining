-- Owner-controlled storefront settings and richer product pages.
alter table shop add column if not exists nav_categories text not null default '[]';
alter table shop add column if not exists hero_slides text not null default '[]';

alter table products add column if not exists images text not null default '[]';
alter table products add column if not exists description text not null default '';
alter table products add column if not exists show_description boolean not null default true;

alter table products drop constraint if exists products_description_len;
alter table products add constraint products_description_len check (char_length(description) <= 4000);
