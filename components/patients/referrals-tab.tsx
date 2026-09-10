import Link from "next/link";
import type { listReferralsForPatient } from "@/lib/services/referral-service";

type Referral = Awaited<ReturnType<typeof listReferralsForPatient>>[number];

export function ReferralsTab({
  patientId,
  referrals,
  canManageReferrals,
}: {
  patientId: string;
  referrals: Referral[];
  canManageReferrals: boolean;
}) {
  return (
    <div className="rounded border border-slate-200 bg-white p-4">
      <div className="mb-3 flex items-center justify-end">
        {canManageReferrals && (
          <Link
            href={`/patients/${patientId}/referrals/new`}
            className="rounded bg-slate-900 px-3 py-1.5 text-sm font-medium text-white"
          >
            New Referral
          </Link>
        )}
      </div>

      {referrals.length === 0 ? (
        <p className="text-sm text-slate-500">No referrals yet.</p>
      ) : (
        <ul className="flex flex-col gap-3">
          {referrals.map((r) => (
            <li
              key={r.id}
              className="border-t border-slate-100 pt-3 first:border-t-0 first:pt-0"
            >
              <div className="flex items-baseline justify-between">
                <p className="text-sm text-slate-900">
                  {r.fromDepartment.name} → {r.toDepartment.name}
                </p>
                <span className="text-xs font-medium text-slate-500">{r.status}</span>
              </div>
              <p className="text-xs text-slate-500">
                by {r.referringUser.fullName} - {r.createdAt.toDateString()}
              </p>
              <p className="mt-1 text-sm text-slate-600">{r.reason}</p>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
