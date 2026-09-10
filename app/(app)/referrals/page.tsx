import Link from "next/link";
import { getCurrentUser } from "@/lib/auth/session";
import { listReferrals } from "@/lib/services/referral-service";
import { formatMrn } from "@/lib/services/patient-service";
import { respondToReferralAction } from "@/lib/actions/referral";

const STATUS_STYLES: Record<string, string> = {
  PENDING: "bg-amber-100 text-amber-800",
  ACCEPTED: "bg-green-100 text-green-800",
  DECLINED: "bg-red-100 text-red-800",
  IN_PROGRESS: "bg-blue-100 text-blue-800",
  COMPLETED: "bg-slate-200 text-slate-700",
};

export default async function ReferralsPage() {
  const user = await getCurrentUser();
  const referrals = await listReferrals(user);
  const isAdmin = user?.role.name === "ADMINISTRATOR";

  return (
    <div>
      <h1 className="mb-4 text-lg font-semibold text-slate-900">Referrals</h1>

      {referrals.length === 0 ? (
        <p className="text-sm text-slate-500">No referrals yet.</p>
      ) : (
        <ul className="flex flex-col gap-3">
          {referrals.map((r) => {
            const canRespond =
              r.status === "PENDING" &&
              (isAdmin || r.toDepartmentId === user?.departmentId);

            return (
              <li
                key={r.id}
                className="rounded border border-slate-200 bg-white p-4"
              >
                <div className="flex items-start justify-between">
                  <div>
                    <Link
                      href={`/patients/${r.patient.id}`}
                      className="text-sm font-medium text-slate-900 hover:underline"
                    >
                      {r.patient.lastName}, {r.patient.firstName} (
                      {formatMrn(r.patient.mrnNumber)})
                    </Link>
                    <p className="text-xs text-slate-500">
                      {r.fromDepartment.name} → {r.toDepartment.name} - by{" "}
                      {r.referringUser.fullName}
                    </p>
                  </div>
                  <span
                    className={`rounded px-2 py-0.5 text-xs font-medium ${STATUS_STYLES[r.status]}`}
                  >
                    {r.status}
                  </span>
                </div>

                <p className="mt-2 text-sm text-slate-700">{r.reason}</p>

                {canRespond && (
                  <div className="mt-3 flex gap-2">
                    <form action={respondToReferralAction}>
                      <input type="hidden" name="referralId" value={r.id} />
                      <input type="hidden" name="decision" value="ACCEPTED" />
                      <button
                        type="submit"
                        className="rounded bg-green-700 px-3 py-1.5 text-xs font-medium text-white"
                      >
                        Accept
                      </button>
                    </form>
                    <form action={respondToReferralAction}>
                      <input type="hidden" name="referralId" value={r.id} />
                      <input type="hidden" name="decision" value="DECLINED" />
                      <button
                        type="submit"
                        className="rounded border border-red-300 px-3 py-1.5 text-xs font-medium text-red-700"
                      >
                        Decline
                      </button>
                    </form>
                  </div>
                )}
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
