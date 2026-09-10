"use client";

import { useActionState } from "react";
import {
  createConsultationAction,
  type CreateConsultationState,
} from "@/lib/actions/consultation";

const inputClass = "rounded border border-slate-300 px-3 py-2 text-sm";
const labelClass = "text-sm font-medium text-slate-700";

export function NewConsultationForm({ patientId }: { patientId: string }) {
  const actionWithPatientId = createConsultationAction.bind(null, patientId);
  const [state, formAction, isPending] = useActionState<
    CreateConsultationState,
    FormData
  >(actionWithPatientId, null);

  return (
    <form action={formAction} className="flex max-w-2xl flex-col gap-6">
      <div className="flex flex-col gap-1">
        <label htmlFor="chiefComplaint" className={labelClass}>
          Chief complaint
        </label>
        <input
          id="chiefComplaint"
          name="chiefComplaint"
          required
          className={inputClass}
        />
      </div>

      <div className="flex flex-col gap-1">
        <label htmlFor="historyOfPresentIllness" className={labelClass}>
          History of present illness
        </label>
        <textarea
          id="historyOfPresentIllness"
          name="historyOfPresentIllness"
          rows={3}
          className={inputClass}
        />
      </div>

      <fieldset className="rounded border border-slate-200 p-4">
        <legend className="px-1 text-sm font-semibold text-slate-700">
          Vitals (optional)
        </legend>
        <div className="grid grid-cols-4 gap-3">
          <div className="flex flex-col gap-1">
            <label htmlFor="temperatureC" className="text-xs text-slate-500">
              Temp (°C)
            </label>
            <input
              id="temperatureC"
              name="temperatureC"
              type="number"
              step="0.1"
              className={inputClass}
            />
          </div>
          <div className="flex flex-col gap-1">
            <label htmlFor="heartRateBpm" className="text-xs text-slate-500">
              Heart rate (bpm)
            </label>
            <input
              id="heartRateBpm"
              name="heartRateBpm"
              type="number"
              className={inputClass}
            />
          </div>
          <div className="flex flex-col gap-1">
            <label
              htmlFor="respiratoryRatePerMin"
              className="text-xs text-slate-500"
            >
              Resp. rate (/min)
            </label>
            <input
              id="respiratoryRatePerMin"
              name="respiratoryRatePerMin"
              type="number"
              className={inputClass}
            />
          </div>
          <div className="flex flex-col gap-1">
            <label
              htmlFor="oxygenSaturationPercent"
              className="text-xs text-slate-500"
            >
              O2 sat (%)
            </label>
            <input
              id="oxygenSaturationPercent"
              name="oxygenSaturationPercent"
              type="number"
              className={inputClass}
            />
          </div>
          <div className="flex flex-col gap-1">
            <label
              htmlFor="bloodPressureSystolic"
              className="text-xs text-slate-500"
            >
              BP systolic
            </label>
            <input
              id="bloodPressureSystolic"
              name="bloodPressureSystolic"
              type="number"
              className={inputClass}
            />
          </div>
          <div className="flex flex-col gap-1">
            <label
              htmlFor="bloodPressureDiastolic"
              className="text-xs text-slate-500"
            >
              BP diastolic
            </label>
            <input
              id="bloodPressureDiastolic"
              name="bloodPressureDiastolic"
              type="number"
              className={inputClass}
            />
          </div>
          <div className="flex flex-col gap-1">
            <label htmlFor="weightKg" className="text-xs text-slate-500">
              Weight (kg)
            </label>
            <input
              id="weightKg"
              name="weightKg"
              type="number"
              step="0.1"
              className={inputClass}
            />
          </div>
          <div className="flex flex-col gap-1">
            <label htmlFor="heightCm" className="text-xs text-slate-500">
              Height (cm)
            </label>
            <input
              id="heightCm"
              name="heightCm"
              type="number"
              step="0.1"
              className={inputClass}
            />
          </div>
        </div>
      </fieldset>

      <div className="flex flex-col gap-1">
        <label htmlFor="examinationNotes" className={labelClass}>
          Examination notes
        </label>
        <textarea
          id="examinationNotes"
          name="examinationNotes"
          rows={3}
          className={inputClass}
        />
      </div>

      <div className="flex flex-col gap-1">
        <label htmlFor="assessment" className={labelClass}>
          Assessment
        </label>
        <textarea id="assessment" name="assessment" rows={2} className={inputClass} />
      </div>

      <div className="flex flex-col gap-1">
        <label htmlFor="diagnosisDescription" className={labelClass}>
          Diagnosis
        </label>
        <input
          id="diagnosisDescription"
          name="diagnosisDescription"
          className={inputClass}
        />
      </div>

      <div className="flex flex-col gap-1">
        <label htmlFor="treatmentNotes" className={labelClass}>
          Treatment notes
        </label>
        <textarea
          id="treatmentNotes"
          name="treatmentNotes"
          rows={2}
          className={inputClass}
        />
      </div>

      <div className="flex flex-col gap-1">
        <label htmlFor="notes" className={labelClass}>
          Other notes
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
        {isPending ? "Saving..." : "Save consultation"}
      </button>
    </form>
  );
}
