"use client";

import { useActionState } from "react";
import { addCommentAction, type AddCommentState } from "@/lib/actions/record-comment";
import type { CommentableEntityType } from "@/lib/services/record-comment-service";

type Comment = {
  id: string;
  content: string;
  createdAt: string;
  author: { fullName: string; role: { name: string } };
};

export function CommentThread({
  entityType,
  entityId,
  revalidatePathTarget,
  comments,
}: {
  entityType: CommentableEntityType;
  entityId: string;
  revalidatePathTarget: string;
  comments: Comment[];
}) {
  const actionWithIds = addCommentAction.bind(null, entityType, entityId, revalidatePathTarget);
  const [state, formAction, isPending] = useActionState<AddCommentState, FormData>(
    actionWithIds,
    null,
  );

  return (
    <div className="mt-2 rounded border border-slate-200 bg-slate-50 p-3">
      <h4 className="mb-2 text-xs font-semibold uppercase tracking-wide text-slate-400">
        Comments
      </h4>
      {comments.length === 0 ? (
        <p className="mb-2 text-xs text-slate-400">No comments yet.</p>
      ) : (
        <ul className="mb-3 flex flex-col gap-2">
          {comments.map((c) => (
            <li key={c.id} className="text-sm">
              <span className="font-medium text-slate-900">{c.author.fullName}</span>{" "}
              <span className="text-xs text-slate-400">
                ({c.author.role.name}) - {c.createdAt}
              </span>
              <p className="text-slate-700">{c.content}</p>
            </li>
          ))}
        </ul>
      )}
      <form action={formAction} className="flex gap-2">
        <input
          type="text"
          name="content"
          placeholder="Add a comment..."
          required
          className="flex-1 rounded border border-slate-300 px-2 py-1 text-sm"
        />
        <button
          type="submit"
          disabled={isPending}
          className="rounded bg-slate-900 px-3 py-1 text-xs font-medium text-white disabled:opacity-50"
        >
          {isPending ? "Posting..." : "Post"}
        </button>
      </form>
      {state?.error && <p className="mt-1 text-xs text-red-600">{state.error}</p>}
    </div>
  );
}
