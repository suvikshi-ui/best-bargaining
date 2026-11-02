-- Owner-controlled public stock count and card discount badge. Additive only; null = automatic.
alter table products add column if not exists public_stock integer;
alter table products add column if not exists card_off_pct integer;
