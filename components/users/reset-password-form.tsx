"use client";

import { useActionState } from "react";
import {
  resetUserPasswordAction,
  type ResetPasswordState,
} from "@/lib/actions/user";

const inputClass = "rounded border border-slate-300 px-3 py-2 text-sm";
const labelClass = "text-sm font-medium text-slate-700";

export function ResetPasswordForm({ userId }: { userId: string }) {
  const actionWithUserId = resetUserPasswordAction.bind(null, userId);
  const [state, formAction, isPending] = useActionState<
    ResetPasswordState,
    FormData
  >(actionWithUserId, null);

  return (
    <form action={formAction} className="flex max-w-md flex-col gap-4">
      <div className="flex flex-col gap-1">
        <label htmlFor="newPassword" className={labelClass}>
          New password
        </label>
        <input
          id="newPassword"
          name="newPassword"
          type="password"
          required
          minLength={8}
          className={inputClass}
        />
      </div>

      {state?.error && (
        <p className="text-sm text-red-600" role="alert">
          {state.error}
        </p>
      )}

      <button
        type="submit"
        disabled={isPending}
        className="w-fit rounded bg-slate-900 px-4 py-2 text-sm font-medium text-white disabled:opacity-50"
      >
        {isPending ? "Saving..." : "Set new password"}
      </button>
    </form>
  );
}
