"use client";

import { useActionState } from "react";
import { useLocale } from "next-intl";
import type { Locale } from "@/i18n/routing";
import { deleteSeva } from "@/lib/actions/sevas";

export default function DeleteSevaForm({ id, name }: { id: string; name: string }) {
  const locale = useLocale() as Locale;
  const [state, formAction, pending] = useActionState(
    async () => deleteSeva(id, locale),
    undefined,
  );

  return (
    <form action={formAction} className="mt-10 max-w-xl rounded-2xl border border-red-500/20 p-4">
      <p className="text-sm font-medium text-ink">Delete this seva</p>
      <p className="mt-1 text-xs text-ink/55">
        Only possible when it has no bookings. Otherwise use &ldquo;Close&rdquo; on the Sevas page.
      </p>
      {state?.error ? (
        <p className="mt-3 rounded-xl bg-red-500/10 px-3 py-2 text-xs text-red-600">{state.error}</p>
      ) : null}
      <button
        type="submit"
        disabled={pending}
        onClick={(e) => {
          if (!window.confirm(`Delete "${name}"? This cannot be undone.`)) e.preventDefault();
        }}
        className="mt-3 rounded-full border border-red-500/40 px-4 py-2 text-xs font-semibold text-red-600 hover:bg-red-500/5 disabled:opacity-60"
      >
        {pending ? "Deleting…" : "Delete seva"}
      </button>
    </form>
  );
}
