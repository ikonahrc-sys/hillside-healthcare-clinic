"use client";

import { useActionState } from "react";
import {
  scheduleAppointmentAction,
  type ScheduleAppointmentState,
} from "@/lib/actions/appointment";

const inputClass = "rounded border border-slate-300 px-3 py-2 text-sm";
const labelClass = "text-sm font-medium text-slate-700";

const APPOINTMENT_TYPE_LABELS: Record<string, string> = {
  MEDICAL_FOLLOW_UP: "Medical Follow-up",
  PHYSIOTHERAPY: "Physiotherapy Session",
  SPEECH_THERAPY: "Speech Therapy Session",
  OCCUPATIONAL_THERAPY: "Occupational Therapy Session",
  HOME_NURSING_VISIT: "Home Nursing Visit",
  PHARMACY_CONSULTATION: "Pharmacy Consultation",
  PUBLIC_HEALTH_VISIT: "Public Health Visit",
};

export function ScheduleAppointmentForm({
  patientId,
  availableTypes,
}: {
  patientId: string;
  availableTypes: string[];
}) {
  const actionWithId = scheduleAppointmentAction.bind(null, patientId);
  const [state, formAction, isPending] = useActionState<
    ScheduleAppointmentState,
    FormData
  >(actionWithId, null);

  return (
    <form action={formAction} className="flex max-w-md flex-col gap-4">
      {availableTypes.length > 1 ? (
        <div className="flex flex-col gap-1">
          <label htmlFor="type" className={labelClass}>
            Appointment Type
          </label>
          <select id="type" name="type" required className={inputClass}>
            <option value="">Select type...</option>
            {availableTypes.map((t) => (
              <option key={t} value={t}>
                {APPOINTMENT_TYPE_LABELS[t] ?? t}
              </option>
            ))}
          </select>
        </div>
      ) : (
        <>
          <input type="hidden" name="type" value={availableTypes[0]} />
          <p className={labelClass}>
            {APPOINTMENT_TYPE_LABELS[availableTypes[0]] ?? availableTypes[0]}
          </p>
        </>
      )}

      <div className="flex flex-col gap-1">
        <label htmlFor="scheduledAt" className={labelClass}>
          Date &amp; Time
        </label>
        <input
          id="scheduledAt"
          name="scheduledAt"
          type="datetime-local"
          required
          className={inputClass}
        />
      </div>

      <div className="flex flex-col gap-1">
        <label htmlFor="notes" className={labelClass}>
          Notes
        </label>
        <textarea id="notes" name="notes" rows={3} className={inputClass} />
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
        {isPending ? "Saving..." : "Book appointment"}
      </button>
    </form>
  );
}
