-- Owner-defined discounts (first order, festival, spend-more, bulk, flat coupon,
-- loyal guest codes).
-- Every value starts blank/off; a discount applies only when active and filled in.
create table if not exists discounts (
  id serial primary key,
  type text not null,
  name text not null default '',
  code text,
  phone text not null default '',
  pct integer,
  amount integer,
  cap integer,
  min_subtotal integer,
  min_items integer,
  starts_at timestamptz,
  ends_at timestamptz,
  categories text not null default '[]',
  max_uses integer,
  active boolean not null default false,
  created_at timestamptz not null default now(),
  constraint discounts_type check (type in ('first_order', 'festival', 'spend', 'bulk', 'flat', 'guest')),
  constraint discounts_name_len check (char_length(name) <= 80),
  constraint discounts_pct check (pct is null or pct between 0 and 90),
  constraint discounts_amounts check (
    (amount is null or amount >= 0) and (cap is null or cap >= 0)
    and (min_subtotal is null or min_subtotal >= 0) and (min_items is null or min_items >= 1)
    and (max_uses is null or max_uses >= 0)
  )
);
create unique index if not exists discounts_code_upper on discounts (upper(code)) where code is not null;

alter table shop add column if not exists stack_referral boolean not null default false;

-- What was applied to each order. discount_amount (from 0010) stays the total discount.
alter table orders add column if not exists discount_type text not null default '';
alter table orders add column if not exists discount_label text not null default '';
alter table orders add column if not exists discount_id integer;
alter table orders add column if not exists discounts_applied text not null default '[]';
