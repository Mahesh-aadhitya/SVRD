"use client";

import { useActionState, useState } from "react";
import { useLocale, useTranslations } from "next-intl";
import type { Locale } from "@/i18n/routing";
import { createNotice, updateNotice } from "@/lib/actions/notices";
import DatePickerField from "@/components/calendar/DatePickerField";
import BilingualField from "@/components/admin/BilingualField";
import { localTodayIso, maxIso } from "@/lib/dates";
import type { Notice, NoticeKind } from "@/lib/content-types";

const KINDS: NoticeKind[] = ["update", "ticket_release", "event_reminder", "alert"];
const inputClass =
  "mt-1.5 w-full rounded-xl border border-ink/15 bg-black/[0.03] px-4 py-2.5 text-sm text-ink outline-none placeholder:text-ink/30 focus:border-gold";

export default function NoticeForm({ notice }: { notice?: Notice }) {
  const locale = useLocale() as Locale;
  const t = useTranslations("notices.kinds");
  const action = notice ? updateNotice.bind(null, notice.id, locale) : createNotice.bind(null, locale);
  const [state, formAction, pending] = useActionState(action, undefined);
  const today = localTodayIso();
  const [publishOn, setPublishOn] = useState(notice?.publishOn ?? today);

  return (
    <form action={formAction} className="max-w-2xl space-y-5">
      <div>
        <p className="text-sm font-medium text-ink/70">Type</p>
        <div className="mt-1.5 flex flex-wrap gap-3">
          {KINDS.map((kind) => (
            <label key={kind} className="flex items-center gap-1.5 text-sm text-ink/80">
              <input type="radio" name="kind" value={kind} defaultChecked={(notice?.kind ?? "update") === kind} />
              {t(kind)}
            </label>
          ))}
        </div>
      </div>

      <BilingualField
        label="Title"
        enName="titleEn"
        knName="titleKn"
        defaultEn={notice?.title.en}
        defaultKn={notice?.title.kn}
        required
        maxLength={200}
      />
      <BilingualField
        label="Message"
        enName="bodyEn"
        knName="bodyKn"
        defaultEn={notice?.body.en}
        defaultKn={notice?.body.kn}
        required
        multiline
        rows={4}
        maxLength={3000}
      />

      <div>
        <label className="text-sm font-medium text-ink/70" htmlFor="linkUrl">
          Button link (optional)
        </label>
        <input
          id="linkUrl"
          name="linkUrl"
          defaultValue={notice?.linkUrl ?? ""}
          placeholder="/booking, /events, /live or https://…"
          className={inputClass}
        />
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <DatePickerField
          name="publishOn"
          label="Publish on"
          defaultValue={notice?.publishOn ?? today}
          // An already-published notice keeps its original date.
          min={notice && notice.publishOn < today ? notice.publishOn : today}
          required
          onChange={setPublishOn}
        />
        <DatePickerField
          name="expiresOn"
          label="Remove after (optional)"
          defaultValue={notice?.expiresOn}
          min={maxIso(today, publishOn)}
          placeholder="Keep until deleted"
          clearable
        />
      </div>

      <label className="flex items-center gap-2 text-sm text-ink/80">
        <input type="checkbox" name="isPinned" defaultChecked={notice?.isPinned} className="h-4 w-4" />
        Pin to the top of the notice board
      </label>

      {state?.error ? <p className="rounded-xl bg-red-500/10 px-3 py-2 text-xs text-red-600">{state.error}</p> : null}

      <button
        type="submit"
        disabled={pending}
        className="rounded-full bg-gold px-5 py-2.5 text-sm font-semibold text-maroon-dark hover:brightness-105 disabled:opacity-60"
      >
        {pending ? "Saving…" : notice ? "Save" : "Post notice"}
      </button>
    </form>
  );
}
