alter table products drop constraint if exists products_image_check;
alter table products add constraint products_image_check
  check (char_length(image) >= 1 and char_length(image) <= 1500000);
