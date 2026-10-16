alter table orders add column if not exists customer_name text not null default '';
alter table orders add column if not exists customer_phone text not null default '';
alter table orders add column if not exists customer_email text not null default '';

alter table orders drop constraint if exists orders_customer_name_len;
alter table orders drop constraint if exists orders_customer_phone_len;
alter table orders drop constraint if exists orders_customer_email_len;
alter table orders add constraint orders_customer_name_len check (char_length(customer_name) <= 80);
alter table orders add constraint orders_customer_phone_len check (char_length(customer_phone) <= 16);
alter table orders add constraint orders_customer_email_len check (char_length(customer_email) <= 120);
