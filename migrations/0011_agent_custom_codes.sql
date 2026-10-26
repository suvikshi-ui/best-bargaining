-- Owner-typed agent codes: a code may be blank until the owner sets it,
-- and codes are unique case-insensitively.
alter table referral_agents alter column code drop not null;
update referral_agents set code = null where code = '';
alter table referral_agents drop constraint if exists referral_agents_code_key;
create unique index if not exists referral_agents_code_upper on referral_agents (upper(code)) where code is not null;
