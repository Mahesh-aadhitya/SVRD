"use client";

import { useEffect, useRef, useState } from "react";
import { proofread } from "@/lib/actions/proofread";

const IDLE_MS = 1200;
const MIN_LENGTH = 4;

type Suggestion = { text: string; notes: string; for: string };

// Spelling/grammar check for one field: runs once the admin pauses typing
// (or leaves the field), and holds a suggestion until it's accepted or
// dismissed. Text the admin already had checked isn't sent again.
export function useProofread(lang: "en" | "kn") {
  const [suggestion, setSuggestion] = useState<Suggestion | null>(null);
  const [status, setStatus] = useState<"idle" | "checking" | "clean" | "error" | "off">("idle");
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const requestId = useRef(0);
  const checked = useRef(new Set<string>());

  useEffect(() => () => {
    if (timer.current) clearTimeout(timer.current);
  }, []);

  async function check(text: string, force = false) {
    if (timer.current) clearTimeout(timer.current);
    const trimmed = text.trim();
    if (trimmed.length < MIN_LENGTH || status === "off") return;
    if (!force && checked.current.has(trimmed)) return;
    checked.current.add(trimmed);
    const id = ++requestId.current;
    setStatus("checking");
    try {
      const result = await proofread(trimmed, lang);
      if (id !== requestId.current) return;
      if (!result.ok) {
        setStatus(result.error === "not_configured" ? "off" : "error");
        checked.current.delete(trimmed);
        return;
      }
      if (result.clean) {
        setSuggestion(null);
        setStatus("clean");
      } else {
        setSuggestion({ text: result.suggestion, notes: result.notes, for: trimmed });
        setStatus("idle");
      }
    } catch {
      if (id === requestId.current) setStatus("error");
      checked.current.delete(trimmed);
    }
  }

  // Call on every keystroke: checks after a pause in typing.
  function onType(text: string) {
    if (timer.current) clearTimeout(timer.current);
    if (status === "clean" || status === "error") setStatus("idle");
    timer.current = setTimeout(() => void check(text), IDLE_MS);
  }

  function dismiss() {
    setSuggestion(null);
  }

  // The admin took the suggestion: it's correct by definition, so don't
  // send it back for another round.
  function accept(text: string) {
    checked.current.add(text.trim());
    setSuggestion(null);
    setStatus("clean");
  }

  return { suggestion, status, check, onType, dismiss, accept };
}

export function ProofreadNote({
  proof,
  current,
  onReplace,
}: {
  proof: ReturnType<typeof useProofread>;
  current: string;
  onReplace: (text: string) => void;
}) {
  const { suggestion, status } = proof;
  // A suggestion is stale once the admin has typed on past it.
  const live = suggestion && suggestion.for === current.trim() && suggestion.text !== current.trim();

  return (
    <>
      {live ? (
        <div className="mt-2 rounded-xl border border-sky-500/30 bg-sky-500/[0.07] px-3 py-2 text-sm">
          <p className="text-[11px] font-semibold uppercase tracking-wide text-sky-800/70">Suggested wording</p>
          <p className="mt-0.5 whitespace-pre-line text-ink">{suggestion.text}</p>
          {suggestion.notes ? <p className="mt-1 text-[11px] text-ink/50">{suggestion.notes}</p> : null}
          <div className="mt-1.5 flex gap-3">
            <button
              type="button"
              onClick={() => {
                onReplace(suggestion.text);
                proof.accept(suggestion.text);
              }}
              className="text-xs font-semibold text-maroon hover:underline"
            >
              Replace
            </button>
            <button type="button" onClick={proof.dismiss} className="text-xs font-semibold text-ink/50 hover:underline">
              Keep mine
            </button>
          </div>
        </div>
      ) : null}
      {status === "checking" ? <p className="mt-1 text-[11px] text-ink/45">Checking spelling &amp; grammar…</p> : null}
      {status === "clean" && current.trim().length >= 4 ? (
        <p className="mt-1 text-[11px] text-green-700">✓ Spelling &amp; grammar look good</p>
      ) : null}
      {status === "error" ? <p className="mt-1 text-[11px] text-ink/45">Couldn&rsquo;t check spelling right now.</p> : null}
    </>
  );
}

export function CheckButton({ proof, text }: { proof: ReturnType<typeof useProofread>; text: string }) {
  if (proof.status === "off") return null;
  return (
    <button
      type="button"
      onClick={() => void proof.check(text, true)}
      disabled={text.trim().length < MIN_LENGTH || proof.status === "checking"}
      className="text-[11px] font-semibold text-sky-800 hover:underline disabled:opacity-40 disabled:no-underline"
    >
      {proof.status === "checking" ? "Checking…" : "Check & polish"}
    </button>
  );
}
