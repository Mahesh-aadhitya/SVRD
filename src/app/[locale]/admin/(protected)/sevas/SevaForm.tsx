"use client";

import { useActionState } from "react";
import { useLocale } from "next-intl";
import type { Locale } from "@/i18n/routing";
import { createSeva, updateSeva } from "@/lib/actions/sevas";
import type { Seva } from "@/lib/seva-types";

export default function SevaForm({ seva }: { seva?: Seva }) {
  const locale = useLocale() as Locale;
  const action = seva ? updateSeva.bind(null, seva.id, locale) : createSeva.bind(null, locale);
  const [state, formAction, pending] = useActionState(action, undefined);

  return (
    <form action={formAction} className="max-w-xl space-y-5">
      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="Name (English)" name="nameEn" defaultValue={seva?.name.en} required />
        <Field label="Name (Kannada)" name="nameKn" defaultValue={seva?.name.kn} required />
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <TextArea
          label="Description (English)"
          name="descriptionEn"
          defaultValue={seva?.description.en}
          required
        />
        <TextArea
          label="Description (Kannada)"
          name="descriptionKn"
          defaultValue={seva?.description.kn}
          required
        />
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <Field
          label="Price (₹, 0 = free)"
          name="price"
          type="number"
          defaultValue={seva ? String(seva.price) : "0"}
          required
        />
        <Field
          label="Capacity per slot"
          name="capacityPerSlot"
          type="number"
          defaultValue={seva ? String(seva.capacityPerSlot) : "1"}
          required
        />
      </div>

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
  type = "text",
  required,
}: {
  label: string;
  name: string;
  defaultValue?: string;
  type?: string;
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
        type={type}
        defaultValue={defaultValue}
        required={required}
        min={type === "number" ? 0 : undefined}
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
