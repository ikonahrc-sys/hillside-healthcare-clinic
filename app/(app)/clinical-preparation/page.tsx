import Link from "next/link";
import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth/session";
import { can } from "@/lib/auth/authorize";
import { listMyPreparationNotes } from "@/lib/services/clinical-prep-service";
import { formatMrn } from "@/lib/services/patient-service";

export default async function ClinicalPreparationPage() {
  const user = await getCurrentUser();

  if (!user || !(await can(user, "clinical-prep:manage"))) {
    redirect("/dashboard");
  }

  const notes = await listMyPreparationNotes(user);

  return (
    <div>
      <div className="mb-1 flex items-center justify-between">
        <h1 className="text-lg font-semibold text-slate-900">
          Clinical Preparation
        </h1>
        <Link
          href="/clinical-preparation/new"
          className="rounded bg-slate-900 px-3 py-1.5 text-sm font-medium text-white"
        >
          New Note
        </Link>
      </div>
      <p className="mb-4 text-sm text-slate-500">
        Your own study and prep notes - private to you, never part of a
        patient&apos;s official record.
      </p>

      {notes.length === 0 ? (
        <p className="text-sm text-slate-500">No preparation notes yet.</p>
      ) : (
        <ul className="flex flex-col gap-3">
          {notes.map((n) => (
            <li
              key={n.id}
              className="rounded border border-slate-200 bg-white p-4"
            >
              <div className="flex items-baseline justify-between">
                <Link
                  href={`/patients/${n.patient.id}`}
                  className="text-sm font-medium text-slate-900 hover:underline"
                >
                  {n.patient.lastName}, {n.patient.firstName} (
                  {formatMrn(n.patient.mrnNumber)})
                </Link>
                <span className="text-xs text-slate-400">
                  {n.createdAt.toDateString()}
                </span>
              </div>
              <p className="mt-2 whitespace-pre-wrap text-sm text-slate-700">
                {n.content}
              </p>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
