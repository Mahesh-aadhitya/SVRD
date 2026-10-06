"use client";

import { useActionState } from "react";
import { useLocale } from "next-intl";
import type { Locale } from "@/i18n/routing";
import { createEvent, updateEvent } from "@/lib/actions/events";
import ImageUploadField from "@/components/admin/ImageUploadField";
import DatePickerField from "@/components/calendar/DatePickerField";
import { localTodayIso } from "@/lib/dates";
import type { TempleEvent } from "@/lib/content-types";
import type { FolderTree } from "@/lib/folders";
import CategorySelect from "@/components/admin/CategorySelect";
import BilingualField from "@/components/admin/BilingualField";

export default function EventForm({ event, categories }: { event?: TempleEvent; categories: FolderTree }) {
  const locale = useLocale() as Locale;
  const action = event
    ? updateEvent.bind(null, event.id, locale)
    : createEvent.bind(null, locale);
  const [state, formAction, pending] = useActionState(action, undefined);

  return (
    <form action={formAction} className="max-w-xl space-y-5">
      <BilingualField
        label="Title"
        enName="titleEn"
        knName="titleKn"
        defaultEn={event?.title.en}
        defaultKn={event?.title.kn}
        required
      />

      <BilingualField
        label="Description"
        enName="descriptionEn"
        knName="descriptionKn"
        defaultEn={event?.description.en}
        defaultKn={event?.description.kn}
        required
        multiline
      />

      <DatePickerField
        name="eventDate"
        label="Date"
        defaultValue={event?.date}
        // Past dates can't be chosen; an already-past event keeps its date.
        min={event && event.date < localTodayIso() ? event.date : undefined}
        required
      />

      <ImageUploadField name="image" prefix="events" defaultValue={event?.image} />

      <CategorySelect categories={categories} defaultValue={event?.folderId} />

      {state?.error ? (
        <p className="rounded-xl bg-red-500/10 px-3 py-2 text-xs text-red-600">{state.error}</p>
      ) : null}

      <button
        type="submit"
        disabled={pending}
        className="rounded-full bg-gold px-5 py-2.5 text-sm font-semibold text-maroon-dark hover:brightness-105 disabled:opacity-60"
      >
        {pending ? "Saving…" : "Save"}
      </button>
    </form>
  );
}
