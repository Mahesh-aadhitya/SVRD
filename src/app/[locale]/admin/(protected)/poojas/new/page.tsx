import { setRequestLocale } from "next-intl/server";
import AdminPageHeader from "@/components/admin/AdminPageHeader";
import PoojaForm from "../PoojaForm";

export default async function NewPoojaPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);

  return (
    <div>
      <AdminPageHeader title="Add Pooja" />
      <PoojaForm />
    </div>
  );
}
