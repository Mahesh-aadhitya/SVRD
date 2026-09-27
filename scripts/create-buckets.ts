import { createClient } from "@supabase/supabase-js";

const url = process.env.SUPABASE_URL;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!url || !serviceRoleKey) {
  throw new Error("SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY must be set (see .env.local)");
}

const supabase = createClient(url, serviceRoleKey);

const buckets: { id: string; fileSizeLimitMb: number; mimeTypes: string[] }[] = [
  { id: "gallery", fileSizeLimitMb: 15, mimeTypes: ["image/jpeg", "image/png", "image/webp"] },
  { id: "songs", fileSizeLimitMb: 30, mimeTypes: ["audio/mpeg", "audio/mp4", "audio/wav", "audio/ogg"] },
];

async function main() {
  for (const bucket of buckets) {
    const { error } = await supabase.storage.createBucket(bucket.id, {
      public: true,
      fileSizeLimit: `${bucket.fileSizeLimitMb}MB`,
      allowedMimeTypes: bucket.mimeTypes,
    });
    if (error && !error.message.includes("already exists")) {
      throw new Error(`${bucket.id}: ${error.message}`);
    }
    console.log(`bucket ready: ${bucket.id}`);
  }
}

main();
