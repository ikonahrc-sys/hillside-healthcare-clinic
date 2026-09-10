"use client";

import { useActionState } from "react";
import {
  createReferralAction,
  type CreateReferralState,
} from "@/lib/actions/referral";

const inputClass = "rounded border border-slate-300 px-3 py-2 text-sm";
const labelClass = "text-sm font-medium text-slate-700";

export function NewReferralForm({
  patientId,
  departments,
}: {
  patientId: string;
  departments: { id: string; name: string }[];
}) {
  const actionWithPatientId = createReferralAction.bind(null, patientId);
  const [state, formAction, isPending] = useActionState<
    CreateReferralState,
    FormData
  >(actionWithPatientId, null);

  return (
    <form action={formAction} className="flex max-w-lg flex-col gap-4">
      <div className="flex flex-col gap-1">
        <label htmlFor="toDepartmentId" className={labelClass}>
          Refer to
        </label>
        <select
          id="toDepartmentId"
          name="toDepartmentId"
          required
          className={inputClass}
        >
          <option value="">Select department...</option>
          {departments.map((d) => (
            <option key={d.id} value={d.id}>
              {d.name}
            </option>
          ))}
        </select>
      </div>

      <div className="flex flex-col gap-1">
        <label htmlFor="reason" className={labelClass}>
          Reason for referral
        </label>
        <textarea id="reason" name="reason" rows={4} required className={inputClass} />
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
        {isPending ? "Sending..." : "Send referral"}
      </button>
    </form>
  );
}
