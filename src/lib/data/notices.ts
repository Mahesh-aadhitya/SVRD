import "server-only";
import { unstable_cache } from "next/cache";
import { createPublicClient } from "@/lib/supabase/public";
import { createAdminClient } from "@/lib/supabase/admin";
import { verifyAdminSession } from "@/lib/admin/dal";
import { todayInIndia } from "@/lib/dates";
import type { Notice } from "@/lib/content-types";

const NOTICE_COLUMNS = "id, kind, title, body, link_url, is_pinned, publish_on, expires_on, created_at";

type NoticeRow = {
  id: string;
  kind: Notice["kind"];
  title: Notice["title"];
  body: Notice["body"];
  link_url: string | null;
  is_pinned: boolean;
  publish_on: string;
  expires_on: string | null;
  created_at: string;
};

function mapRow(row: NoticeRow): Notice {
  return {
    id: row.id,
    kind: row.kind,
    title: row.title,
    body: row.body,
    linkUrl: row.link_url,
    isPinned: row.is_pinned,
    publishOn: row.publish_on,
    expiresOn: row.expires_on,
    createdAt: row.created_at,
  };
}

function sortNotices(a: Notice, b: Notice) {
  if (a.isPinned !== b.isPinned) return a.isPinned ? -1 : 1;
  return b.publishOn.localeCompare(a.publishOn) || b.createdAt.localeCompare(a.createdAt);
}

// RLS already hides notices scheduled for the future. The cache also
// expires hourly so scheduled notices appear (and expired ones vanish) on
// their dates even when nobody edits anything.
const getPublishedNotices = unstable_cache(
  async (): Promise<Notice[]> => {
    const supabase = createPublicClient();
    const { data, error } = await supabase
      .from("notices")
      .select(NOTICE_COLUMNS)
      .order("publish_on", { ascending: false })
      .limit(200);
    if (error) throw new Error(`getPublishedNotices: ${error.message}`);
    return (data ?? []).map(mapRow);
  },
  ["notices"],
  { tags: ["notices"], revalidate: 3600 },
);

export async function getActiveNotices(): Promise<Notice[]> {
  const today = todayInIndia();
  const notices = await getPublishedNotices();
  return notices
    .filter((n) => n.publishOn <= today && (!n.expiresOn || n.expiresOn >= today))
    .sort(sortNotices);
}

export async function getNoticesForAdmin(): Promise<Notice[]> {
  await verifyAdminSession();
  const supabase = createAdminClient();
  const { data, error } = await supabase
    .from("notices")
    .select(NOTICE_COLUMNS)
    .order("publish_on", { ascending: false })
    .order("created_at", { ascending: false });
  if (error) throw new Error(`getNoticesForAdmin: ${error.message}`);
  return (data ?? []).map(mapRow).sort(sortNotices);
}

export async function getNoticeByIdForAdmin(id: string): Promise<Notice | null> {
  const notices = await getNoticesForAdmin();
  return notices.find((n) => n.id === id) ?? null;
}
