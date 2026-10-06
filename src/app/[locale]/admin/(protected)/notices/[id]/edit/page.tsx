import { notFound } from "next/navigation";
import { setRequestLocale } from "next-intl/server";
import AdminPageHeader from "@/components/admin/AdminPageHeader";
import { getNoticeByIdForAdmin } from "@/lib/data/notices";
import NoticeForm from "../../NoticeForm";

export default async function EditNoticePage({ params }: { params: Promise<{ locale: string; id: string }> }) {
  const { locale, id } = await params;
  setRequestLocale(locale);

  const notice = await getNoticeByIdForAdmin(id);
  if (!notice) notFound();

  return (
    <div>
      <AdminPageHeader title="Edit Notice" />
      <NoticeForm notice={notice} />
    </div>
  );
}
