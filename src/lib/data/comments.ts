import "server-only";
import { verifyAdminSession } from "@/lib/admin/dal";
import { createAdminClient } from "@/lib/supabase/admin";
import { createPublicClient } from "@/lib/supabase/public";
import type { AdminComment, PublicComment } from "@/lib/content-types";
import { publicName } from "@/lib/tidy";

export const LIVE_COMMENT_CONTEXT = "live";

// Uncached on purpose: the live comment feed is polled and must show new
// comments within seconds. The anon client + comments_public_read RLS
// policy guarantee hidden comments never reach devotees.
export async function getApprovedComments(context: string, limit = 50): Promise<PublicComment[]> {
  const supabase = createPublicClient();
  const { data, error } = await supabase
    .from("comments")
    .select("id, author_name, text, created_at")
    .eq("context", context)
    .order("created_at", { ascending: false })
    .limit(limit);
  if (error) throw new Error(`getApprovedComments: ${error.message}`);
  return (data ?? []).map((row) => ({
    id: row.id,
    authorName: publicName(row.author_name),
    text: row.text,
    createdAt: row.created_at,
  }));
}

export async function getCommentsForAdmin(): Promise<AdminComment[]> {
  await verifyAdminSession();
  const supabase = createAdminClient();
  const { data, error } = await supabase
    .from("comments")
    .select("id, author_name, text, context, status, created_at")
    .order("created_at", { ascending: false })
    .limit(300);
  if (error) throw new Error(`getCommentsForAdmin: ${error.message}`);
  return (data ?? []).map((row) => ({
    id: row.id,
    authorName: row.author_name,
    text: row.text,
    context: row.context,
    status: row.status,
    createdAt: row.created_at,
  }));
}

export async function getCommentCountForAdmin(): Promise<number> {
  await verifyAdminSession();
  const supabase = createAdminClient();
  const { count, error } = await supabase.from("comments").select("id", { count: "exact", head: true });
  if (error) throw new Error(`getCommentCountForAdmin: ${error.message}`);
  return count ?? 0;
}
