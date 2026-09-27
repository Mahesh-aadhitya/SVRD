"use client";

import { useActionState } from "react";
import { releaseSeva } from "@/lib/actions/sevas";
import type { Seva } from "@/lib/seva-types";

function today() {
  return new Date().toISOString().slice(0, 10);
}

export default function ReleaseSevaForm({ seva }: { seva: Seva }) {
  const action = releaseSeva.bind(null, seva.id);
  const [state, formAction, pending] = useActionState(action, undefined);

  return (
    <form action={formAction} className="flex flex-wrap items-center justify-end gap-1.5">
      <input
        type="date"
        name="startDate"
        defaultValue={seva.releaseStartDate ?? today()}
        required
        aria-label="Release start date"
        className="rounded-md border border-ink/15 bg-white px-1.5 py-1 text-xs text-ink outline-none focus:border-gold"
      />
      <span className="text-xs text-ink/40">to</span>
      <input
        type="date"
        name="endDate"
        defaultValue={seva.releaseEndDate ?? undefined}
        required
        aria-label="Release end date"
        className="rounded-md border border-ink/15 bg-white px-1.5 py-1 text-xs text-ink outline-none focus:border-gold"
      />
      <button
        type="submit"
        disabled={pending}
        className="text-xs font-semibold text-maroon hover:underline disabled:opacity-50"
      >
        {pending ? "…" : seva.isActive ? "Update" : "Release"}
      </button>
      {state?.error ? <span className="w-full text-right text-[11px] text-red-600">{state.error}</span> : null}
    </form>
  );
}
