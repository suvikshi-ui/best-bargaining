create table if not exists shop (
  id integer primary key,
  owner_user_id text
);

insert into shop (id, owner_user_id)
values (1, null)
on conflict (id) do nothing;

create table if not exists products (
  id serial primary key,
  user_id text not null,
  name text not null check (char_length(name) between 1 and 80),
  category text not null check (category in ('toys', 'rainy', 'everyday')),
  price integer not null check (price > 0 and price <= 5000000),
  stock integer not null check (stock >= 0 and stock <= 100000),
  blurb text not null default '' check (char_length(blurb) <= 400),
  image text not null check (char_length(image) between 1 and 200),
  badge text not null default '' check (badge in ('', 'new', 'best')),
  published boolean not null default true,
  created_at timestamptz not null default now()
);

create index if not exists products_user_idx on products (user_id);
create index if not exists products_published_idx on products (published);

create table if not exists orders (
  id serial primary key,
  items text not null,
  total integer not null check (total >= 0),
  created_at timestamptz not null default now()
);

insert into products (user_id, name, category, price, stock, blurb, image, badge)
values
  ('seed', 'Cedar Rainbow', 'toys', 1890, 14, 'Seven sanded cedar arches. Stack them into a gate or a small weather system.', '/products/rainbow.jpg', 'best'),
  ('seed', 'Moon Rabbit', 'toys', 1240, 22, 'A palm-sized rabbit in cream wool, one ear stitched with a tiny moon.', '/products/rabbit.jpg', 'new'),
  ('seed', 'Pocket Train', 'toys', 2450, 9, 'Three beech carriages and a quiet engine. No batteries, just a push.', '/products/train.jpg', ''),
  ('seed', 'Window Candle', 'rainy', 890, 31, 'Amber glass and a slow honey burn for the hour the rain starts.', '/products/candle.jpg', 'best'),
  ('seed', 'Night Throw', 'rainy', 3600, 7, 'Charcoal wool with a loose fringe. Enough for one person and a book.', '/products/throw.jpg', ''),
  ('seed', 'Rain Cup', 'rainy', 740, 26, 'Stoneware with a single glaze drip, sized for both hands.', '/products/mug.jpg', 'new'),
  ('seed', 'Reading Lamp', 'rainy', 5800, 4, 'A small brass lamp with a warm pool of light and nothing else.', '/products/lamp.jpg', 'best'),
  ('seed', 'Market Tote', 'everyday', 1150, 16, 'Heavy canvas, short handles, the bag that leaves with you.', '/products/tote.jpg', ''),
  ('seed', 'Clay Bowl', 'everyday', 980, 18, 'A wide breakfast bowl in raw clay. Fruit, noodles, or nothing at all.', '/products/bowl.jpg', '');
