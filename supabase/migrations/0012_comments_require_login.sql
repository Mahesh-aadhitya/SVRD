-- Live comments are for signed-in devotees only. Each comment records the
-- account that posted it, and the open "anyone can insert" policy goes —
-- the public anon key could otherwise still post straight to the table.
-- Comments are now written only by the postLiveComment server action
-- (service role) after it checks the signed-in user.

alter table comments add column user_id uuid references auth.users(id) on delete set null;

drop policy comments_public_insert on comments;
