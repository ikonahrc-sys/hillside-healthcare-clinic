"use client";

import { useActionState } from "react";
import { createPatientAction } from "@/lib/actions/patient";

const inputClass = "rounded border border-slate-300 px-3 py-2 text-sm";
const labelClass = "text-sm font-medium text-slate-700";

export function NewPatientForm() {
  const [state, formAction, isPending] = useActionState(
    createPatientAction,
    null,
  );

  return (
    <form action={formAction} className="flex max-w-2xl flex-col gap-4">
      <div className="grid grid-cols-2 gap-4">
        <div className="flex flex-col gap-1">
          <label htmlFor="firstName" className={labelClass}>
            First name
          </label>
          <input id="firstName" name="firstName" required className={inputClass} />
        </div>
        <div className="flex flex-col gap-1">
          <label htmlFor="lastName" className={labelClass}>
            Last name
          </label>
          <input id="lastName" name="lastName" required className={inputClass} />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="flex flex-col gap-1">
          <label htmlFor="dateOfBirth" className={labelClass}>
            Date of birth
          </label>
          <input
            id="dateOfBirth"
            name="dateOfBirth"
            type="date"
            required
            className={inputClass}
          />
        </div>
        <div className="flex flex-col gap-1">
          <label htmlFor="sex" className={labelClass}>
            Sex
          </label>
          <select id="sex" name="sex" required className={inputClass}>
            <option value="">Select...</option>
            <option value="MALE">Male</option>
            <option value="FEMALE">Female</option>
            <option value="OTHER">Other</option>
          </select>
        </div>
      </div>

      <div className="flex flex-col gap-1">
        <label htmlFor="address" className={labelClass}>
          Address
        </label>
        <input id="address" name="address" className={inputClass} />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="flex flex-col gap-1">
          <label htmlFor="phone" className={labelClass}>
            Phone
          </label>
          <input id="phone" name="phone" className={inputClass} />
        </div>
        <div className="flex flex-col gap-1">
          <label htmlFor="email" className={labelClass}>
            Email
          </label>
          <input id="email" name="email" type="email" className={inputClass} />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="flex flex-col gap-1">
          <label htmlFor="emergencyContactName" className={labelClass}>
            Emergency contact name
          </label>
          <input
            id="emergencyContactName"
            name="emergencyContactName"
            className={inputClass}
          />
        </div>
        <div className="flex flex-col gap-1">
          <label htmlFor="emergencyContactPhone" className={labelClass}>
            Emergency contact phone
          </label>
          <input
            id="emergencyContactPhone"
            name="emergencyContactPhone"
            className={inputClass}
          />
        </div>
      </div>

      <div className="flex flex-col gap-1">
        <label htmlFor="allergies" className={labelClass}>
          Allergies
        </label>
        <textarea
          id="allergies"
          name="allergies"
          rows={2}
          className={inputClass}
        />
      </div>

      <div className="flex flex-col gap-1">
        <label htmlFor="medicalHistoryNotes" className={labelClass}>
          Medical history notes
        </label>
        <textarea
          id="medicalHistoryNotes"
          name="medicalHistoryNotes"
          rows={3}
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
        {isPending ? "Saving..." : "Register patient"}
      </button>
    </form>
  );
}
