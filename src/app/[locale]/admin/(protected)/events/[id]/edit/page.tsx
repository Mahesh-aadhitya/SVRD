import { notFound } from "next/navigation";
import { setRequestLocale } from "next-intl/server";
import AdminPageHeader from "@/components/admin/AdminPageHeader";
import { getEventById } from "@/lib/data/events";
import EventForm from "../../EventForm";

export default async function EditEventPage({
  params,
}: {
  params: Promise<{ locale: string; id: string }>;
}) {
  const { locale, id } = await params;
  setRequestLocale(locale);

  const event = await getEventById(id);
  if (!event) notFound();

  return (
    <div>
      <AdminPageHeader title="Edit Event" />
      <EventForm event={event} />
    </div>
  );
}
