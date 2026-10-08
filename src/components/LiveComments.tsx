"use client";

import { useEffect, useState } from "react";
import { useLocale, useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";
import { useSessionUser } from "@/components/account/useSessionUser";
import { fetchLiveComments, postLiveComment } from "@/lib/actions/comments";
import type { PublicComment } from "@/lib/content-types";
import { stableIntl } from "@/lib/dates";

const POLL_MS = 10_000;

export default function LiveComments({ initial }: { initial: PublicComment[] }) {
  const t = useTranslations("live");
  const locale = useLocale();
  const [comments, setComments] = useState(initial);
  const [text, setText] = useState("");
  const [posting, setPosting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  // Commenting needs a signed-in devotee; reading doesn't. undefined = still checking.
  const user = useSessionUser();

  // Polling keeps hidden-by-admin comments disappearing too, which a
  // push-only feed of inserts wouldn't.
  useEffect(() => {
    const id = setInterval(() => {
      if (document.visibilityState !== "visible") return;
      fetchLiveComments()
        .then(setComments)
        .catch(() => {});
    }, POLL_MS);
    return () => clearInterval(id);
  }, []);

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    setPosting(true);
    setError(null);
    try {
      const result = await postLiveComment({ text });
      if (!result.ok) {
        setError(t(result.error === "login" ? "commentLogin" : "commentError"));
        return;
      }
      setComments((prev) => [result.comment, ...prev.filter((c) => c.id !== result.comment.id)]);
      setText("");
    } catch {
      setError(t("commentError"));
    } finally {
      setPosting(false);
    }
  }

  // Temple time (IST) so the server (UTC) and the phone agree on the hour.
  const time = (iso: string) =>
    stableIntl(new Date(iso).toLocaleString(locale === "kn" ? "kn-IN" : "en-IN", {
      timeZone: "Asia/Kolkata",
      day: "numeric",
      month: "short",
      hour: "numeric",
      minute: "2-digit",
    }));

  return (
    <div className="mt-4 space-y-4">
      {user === undefined ? (
        <div className="h-[9.5rem] rounded-2xl border border-gold/30 bg-white/40" aria-hidden />
      ) : user === null ? (
        <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-gold/30 bg-white/70 p-4">
          <p className="text-sm text-ink/70">{t("commentSignIn")}</p>
          <Link
            href={{ pathname: "/login", query: { next: "/live" } }}
            className="rounded-full bg-maroon px-5 py-2 text-sm font-semibold text-cream hover:bg-maroon-dark"
          >
            {t("commentSignInCta")}
          </Link>
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="space-y-2 rounded-2xl border border-gold/30 bg-white/70 p-4">
          <p className="text-xs text-ink/55">
            {t("commentingAs", { name: String(user.user_metadata?.full_name ?? user.user_metadata?.name ?? user.email ?? "") })}
          </p>
          <textarea
            required
            maxLength={500}
            rows={2}
            value={text}
            onChange={(e) => setText(e.target.value)}
            placeholder={t("commentTextPlaceholder")}
            aria-label={t("commentTextPlaceholder")}
            className="w-full resize-none rounded-xl border border-gold/30 bg-white/80 px-4 py-2 text-sm outline-none focus:border-maroon"
          />
          {error ? <p className="text-xs text-red-700">{error}</p> : null}
          <button
            type="submit"
            disabled={posting}
            className="rounded-full bg-maroon px-5 py-2 text-sm font-semibold text-cream hover:bg-maroon-dark disabled:opacity-60"
          >
            {posting ? `${t("commentPost")}…` : t("commentPost")}
          </button>
        </form>
      )}

      {comments.length === 0 ? (
        <p className="text-center text-sm text-ink/50">{t("commentsEmpty")}</p>
      ) : (
        <ul className="max-h-[28rem] space-y-2 overflow-y-auto pr-1">
          {comments.map((comment) => (
            <li key={comment.id} className="rounded-2xl border border-gold/20 bg-white/60 px-4 py-3">
              <div className="flex items-baseline justify-between gap-3">
                <p className="text-sm font-semibold text-maroon">{comment.authorName}</p>
                {/* Safari and Node word dates slightly differently ("at", AM/am). */}
                <time className="shrink-0 text-[11px] text-ink/45" dateTime={comment.createdAt} suppressHydrationWarning>
                  {time(comment.createdAt)}
                </time>
              </div>
              <p className="mt-1 whitespace-pre-line break-words text-sm text-ink/80">{comment.text}</p>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
