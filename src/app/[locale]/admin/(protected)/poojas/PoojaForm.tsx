"use client";

import { useActionState } from "react";
import { useLocale } from "next-intl";
import type { Locale } from "@/i18n/routing";
import { createPooja, updatePooja } from "@/lib/actions/poojas";
import type { Pooja } from "@/lib/placeholder-data";

export default function PoojaForm({ pooja }: { pooja?: Pooja }) {
  const locale = useLocale() as Locale;
  const action = pooja
    ? updatePooja.bind(null, pooja.id, locale)
    : createPooja.bind(null, locale);
  const [state, formAction, pending] = useActionState(action, undefined);

  return (
    <form action={formAction} className="max-w-xl space-y-5">
      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="Name (English)" name="nameEn" defaultValue={pooja?.name.en} required />
        <Field label="Name (Kannada)" name="nameKn" defaultValue={pooja?.name.kn} required />
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <TextArea
          label="Description (English)"
          name="descriptionEn"
          defaultValue={pooja?.description.en}
          required
        />
        <TextArea
          label="Description (Kannada)"
          name="descriptionKn"
          defaultValue={pooja?.description.kn}
          required
        />
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <Field
          label="Timing"
          name="timing"
          defaultValue={pooja?.timing}
          placeholder="e.g. 5:30 AM"
          required
        />
        <Field label="Image URL" name="image" defaultValue={pooja?.image} />
      </div>

      <label className="flex items-center gap-2 text-sm text-ink/80">
        <input
          type="checkbox"
          name="isBookable"
          defaultChecked={pooja?.isBookable}
          className="h-4 w-4 rounded border-ink/20 bg-black/[0.03]"
        />
        Bookable as a seva
      </label>

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

function Field({
  label,
  name,
  defaultValue,
  placeholder,
  required,
}: {
  label: string;
  name: string;
  defaultValue?: string;
  placeholder?: string;
  required?: boolean;
}) {
  return (
    <div>
      <label className="text-sm font-medium text-ink/70" htmlFor={name}>
        {label}
      </label>
      <input
        id={name}
        name={name}
        defaultValue={defaultValue}
        placeholder={placeholder}
        required={required}
        className="mt-1.5 w-full rounded-xl border border-ink/15 bg-black/[0.03] px-4 py-2.5 text-sm text-ink outline-none focus:border-gold"
      />
    </div>
  );
}

function TextArea({
  label,
  name,
  defaultValue,
  required,
}: {
  label: string;
  name: string;
  defaultValue?: string;
  required?: boolean;
}) {
  return (
    <div>
      <label className="text-sm font-medium text-ink/70" htmlFor={name}>
        {label}
      </label>
      <textarea
        id={name}
        name={name}
        defaultValue={defaultValue}
        required={required}
        rows={3}
        className="mt-1.5 w-full rounded-xl border border-ink/15 bg-black/[0.03] px-4 py-2.5 text-sm text-ink outline-none focus:border-gold"
      />
    </div>
  );
}
