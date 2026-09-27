import { notFound } from "next/navigation";
import { setRequestLocale } from "next-intl/server";
import AdminPageHeader from "@/components/admin/AdminPageHeader";
import { getPoojaById } from "@/lib/data/poojas";
import PoojaForm from "../../PoojaForm";

export default async function EditPoojaPage({
  params,
}: {
  params: Promise<{ locale: string; id: string }>;
}) {
  const { locale, id } = await params;
  setRequestLocale(locale);

  const pooja = await getPoojaById(id);
  if (!pooja) notFound();

  return (
    <div>
      <AdminPageHeader title="Edit Pooja" />
      <PoojaForm pooja={pooja} />
    </div>
  );
}
