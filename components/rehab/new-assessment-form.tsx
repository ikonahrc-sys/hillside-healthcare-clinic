"use client";

import { useActionState } from "react";
import {
  createRehabAssessmentAction,
  type RehabActionState,
} from "@/lib/actions/rehab";

const inputClass = "rounded border border-slate-300 px-3 py-2 text-sm";
const labelClass = "text-sm font-medium text-slate-700";

export function NewAssessmentForm({
  patientId,
  referralId,
}: {
  patientId: string;
  referralId?: string;
}) {
  const actionWithPatientId = createRehabAssessmentAction.bind(null, patientId);
  const [state, formAction, isPending] = useActionState<
    RehabActionState,
    FormData
  >(actionWithPatientId, null);

  return (
    <form action={formAction} className="flex max-w-2xl flex-col gap-4">
      {referralId && <input type="hidden" name="referralId" value={referralId} />}

      <div className="flex flex-col gap-1">
        <label htmlFor="discipline" className={labelClass}>
          Discipline
        </label>
        <select id="discipline" name="discipline" required className={inputClass}>
          <option value="">Select discipline...</option>
          <option value="PHYSIOTHERAPY">Physiotherapy</option>
          <option value="SPEECH_THERAPY">Speech Therapy</option>
          <option value="OCCUPATIONAL_THERAPY">Occupational Therapy</option>
        </select>
      </div>

      <div className="flex flex-col gap-1">
        <label htmlFor="findings" className={labelClass}>
          Findings
        </label>
        <textarea id="findings" name="findings" rows={3} required className={inputClass} />
      </div>

      <div className="flex flex-col gap-1">
        <label htmlFor="functionalLimitations" className={labelClass}>
          Functional limitations
        </label>
        <textarea
          id="functionalLimitations"
          name="functionalLimitations"
          rows={2}
          className={inputClass}
        />
      </div>

      <div className="flex flex-col gap-1">
        <label htmlFor="goals" className={labelClass}>
          Goals
        </label>
        <textarea id="goals" name="goals" rows={2} className={inputClass} />
      </div>

      <div className="flex flex-col gap-1">
        <label htmlFor="precautions" className={labelClass}>
          Precautions
        </label>
        <textarea id="precautions" name="precautions" rows={2} className={inputClass} />
      </div>

      <div className="flex flex-col gap-1">
        <label htmlFor="notes" className={labelClass}>
          Notes
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
        {isPending ? "Saving..." : "Save assessment"}
      </button>
    </form>
  );
}
