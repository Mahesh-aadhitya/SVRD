import { setCommentStatus, deleteComment } from "@/lib/actions/comments";
import ConfirmSubmitButton from "@/components/admin/ConfirmSubmitButton";
import type { AdminComment } from "@/lib/content-types";

const statusStyles: Record<AdminComment["status"], string> = {
  approved: "bg-gold/20 text-maroon",
  hidden: "bg-red-500/15 text-red-600",
};

function formatTime(iso: string) {
  return new Date(iso).toLocaleString("en-IN", {
    timeZone: "Asia/Kolkata",
    day: "numeric",
    month: "short",
    hour: "numeric",
    minute: "2-digit",
  });
}

export default function CommentModerationList({ comments }: { comments: AdminComment[] }) {
  if (comments.length === 0) {
    return <p className="rounded-2xl border border-ink/10 p-6 text-center text-sm text-ink/50">No comments yet.</p>;
  }

  return (
    <div className="space-y-3">
      {comments.map((comment) => (
        <div
          key={comment.id}
          className="rounded-2xl border border-ink/10 bg-black/[0.03] p-4 sm:flex sm:items-start sm:justify-between sm:gap-4"
        >
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              <p className="font-medium text-ink">{comment.authorName}</p>
              <span className="text-xs text-ink/40">
                {comment.context} &middot; {formatTime(comment.createdAt)}
              </span>
              <span className={`rounded-full px-2 py-0.5 text-[11px] capitalize ${statusStyles[comment.status]}`}>
                {comment.status === "approved" ? "Visible" : "Hidden"}
              </span>
            </div>
            <p className="mt-1.5 whitespace-pre-line break-words text-sm text-ink/75">{comment.text}</p>
          </div>
          <div className="mt-3 flex shrink-0 items-center gap-2 sm:mt-0">
            {comment.status === "hidden" ? (
              <form action={setCommentStatus.bind(null, comment.id, "approved")}>
                <button className="rounded-full border border-gold/40 px-3 py-1.5 text-xs font-semibold text-maroon hover:bg-gold/10">
                  Show
                </button>
              </form>
            ) : (
              <form action={setCommentStatus.bind(null, comment.id, "hidden")}>
                <button className="rounded-full border border-ink/15 px-3 py-1.5 text-xs font-semibold text-ink/60 hover:bg-black/[0.03]">
                  Hide
                </button>
              </form>
            )}
            <form action={deleteComment.bind(null, comment.id)}>
              <ConfirmSubmitButton
                message="Delete this comment permanently?"
                className="rounded-full border border-red-500/30 px-3 py-1.5 text-xs font-semibold text-red-600 hover:bg-red-500/5"
              >
                Delete
              </ConfirmSubmitButton>
            </form>
          </div>
        </div>
      ))}
    </div>
  );
}
