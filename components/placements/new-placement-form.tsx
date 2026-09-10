"use client";

import { useActionState } from "react";
import {
  createPlacementAction,
  type CreatePlacementState,
} from "@/lib/actions/placement";

const inputClass = "rounded border border-slate-300 px-3 py-2 text-sm";
const labelClass = "text-sm font-medium text-slate-700";

type Person = { id: string; fullName: string; email: string };
type Department = { id: string; name: string };

export function NewPlacementForm({
  students,
  departments,
  supervisors,
}: {
  students: Person[];
  departments: Department[];
  supervisors: Person[];
}) {
  const [state, formAction, isPending] = useActionState<
    CreatePlacementState,
    FormData
  >(createPlacementAction, null);

  return (
    <form action={formAction} className="flex max-w-md flex-col gap-4">
      <div className="flex flex-col gap-1">
        <label htmlFor="studentId" className={labelClass}>
          Student
        </label>
        <select id="studentId" name="studentId" required className={inputClass}>
          <option value="">Select student...</option>
          {students.map((s) => (
            <option key={s.id} value={s.id}>
              {s.fullName} ({s.email})
            </option>
          ))}
        </select>
      </div>

      <div className="flex flex-col gap-1">
        <label htmlFor="departmentId" className={labelClass}>
          Department
        </label>
        <select id="departmentId" name="departmentId" required className={inputClass}>
          <option value="">Select department...</option>
          {departments.map((d) => (
            <option key={d.id} value={d.id}>
              {d.name}
            </option>
          ))}
        </select>
      </div>

      <div className="flex flex-col gap-1">
        <label htmlFor="supervisorId" className={labelClass}>
          Supervisor <span className="font-normal text-slate-400">(optional)</span>
        </label>
        <select id="supervisorId" name="supervisorId" className={inputClass}>
          <option value="">No supervisor assigned</option>
          {supervisors.map((s) => (
            <option key={s.id} value={s.id}>
              {s.fullName} ({s.email})
            </option>
          ))}
        </select>
      </div>

      <div className="flex flex-col gap-1">
        <label htmlFor="startDate" className={labelClass}>
          Start date
        </label>
        <input id="startDate" name="startDate" type="date" required className={inputClass} />
      </div>

      <div className="flex flex-col gap-1">
        <label htmlFor="endDate" className={labelClass}>
          End date <span className="font-normal text-slate-400">(typically 4 weeks after start)</span>
        </label>
        <input id="endDate" name="endDate" type="date" required className={inputClass} />
      </div>

      <div className="flex flex-col gap-1">
        <label htmlFor="clinicalArea" className={labelClass}>
          Clinical area <span className="font-normal text-slate-400">(optional)</span>
        </label>
        <input
          id="clinicalArea"
          name="clinicalArea"
          placeholder="e.g. Physiotherapy - Orthopedic Rotation"
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
        {isPending ? "Saving..." : "Create placement"}
      </button>
    </form>
  );
}
