create table if not exists referral_agents (
  id serial primary key,
  name text not null,
  code text not null unique,
  discount_pct integer,
  active boolean not null default true,
  created_at timestamptz not null default now(),
  constraint referral_agents_name_len check (char_length(name) between 1 and 80),
  constraint referral_agents_discount check (discount_pct is null or (discount_pct between 0 and 90))
);

alter table orders add column if not exists referral_code text not null default '';
alter table orders add column if not exists referral_agent_id integer;
alter table orders add column if not exists discount_amount integer not null default 0;
