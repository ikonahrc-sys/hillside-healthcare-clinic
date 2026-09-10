import type { ReactNode } from "react";
import { Nav } from "@/components/layout/nav";
import { logoutAction } from "@/lib/actions/auth";
import type { CurrentUser } from "@/lib/auth/session";

export function AppShell({
  user,
  canManagePlacements,
  canManageClinicalPrep,
  children,
}: {
  user: CurrentUser;
  canManagePlacements: boolean;
  canManageClinicalPrep: boolean;
  children: ReactNode;
}) {
  return (
    <div className="flex min-h-screen bg-slate-50">
      <aside className="w-56 shrink-0 border-r border-slate-200 bg-white">
        <div className="border-b border-slate-200 p-4">
          <p className="text-sm font-semibold text-slate-900">
            Hillside Healthcare Clinic
          </p>
        </div>
        <Nav
          canManagePlacements={canManagePlacements}
          canManageClinicalPrep={canManageClinicalPrep}
        />
      </aside>

      <div className="flex flex-1 flex-col">
        <header className="flex items-center justify-between border-b border-slate-200 bg-white px-6 py-3">
          <div className="text-sm text-slate-600">
            <span className="font-medium text-slate-900">{user.fullName}</span>{" "}
            <span className="text-slate-400">({user.role.name})</span>
          </div>
          <form action={logoutAction}>
            <button
              type="submit"
              className="rounded border border-slate-300 px-3 py-1.5 text-sm text-slate-700 hover:bg-slate-100"
            >
              Sign out
            </button>
          </form>
        </header>

        <main className="flex-1 p-6">{children}</main>
      </div>
    </div>
  );
}
