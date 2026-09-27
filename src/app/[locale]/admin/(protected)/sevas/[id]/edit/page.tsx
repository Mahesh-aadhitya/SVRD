import { notFound } from "next/navigation";
import { setRequestLocale } from "next-intl/server";
import AdminPageHeader from "@/components/admin/AdminPageHeader";
import { getSevaByIdForAdmin } from "@/lib/data/sevas";
import SevaForm from "../../SevaForm";

export default async function EditSevaPage({
  params,
}: {
  params: Promise<{ locale: string; id: string }>;
}) {
  const { locale, id } = await params;
  setRequestLocale(locale);

  const seva = await getSevaByIdForAdmin(id);
  if (!seva) notFound();

  return (
    <div>
      <AdminPageHeader title="Edit Seva" />
      <SevaForm seva={seva} />
    </div>
  );
}
