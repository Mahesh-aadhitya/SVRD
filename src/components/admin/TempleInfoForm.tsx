"use client";

import { useActionState } from "react";
import { updateTempleInfo } from "@/lib/actions/temple-info";
import type { TempleInfo } from "@/lib/content-types";
import BilingualField from "@/components/admin/BilingualField";

const inputClass =
  "mt-1.5 w-full rounded-xl border border-ink/15 bg-black/[0.03] px-4 py-2.5 text-sm text-ink outline-none placeholder:text-ink/30 focus:border-gold";

export default function TempleInfoForm({ info }: { info: TempleInfo }) {
  const [state, formAction, pending] = useActionState(updateTempleInfo, undefined);

  return (
    <form action={formAction} className="max-w-2xl space-y-5">
      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="Address line 1" name="addressLine1" defaultValue={info.addressLine1} />
        <Field label="Address line 2 (city, state, PIN)" name="addressLine2" defaultValue={info.addressLine2} />
        <Field label="Phone" name="phone" defaultValue={info.phone} type="tel" />
        <Field label="Email" name="email" defaultValue={info.email} type="email" />
      </div>

      <div>
        <Field label="Google Maps search" name="mapsQuery" defaultValue={info.mapsQuery} />
        <p className="mt-1.5 text-xs text-ink/45">
          The place name or full address exactly as you&rsquo;d type it into Google Maps — used for the map and the
          &ldquo;Get directions&rdquo; button.
        </p>
      </div>

      <div>
        <label className="text-sm font-medium text-ink/70" htmlFor="timings">
          Temple timings
        </label>
        <textarea
          id="timings"
          name="timings"
          rows={4}
          defaultValue={info.timings.map((row) => `${row.day} | ${row.hours}`).join("\n")}
          placeholder={"Mon – Fri | 5:30 AM – 9:00 PM\nSat – Sun | 5:00 AM – 9:30 PM"}
          className={`${inputClass} font-mono`}
        />
        <p className="mt-1.5 text-xs text-ink/45">One per line: day(s), a vertical bar |, then the hours.</p>
      </div>

      <BilingualField
        label="About the temple"
        enName="aboutEn"
        knName="aboutKn"
        defaultEn={info.about.en}
        defaultKn={info.about.kn}
        multiline
        rows={6}
        maxLength={5000}
      />

      {state?.error ? (
        <p className="rounded-xl bg-red-500/10 px-3 py-2 text-xs text-red-600">{state.error}</p>
      ) : null}
      {state?.success ? <p className="rounded-xl bg-gold/15 px-3 py-2 text-xs text-maroon">Saved.</p> : null}

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
}: {
  label: string;
  name: string;
  defaultValue: string;
  type?: string;
}) {
  return (
    <div>
      <label className="text-sm font-medium text-ink/70" htmlFor={name}>
        {label}
      </label>
      <input id={name} name={name} type={type} defaultValue={defaultValue} className={inputClass} />
    </div>
  );
}
