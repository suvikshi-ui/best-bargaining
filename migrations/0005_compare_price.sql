alter table products add column if not exists compare_at integer;

update products set compare_at = 2690 where name = 'Cedar Rainbow' and compare_at is null;
update products set compare_at = 1650 where name = 'Moon Rabbit' and compare_at is null;
update products set compare_at = 3200 where name = 'Pocket Train' and compare_at is null;
update products set compare_at = 1290 where name = 'Window Candle' and compare_at is null;
update products set compare_at = 4800 where name = 'Night Throw' and compare_at is null;
update products set compare_at = 1100 where name = 'Rain Cup' and compare_at is null;
update products set compare_at = 7490 where name = 'Reading Lamp' and compare_at is null;
update products set compare_at = 1590 where name = 'Market Tote' and compare_at is null;
update products set compare_at = 1400 where name = 'Clay Bowl' and compare_at is null;
