import { createClient } from "@supabase/supabase-js";

const url = process.env.SUPABASE_URL;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!url || !serviceRoleKey) {
  throw new Error("SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY must be set (see .env.local)");
}

const [email, password, displayName] = process.argv.slice(2);
if (!email || !password || !displayName) {
  throw new Error("usage: npm run admin:create -- <email> <password> \"<display name>\"");
}

const supabase = createClient(url, serviceRoleKey);

async function main() {
  const { data: created, error: createError } = await supabase.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
  });
  if (createError) throw new Error(`auth.admin.createUser: ${createError.message}`);

  const { error: insertError } = await supabase.from("admin_users").insert({
    id: created.user.id,
    email,
    display_name: displayName,
  });
  if (insertError) throw new Error(`admin_users insert: ${insertError.message}`);

  console.log(`created admin ${email} (${created.user.id})`);
}

main();
