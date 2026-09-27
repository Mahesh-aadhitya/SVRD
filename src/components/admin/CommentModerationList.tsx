"use client";

import { useState } from "react";
import { adminComments, type AdminComment } from "@/lib/placeholder-data";

const statusStyles: Record<AdminComment["status"], string> = {
  approved: "bg-gold/20 text-gold-light",
  pending: "bg-white/10 text-cream/60",
  hidden: "bg-red-500/15 text-red-300",
};

export default function CommentModerationList() {
  const [comments, setComments] = useState(adminComments);

  function setStatus(id: string, status: AdminComment["status"]) {
    setComments((prev) => prev.map((c) => (c.id === id ? { ...c, status } : c)));
  }

  return (
    <div className="space-y-3">
      {comments.map((comment) => (
        <div
          key={comment.id}
          className="rounded-2xl border border-white/10 bg-white/5 p-4 sm:flex sm:items-start sm:justify-between sm:gap-4"
        >
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              <p className="font-medium text-cream">{comment.author}</p>
              <span className="text-xs text-cream/40">{comment.context}</span>
              <span className={`rounded-full px-2 py-0.5 text-[11px] capitalize ${statusStyles[comment.status]}`}>
                {comment.status}
              </span>
            </div>
            <p className="mt-1.5 text-sm text-cream/75">{comment.text}</p>
          </div>
          <div className="mt-3 flex shrink-0 gap-2 sm:mt-0">
            <button
              onClick={() => setStatus(comment.id, "approved")}
              className="rounded-full border border-gold/40 px-3 py-1.5 text-xs font-semibold text-gold-light hover:bg-gold/10"
            >
              Approve
            </button>
            <button
              onClick={() => setStatus(comment.id, "hidden")}
              className="rounded-full border border-white/15 px-3 py-1.5 text-xs font-semibold text-cream/60 hover:bg-white/5"
            >
              Hide
            </button>
          </div>
        </div>
      ))}
    </div>
  );
}
