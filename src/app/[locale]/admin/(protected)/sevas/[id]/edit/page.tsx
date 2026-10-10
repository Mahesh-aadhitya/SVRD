import { notFound } from "next/navigation";
import { setRequestLocale } from "next-intl/server";
import AdminPageHeader from "@/components/admin/AdminPageHeader";
import { Link } from "@/i18n/navigation";
import { getFolders } from "@/lib/data/folders";
import { buildFolderTree } from "@/lib/folders";
import { getUpcomingImportantDays } from "@/lib/data/important-days";
import { getSevaByIdForAdmin } from "@/lib/data/sevas";
import SevaForm from "../../SevaForm";
import DeleteSevaForm from "../../DeleteSevaForm";

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
    <div className="pb-28">
      <Link href="/admin/sevas" className="text-xs font-semibold text-ink/50 hover:text-maroon">
        ← All sevas
      </Link>
      <AdminPageHeader title={`Edit — ${seva.name.en}`} />
      <SevaForm seva={seva} categories={buildFolderTree(await getFolders("sevas"))} importantDays={await getUpcomingImportantDays()} />
      <DeleteSevaForm id={seva.id} name={seva.name.en} />
    </div>
  );
}

