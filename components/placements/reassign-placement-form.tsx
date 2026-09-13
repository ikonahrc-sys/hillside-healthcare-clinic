"use client";

import { useActionState } from "react";
import {
  reassignPlacementAction,
  type ReassignPlacementState,
} from "@/lib/actions/placement";

const inputClass = "rounded border border-slate-300 px-3 py-2 text-sm";
const labelClass = "text-sm font-medium text-slate-700";

type Person = { id: string; fullName: string; email: string };
type Department = { id: string; name: string };

export function ReassignPlacementForm({
  placementId,
  departments,
  supervisors,
  currentDepartmentId,
  currentSupervisorId,
}: {
  placementId: string;
  departments: Department[];
  supervisors: Person[];
  currentDepartmentId: string;
  currentSupervisorId: string | null;
}) {
  const actionWithId = reassignPlacementAction.bind(null, placementId);
  const [state, formAction, isPending] = useActionState<
    ReassignPlacementState,
    FormData
  >(actionWithId, null);

  return (
    <form action={formAction} className="flex max-w-md flex-col gap-4">
      <div className="flex flex-col gap-1">
        <label htmlFor="departmentId" className={labelClass}>
          Department
        </label>
        <select
          id="departmentId"
          name="departmentId"
          required
          defaultValue={currentDepartmentId}
          className={inputClass}
        >
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
        <select
          id="supervisorId"
          name="supervisorId"
          defaultValue={currentSupervisorId ?? ""}
          className={inputClass}
        >
          <option value="">No supervisor assigned</option>
          {supervisors.map((s) => (
            <option key={s.id} value={s.id}>
              {s.fullName} ({s.email})
            </option>
          ))}
        </select>
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
        {isPending ? "Saving..." : "Save changes"}
      </button>
    </form>
  );
}
