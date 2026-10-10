"use client";

import { useEffect, useState } from "react";
import { useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";
import { useSessionUser } from "@/components/account/useSessionUser";
import { isSignedInAdmin } from "@/lib/actions/admin-check";

// Answers per signed-in user, so moving between pages doesn't ask again.
const known = new Map<string, boolean>();

// The footer's Admin link — shown only to a signed-in temple admin.
export default function AdminLink({ className }: { className?: string }) {
  const t = useTranslations("nav");
  const user = useSessionUser();
  const [checked, setChecked] = useState<Record<string, boolean>>({});
  const id = user?.id;
  const isAdmin = id ? (checked[id] ?? known.get(id)) : false;

  useEffect(() => {
    if (!id || known.has(id)) return;
    let cancelled = false;
    isSignedInAdmin()
      .catch(() => false)
      .then((yes) => {
        known.set(id, yes);
        if (!cancelled) setChecked((c) => ({ ...c, [id]: yes }));
      });
    return () => {
      cancelled = true;
    };
  }, [id]);

  if (!isAdmin) return null;
  return (
    <Link href="/admin" className={className}>
      {t("admin")}
    </Link>
  );
}
