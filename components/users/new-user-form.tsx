"use client";

import { useActionState } from "react";
import { createUserAction, type CreateUserState } from "@/lib/actions/user";

const inputClass = "rounded border border-slate-300 px-3 py-2 text-sm";
const labelClass = "text-sm font-medium text-slate-700";

type Role = { id: string; name: string };
type Department = { id: string; name: string };

export function NewUserForm({
  roles,
  departments,
}: {
  roles: Role[];
  departments: Department[];
}) {
  const [state, formAction, isPending] = useActionState<
    CreateUserState,
    FormData
  >(createUserAction, null);

  return (
    <form action={formAction} className="flex max-w-md flex-col gap-4">
      <div className="flex flex-col gap-1">
        <label htmlFor="fullName" className={labelClass}>
          Full name
        </label>
        <input id="fullName" name="fullName" required className={inputClass} />
      </div>

      <div className="flex flex-col gap-1">
        <label htmlFor="email" className={labelClass}>
          Email
        </label>
        <input
          id="email"
          name="email"
          type="email"
          required
          className={inputClass}
        />
      </div>

      <div className="flex flex-col gap-1">
        <label htmlFor="password" className={labelClass}>
          Initial password
        </label>
        <input
          id="password"
          name="password"
          type="password"
          required
          minLength={8}
          className={inputClass}
        />
        <p className="text-xs text-slate-400">
          At least 8 characters. Share it with them directly - they can
          change it themselves afterward from My Account, or you can set a
          new one for them from Users & Roles if they forget it. There is
          still no reset-by-email flow.
        </p>
      </div>

      <div className="flex flex-col gap-1">
        <label htmlFor="roleId" className={labelClass}>
          Role
        </label>
        <select id="roleId" name="roleId" required className={inputClass}>
          <option value="">Select role...</option>
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
        <select id="departmentId" name="departmentId" className={inputClass}>
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
        {isPending ? "Saving..." : "Create user"}
      </button>
    </form>
  );
}
