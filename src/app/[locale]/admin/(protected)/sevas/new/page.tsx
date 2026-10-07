import { setRequestLocale } from "next-intl/server";
import AdminPageHeader from "@/components/admin/AdminPageHeader";
import { Link } from "@/i18n/navigation";
import { getFolders } from "@/lib/data/folders";
import { buildFolderTree } from "@/lib/folders";
import { getUpcomingImportantDays } from "@/lib/data/important-days";
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
      <Link href="/admin/sevas" className="text-xs font-semibold text-ink/50 hover:text-maroon">
        ← All sevas
      </Link>
      <AdminPageHeader title="Add a new seva" />
      <SevaForm categories={buildFolderTree(await getFolders("sevas"))} importantDays={await getUpcomingImportantDays()} />
    </div>
  );
}

