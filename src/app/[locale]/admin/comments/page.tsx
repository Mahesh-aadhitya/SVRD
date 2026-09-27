import { useTranslations } from "next-intl";
import { setRequestLocale } from "next-intl/server";
import AdminPageHeader from "@/components/admin/AdminPageHeader";
import CommentModerationList from "@/components/admin/CommentModerationList";

export default async function AdminCommentsPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);
  return <Content />;
}

function Content() {
  const t = useTranslations("admin");

  return (
    <div>
      <AdminPageHeader title={t("nav.comments")} />
      <CommentModerationList />
    </div>
  );
}
