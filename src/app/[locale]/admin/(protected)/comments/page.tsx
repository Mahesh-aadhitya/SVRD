import { useTranslations } from "next-intl";
import { setRequestLocale } from "next-intl/server";
import AdminPageHeader from "@/components/admin/AdminPageHeader";
import CommentModerationList from "@/components/admin/CommentModerationList";
import { getCommentsForAdmin } from "@/lib/data/comments";
import type { AdminComment } from "@/lib/content-types";

export default async function AdminCommentsPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);
  const comments = await getCommentsForAdmin();
  return <Content comments={comments} />;
}

function Content({ comments }: { comments: AdminComment[] }) {
  const t = useTranslations("admin");

  return (
    <div>
      <AdminPageHeader title={t("nav.comments")} />
      <p className="mb-4 text-sm text-ink/60">
        Devotee comments appear on the Live page immediately. Hide or delete anything inappropriate — it disappears
        from devotees&rsquo; screens within seconds.
      </p>
      <CommentModerationList comments={comments} />
    </div>
  );
}
