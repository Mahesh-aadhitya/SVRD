"use server";

import { z } from "zod";
import { revalidatePath } from "next/cache";
import { verifyAdminSession } from "@/lib/admin/dal";
import { createAdminClient } from "@/lib/supabase/admin";
import { ensureProfile, getDevotee } from "@/lib/devotee/auth";
import { getApprovedComments, LIVE_COMMENT_CONTEXT } from "@/lib/data/comments";
import type { CommentStatus, PublicComment } from "@/lib/content-types";

// ── Devotee-facing ───────────────────────────────────────────────────────

export async function fetchLiveComments(): Promise<PublicComment[]> {
  return getApprovedComments(LIVE_COMMENT_CONTEXT);
}

const commentSchema = z.object({
  text: z.string().trim().min(1).max(500),
});

export type PostCommentResult = { ok: true; comment: PublicComment } | { ok: false; error: "login" | "invalid" | "failed" };

// Only signed-in devotees can comment; the name shown is the one on their
// account. Post-moderation: comments appear immediately and admins hide
// abusive ones (and can now see which account posted them).
export async function postLiveComment(input: { text: string }): Promise<PostCommentResult> {
  const devotee = await getDevotee();
  if (!devotee) return { ok: false, error: "login" };
  const parsed = commentSchema.safeParse(input);
  if (!parsed.success) return { ok: false, error: "invalid" };

  const profile = await ensureProfile(devotee).catch(() => null);
  const authorName = (profile?.fullName || devotee.name || "Devotee").slice(0, 60);
  const id = crypto.randomUUID();
  const createdAt = new Date().toISOString();
  const { error } = await createAdminClient().from("comments").insert({
    id,
    user_id: devotee.id,
    author_name: authorName,
    text: parsed.data.text,
    context: LIVE_COMMENT_CONTEXT,
    created_at: createdAt,
  });
  if (error) {
    console.error("postLiveComment:", error.message);
    return { ok: false, error: "failed" };
  }
  return { ok: true, comment: { id, authorName, text: parsed.data.text, createdAt } };
}

// ── Admin ────────────────────────────────────────────────────────────────

export async function setCommentStatus(id: string, status: CommentStatus): Promise<void> {
  await verifyAdminSession();
  if (status !== "approved" && status !== "hidden") throw new Error("invalid status");
  const supabase = createAdminClient();
  const { error } = await supabase.from("comments").update({ status }).eq("id", id);
  if (error) throw new Error(error.message);
  revalidatePath("/[locale]/admin/comments", "page");
}

export async function deleteComment(id: string): Promise<void> {
  await verifyAdminSession();
  const supabase = createAdminClient();
  const { error } = await supabase.from("comments").delete().eq("id", id);
  if (error) throw new Error(error.message);
  revalidatePath("/[locale]/admin/comments", "page");
}
