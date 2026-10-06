import { setRequestLocale } from "next-intl/server";
import AdminPageHeader from "@/components/admin/AdminPageHeader";
import { getFolders } from "@/lib/data/folders";
import { buildFolderTree } from "@/lib/folders";
import EventForm from "../EventForm";

export default async function NewEventPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);

  return (
    <div>
      <AdminPageHeader title="Add Event" />
      <EventForm categories={buildFolderTree(await getFolders("events"))} />
    </div>
  );
}
