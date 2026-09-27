import { setRequestLocale } from "next-intl/server";
import AdminPageHeader from "@/components/admin/AdminPageHeader";
import SevaForm from "../SevaForm";

export default async function NewSevaPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);

  return (
    <div>
      <AdminPageHeader title="Add Seva" />
      <SevaForm />
    </div>
  );
}
