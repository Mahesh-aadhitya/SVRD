import { setRequestLocale } from "next-intl/server";
import AdminPageHeader from "@/components/admin/AdminPageHeader";
import NoticeForm from "../NoticeForm";

export default async function NewNoticePage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  setRequestLocale(locale);

  return (
    <div>
      <AdminPageHeader title="Post a Notice" />
      <NoticeForm />
    </div>
  );
}
