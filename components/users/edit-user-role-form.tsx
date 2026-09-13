"use client";

import { useActionState } from "react";
import {
  updateUserRoleAction,
  type UpdateUserRoleState,
} from "@/lib/actions/user";

const inputClass = "rounded border border-slate-300 px-3 py-2 text-sm";
const labelClass = "text-sm font-medium text-slate-700";

type Role = { id: string; name: string };
type Department = { id: string; name: string };

export function EditUserRoleForm({
  userId,
  roles,
  departments,
  currentRoleId,
  currentDepartmentId,
}: {
  userId: string;
  roles: Role[];
  departments: Department[];
  currentRoleId: string;
  currentDepartmentId: string | null;
}) {
  const actionWithId = updateUserRoleAction.bind(null, userId);
  const [state, formAction, isPending] = useActionState<
    UpdateUserRoleState,
    FormData
  >(actionWithId, null);

  return (
    <form action={formAction} className="flex max-w-md flex-col gap-4">
      <div className="flex flex-col gap-1">
        <label htmlFor="roleId" className={labelClass}>
          Role
        </label>
        <select
          id="roleId"
          name="roleId"
          required
          defaultValue={currentRoleId}
          className={inputClass}
        >
          {roles.map((r) => (
            <option key={r.id} value={r.id}>
              {r.name}
            </option>
          ))}
        </select>
      </div>

      <div className="flex flex-col gap-1">
        <label htmlFor="departmentId" className={labelClass}>
          Department <span className="font-normal text-slate-400">(optional)</span>
        </label>
        <select
          id="departmentId"
          name="departmentId"
          defaultValue={currentDepartmentId ?? ""}
          className={inputClass}
        >
          <option value="">No department</option>
          {departments.map((d) => (
            <option key={d.id} value={d.id}>
              {d.name}
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
