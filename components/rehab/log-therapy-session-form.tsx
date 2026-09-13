"use client";

import { useActionState } from "react";
import {
  logTherapySessionAction,
  type RehabActionState,
} from "@/lib/actions/rehab";

const inputClass = "rounded border border-slate-300 px-3 py-2 text-sm";
const labelClass = "text-sm font-medium text-slate-700";

export function LogTherapySessionForm({
  assessmentId,
  treatmentPlanId,
}: {
  assessmentId: string;
  treatmentPlanId: string;
}) {
  const actionWithIds = logTherapySessionAction.bind(null, assessmentId, treatmentPlanId);
  const [state, formAction, isPending] = useActionState<
    RehabActionState,
    FormData
  >(actionWithIds, null);

  return (
    <form action={formAction} className="flex max-w-2xl flex-col gap-4">
      <div className="flex flex-col gap-1">
        <label htmlFor="setting" className={labelClass}>
          Where did this happen?
        </label>
        <select id="setting" name="setting" defaultValue="CLINIC" className={inputClass}>
          <option value="CLINIC">Clinic</option>
          <option value="HOME_HEALTH_VISIT">Home Health Visit</option>
          <option value="MOBILE_CLINIC">Mobile Clinic</option>
        </select>
      </div>

      <div className="flex flex-col gap-1">
        <label htmlFor="subjective" className={labelClass}>
          S - Subjective
        </label>
        <textarea id="subjective" name="subjective" rows={3} required className={inputClass} />
      </div>

      <div className="flex flex-col gap-1">
        <label htmlFor="objective" className={labelClass}>
          O - Objective
        </label>
        <textarea id="objective" name="objective" rows={4} required className={inputClass} />
      </div>

      <div className="flex flex-col gap-1">
        <label htmlFor="assessment" className={labelClass}>
          A - Assessment
        </label>
        <textarea id="assessment" name="assessment" rows={3} className={inputClass} />
      </div>

      <div className="flex flex-col gap-1">
        <label htmlFor="plan" className={labelClass}>
          P - Plan
        </label>
        <textarea id="plan" name="plan" rows={3} className={inputClass} />
      </div>

      <div className="flex flex-col gap-1">
        <label htmlFor="homeExerciseProgram" className={labelClass}>
          Home Exercise Program
        </label>
        <textarea id="homeExerciseProgram" name="homeExerciseProgram" rows={2} className={inputClass} />
      </div>

      <div className="flex flex-col gap-1">
        <label htmlFor="additionalNotes" className={labelClass}>
          Additional notes
        </label>
        <textarea id="additionalNotes" name="additionalNotes" rows={2} className={inputClass} />
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
        {isPending ? "Saving..." : "Log session"}
      </button>
    </form>
  );
}
