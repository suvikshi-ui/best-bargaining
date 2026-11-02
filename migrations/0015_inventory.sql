-- Soft archive, stock ledger and back-in-stock requests. Additive only.
alter table products add column if not exists archived boolean not null default false;

create table if not exists stock_movements (
  id serial primary key,
  product_id integer not null,
  delta integer not null,
  stock_after integer not null,
  reason text not null check (reason in ('order', 'order_rollback', 'owner_edit', 'owner_bump', 'restock')),
  order_id integer,
  created_at timestamptz not null default now()
);
create index if not exists stock_movements_product_idx on stock_movements (product_id, created_at desc);

create table if not exists stock_alerts (
  id serial primary key,
  product_id integer not null,
  email text not null check (char_length(email) between 3 and 120),
  created_at timestamptz not null default now(),
  notified_at timestamptz,
  unique (product_id, email)
);

-- Scheduled sale price, variants, more tags, order status.
alter table products add column if not exists sale_price integer;
alter table products add column if not exists sale_starts_at timestamptz;
alter table products add column if not exists sale_ends_at timestamptz;
alter table products add column if not exists variants text not null default '';
alter table products drop constraint if exists products_badge_check;
alter table products add constraint products_badge_check check (badge in ('', 'new', 'best', 'fast', 'limited'));
alter table orders add column if not exists status text not null default 'placed';
alter table orders drop constraint if exists orders_status_check;
alter table orders add constraint orders_status_check check (status in ('placed', 'confirmed', 'shipped', 'delivered', 'cancelled'));
