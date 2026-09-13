"use client";

import { useActionState } from "react";
import {
  createOutreachVisitAction,
  type OutreachVisitState,
} from "@/lib/actions/public-health";

const inputClass = "rounded border border-slate-300 px-3 py-2 text-sm";
const labelClass = "text-sm font-medium text-slate-700";

export function NewOutreachVisitForm() {
  const [state, formAction, isPending] = useActionState<
    OutreachVisitState,
    FormData
  >(createOutreachVisitAction, null);

  return (
    <form action={formAction} className="flex max-w-md flex-col gap-4">
      <div className="flex flex-col gap-1">
        <label htmlFor="visitDate" className={labelClass}>
          Visit date
        </label>
        <input id="visitDate" name="visitDate" type="date" required className={inputClass} />
      </div>

      <div className="flex flex-col gap-1">
        <label htmlFor="location" className={labelClass}>
          Location
        </label>
        <input
          id="location"
          name="location"
          required
          placeholder="e.g. Maypen Village community center"
          className={inputClass}
        />
      </div>

      <div className="flex flex-col gap-1">
        <label htmlFor="activity" className={labelClass}>
          Activity
        </label>
        <textarea
          id="activity"
          name="activity"
          required
          rows={3}
          placeholder="e.g. Blood pressure and diabetes screening"
          className={inputClass}
        />
      </div>

      <div className="flex flex-col gap-1">
        <label htmlFor="peopleReached" className={labelClass}>
          People reached
        </label>
        <input
          id="peopleReached"
          name="peopleReached"
          type="number"
          min={0}
          required
          className={inputClass}
        />
      </div>

      <div className="flex flex-col gap-1">
        <label htmlFor="notes" className={labelClass}>
          Notes <span className="font-normal text-slate-400">(optional)</span>
        </label>
        <textarea id="notes" name="notes" rows={2} className={inputClass} />
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
        {isPending ? "Saving..." : "Log outreach visit"}
      </button>
    </form>
  );
}
