"use client";

import { useEffect, useRef, useState } from "react";
import { translateToKannada } from "@/lib/actions/translate";

const inputClass =
  "mt-1.5 w-full rounded-xl border border-ink/15 bg-black/[0.03] px-4 py-2.5 text-sm text-ink outline-none placeholder:text-ink/30 focus:border-gold";

const DEBOUNCE_MS = 900;

// English + Kannada field pair. While the admin types English, a Kannada
// translation is fetched in the background: it fills the Kannada box
// directly while that box is untouched, and once the admin has written or
// edited Kannada themselves it's only offered as a suggestion to accept.
export default function BilingualField({
  label,
  enName,
  knName,
  defaultEn,
  defaultKn,
  required,
  multiline,
  rows = 3,
  maxLength,
  placeholder,
}: {
  label: string;
  enName: string;
  knName: string;
  defaultEn?: string;
  defaultKn?: string;
  required?: boolean;
  multiline?: boolean;
  rows?: number;
  maxLength?: number;
  placeholder?: string;
}) {
  const [en, setEn] = useState(defaultEn ?? "");
  const [kn, setKn] = useState(defaultKn ?? "");
  // Existing Kannada counts as the admin's own text — never overwritten.
  const [knTouched, setKnTouched] = useState(!!defaultKn);
  const [suggestion, setSuggestion] = useState<string | null>(null);
  const [status, setStatus] = useState<"idle" | "loading" | "error" | "not_configured">("idle");
  const requestId = useRef(0);
  const lastTranslated = useRef(defaultEn ?? "");
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  // Read by the async translate callback, which would otherwise see a stale value.
  const knTouchedRef = useRef(knTouched);
  function markTouched(touched: boolean) {
    knTouchedRef.current = touched;
    setKnTouched(touched);
  }

  async function translate(text: string) {
    const trimmed = text.trim();
    if (trimmed.length < 2) return;
    const id = ++requestId.current;
    lastTranslated.current = trimmed;
    setStatus("loading");
    try {
      const result = await translateToKannada(trimmed);
      if (id !== requestId.current) return; // a newer request superseded this one
      if (!result.ok) {
        setStatus(result.error === "not_configured" ? "not_configured" : "error");
        return;
      }
      setStatus("idle");
      if (knTouchedRef.current) setSuggestion(result.text);
      else {
        setKn(result.text);
        setSuggestion(null);
      }
    } catch {
      if (id === requestId.current) setStatus("error");
    }
  }

  useEffect(() => () => {
    if (timer.current) clearTimeout(timer.current);
  }, []);

  function onEnglishChange(value: string) {
    setEn(value);
    if (timer.current) clearTimeout(timer.current);
    if (status === "not_configured") return;
    timer.current = setTimeout(() => {
      if (value.trim() !== lastTranslated.current) void translate(value);
    }, DEBOUNCE_MS);
  }

  const common = { required, maxLength, className: inputClass };

  return (
    <div className="grid gap-4 sm:grid-cols-2">
      <div>
        <label className="text-sm font-medium text-ink/70" htmlFor={enName}>
          {label} (English)
        </label>
        {multiline ? (
          <textarea id={enName} name={enName} rows={rows} value={en} placeholder={placeholder} onChange={(e) => onEnglishChange(e.target.value)} {...common} />
        ) : (
          <input id={enName} name={enName} value={en} placeholder={placeholder} onChange={(e) => onEnglishChange(e.target.value)} {...common} />
        )}
      </div>

      <div>
        <div className="flex items-center justify-between gap-2">
          <label className="text-sm font-medium text-ink/70" htmlFor={knName}>
            {label} (Kannada)
          </label>
          <button
            type="button"
            onClick={() => void translate(en)}
            disabled={en.trim().length < 2 || status === "loading" || status === "not_configured"}
            className="text-[11px] font-semibold text-maroon hover:underline disabled:opacity-40 disabled:no-underline"
          >
            {status === "loading" ? "Translating…" : "Translate from English"}
          </button>
        </div>
        {multiline ? (
          <textarea
            id={knName}
            name={knName}
            rows={rows}
            value={kn}
            onChange={(e) => {
              setKn(e.target.value);
              markTouched(e.target.value.trim() !== "");
            }}
            {...common}
          />
        ) : (
          <input
            id={knName}
            name={knName}
            value={kn}
            onChange={(e) => {
              setKn(e.target.value);
              markTouched(e.target.value.trim() !== "");
            }}
            {...common}
          />
        )}

        {suggestion && suggestion !== kn ? (
          <div className="mt-2 rounded-xl border border-gold/40 bg-gold/10 px-3 py-2 text-sm">
            <p className="text-[11px] font-semibold uppercase tracking-wide text-ink/50">Suggested Kannada</p>
            <p className="mt-0.5 whitespace-pre-line text-ink">{suggestion}</p>
            <div className="mt-1.5 flex gap-3">
              <button
                type="button"
                onClick={() => {
                  setKn(suggestion);
                  markTouched(false);
                  setSuggestion(null);
                }}
                className="text-xs font-semibold text-maroon hover:underline"
              >
                Use this
              </button>
              <button type="button" onClick={() => setSuggestion(null)} className="text-xs font-semibold text-ink/50 hover:underline">
                Dismiss
              </button>
            </div>
          </div>
        ) : null}
        {status === "loading" ? <p className="mt-1 text-[11px] text-ink/45">Translating…</p> : null}
        {status === "error" ? (
          <p className="mt-1 text-[11px] text-red-600">Couldn&rsquo;t translate right now — type Kannada manually or try again.</p>
        ) : null}
        {status === "not_configured" ? (
          <p className="mt-1 text-[11px] text-ink/45">Kannada suggestions are not set up on this server yet.</p>
        ) : null}
      </div>
    </div>
  );
}
