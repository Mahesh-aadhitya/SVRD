-- Whether an email has an account, and if it's confirmed — for the site's
-- own code emails (a resent sign-up code may only go to an account that
-- exists and is still unconfirmed). Service role only.
create or replace function public.auth_email_status(p_email text)
returns text
language sql
stable
security definer
set search_path = ''
as $$
  select case when email_confirmed_at is null then 'unconfirmed' else 'confirmed' end
  from auth.users
  where lower(email) = lower(p_email)
  limit 1;
$$;
revoke all on function public.auth_email_status(text) from public, anon, authenticated;
grant execute on function public.auth_email_status(text) to service_role;
