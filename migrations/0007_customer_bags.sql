create table if not exists customer_profiles (
  user_id text primary key,
  name text not null default '',
  email text not null default '',
  phone text not null default '',
  last_seen timestamptz not null default now(),
  constraint customer_profiles_name_len check (char_length(name) <= 80),
  constraint customer_profiles_email_len check (char_length(email) <= 120),
  constraint customer_profiles_phone_len check (char_length(phone) <= 16)
);

create table if not exists bags (
  user_id text not null,
  product_id integer not null references products (id) on delete cascade,
  qty integer not null,
  primary key (user_id, product_id),
  constraint bags_qty check (qty >= 1 and qty <= 12)
);
