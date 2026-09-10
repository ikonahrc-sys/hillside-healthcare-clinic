import Link from "next/link";
import { notFound } from "next/navigation";
import { getCurrentUser } from "@/lib/auth/session";
import { getHomeNursingAssessment } from "@/lib/services/home-nursing-service";
import { formatMrn } from "@/lib/services/patient-service";
import { can } from "@/lib/auth/authorize";
import { canAuthorClinicalRecord } from "@/lib/auth/clinical-author";
import {
  coSignHomeNursingAssessmentAction,
  coSignHomeNursingCarePlanAction,
  coSignHomeVisitAction,
} from "@/lib/actions/home-nursing";
import { NewCarePlanForm } from "@/components/home-nursing/new-care-plan-form";
import { LogHomeVisitForm } from "@/components/home-nursing/log-home-visit-form";

export default async function HomeNursingAssessmentPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const user = await getCurrentUser();
  const assessment = await getHomeNursingAssessment(user, id);

  if (!assessment) {
    notFound();
  }

  const canManage = user ? await can(user, "homenursing:manage") : false;
  const canAuthor = await canAuthorClinicalRecord(user, "homenursing:manage", "HN");
  const isPendingCoSign =
    assessment.nurse.role.name === "STUDENT" && !assessment.coSignedAt;
  const isPlanPendingCoSign =
    assessment.carePlan &&
    assessment.carePlan.nurse.role.name === "STUDENT" &&
    !assessment.carePlan.coSignedAt;

  return (
    <div>
      <div className="mb-4">
        <Link
          href={`/patients/${assessment.patient.id}?tab=home-nursing`}
          className="text-sm text-slate-500 hover:underline"
        >
          &larr; Back to patient
        </Link>
        <h1 className="mt-1 text-lg font-semibold text-slate-900">
          Home Nursing Assessment
        </h1>
        <p className="text-sm text-slate-500">
          {assessment.patient.lastName}, {assessment.patient.firstName} (
          {formatMrn(assessment.patient.mrnNumber)}) - by{" "}
          {assessment.nurse.fullName} - {assessment.createdAt.toDateString()}
        </p>
      </div>

      {isPendingCoSign && (
        <div className="mb-4 flex items-center justify-between rounded border border-red-200 bg-red-50 p-3">
          <p className="text-sm text-red-800">
            Student-authored - pending supervisor co-sign before this is part
            of the official record.
          </p>
          {canManage && (
            <form action={coSignHomeNursingAssessmentAction}>
              <input type="hidden" name="assessmentId" value={assessment.id} />
              <button
                type="submit"
                className="rounded bg-red-700 px-3 py-1.5 text-xs font-medium text-white"
              >
                Co-sign
              </button>
            </form>
          )}
        </div>
      )}

      {assessment.coSignedAt && assessment.coSignedBy && (
        <p className="mb-4 text-xs text-slate-500">
          Co-signed by {assessment.coSignedBy.fullName} on{" "}
          {assessment.coSignedAt.toDateString()}
        </p>
      )}

      <div className="rounded border border-slate-200 bg-white p-4">
        <h2 className="mb-2 text-sm font-semibold text-slate-700">Findings</h2>
        <p className="mb-3 text-sm text-slate-700">{assessment.findings}</p>

        {assessment.careNeeds && (
          <>
            <h2 className="mb-1 text-sm font-semibold text-slate-700">
              Care needs
            </h2>
            <p className="mb-3 text-sm text-slate-700">{assessment.careNeeds}</p>
          </>
        )}

        {assessment.precautions && (
          <>
            <h2 className="mb-1 text-sm font-semibold text-slate-700">
              Precautions
            </h2>
            <p className="mb-3 text-sm text-slate-700">{assessment.precautions}</p>
          </>
        )}

        {assessment.notes && (
          <>
            <h2 className="mb-1 text-sm font-semibold text-slate-700">Notes</h2>
            <p className="text-sm text-slate-700">{assessment.notes}</p>
          </>
        )}
      </div>

      <div className="mt-6 rounded border border-slate-200 bg-white p-4">
        <h2 className="mb-3 text-sm font-semibold text-slate-700">
          Care Plan
        </h2>

        {isPlanPendingCoSign && (
          <div className="mb-3 flex items-center justify-between rounded border border-red-200 bg-red-50 p-3">
            <p className="text-sm text-red-800">
              Student-authored - pending supervisor co-sign.
            </p>
            {canManage && (
              <form action={coSignHomeNursingCarePlanAction}>
                <input type="hidden" name="assessmentId" value={assessment.id} />
                <input
                  type="hidden"
                  name="carePlanId"
                  value={assessment.carePlan!.id}
                />
                <button
                  type="submit"
                  className="rounded bg-red-700 px-3 py-1.5 text-xs font-medium text-white"
                >
                  Co-sign
                </button>
              </form>
            )}
          </div>
        )}

        {assessment.carePlan ? (
          <dl className="flex flex-col gap-2 text-sm">
            <div>
              <dt className="text-xs font-medium uppercase tracking-wide text-slate-400">
                Goals
              </dt>
              <dd className="text-slate-700">{assessment.carePlan.goals}</dd>
            </div>
            <div>
              <dt className="text-xs font-medium uppercase tracking-wide text-slate-400">
                Frequency
              </dt>
              <dd className="text-slate-700">{assessment.carePlan.frequency}</dd>
            </div>
            {assessment.carePlan.reviewDate && (
              <div>
                <dt className="text-xs font-medium uppercase tracking-wide text-slate-400">
                  Review date
                </dt>
                <dd className="text-slate-700">
                  {assessment.carePlan.reviewDate.toDateString()}
                </dd>
              </div>
            )}
            {assessment.carePlan.precautions && (
              <div>
                <dt className="text-xs font-medium uppercase tracking-wide text-slate-400">
                  Precautions
                </dt>
                <dd className="text-slate-700">
                  {assessment.carePlan.precautions}
                </dd>
              </div>
            )}
            <span className="w-fit rounded bg-green-100 px-2 py-0.5 text-xs font-medium text-green-800">
              {assessment.carePlan.status}
            </span>
            {assessment.carePlan.coSignedAt && assessment.carePlan.coSignedBy && (
              <p className="text-xs text-slate-500">
                Co-signed by {assessment.carePlan.coSignedBy.fullName} on{" "}
                {assessment.carePlan.coSignedAt.toDateString()}
              </p>
            )}
          </dl>
        ) : canAuthor ? (
          <NewCarePlanForm assessmentId={assessment.id} />
        ) : (
          <p className="text-sm text-slate-500">No care plan yet.</p>
        )}
      </div>

      {assessment.carePlan && (
        <div className="mt-6 rounded border border-slate-200 bg-white p-4">
          <h2 className="mb-3 text-sm font-semibold text-slate-700">
            Home Visits
          </h2>

          {assessment.carePlan.homeVisits.length > 0 && (
            <ul className="mb-4 flex flex-col gap-3">
              {assessment.carePlan.homeVisits.map((v) => {
                const visitPendingCoSign =
                  v.nurse.role.name === "STUDENT" && !v.coSignedAt;
                return (
                  <li
                    key={v.id}
                    className="border-t border-slate-100 pt-3 first:border-t-0 first:pt-0"
                  >
                    <div className="flex items-baseline justify-between">
                      <span className="text-xs font-medium text-slate-400">
                        {v.visitDate.toDateString()} - {v.nurse.fullName}
                      </span>
                    </div>
                    <p className="mt-1 text-sm text-slate-700">{v.careProvided}</p>
                    {v.patientCondition && (
                      <p className="mt-1 text-sm text-slate-600">
                        Condition: {v.patientCondition}
                      </p>
                    )}
                    {v.notes && (
                      <p className="mt-1 text-sm text-slate-500">{v.notes}</p>
                    )}
                    {visitPendingCoSign && (
                      <div className="mt-2 flex items-center justify-between rounded border border-red-200 bg-red-50 p-2">
                        <span className="text-xs text-red-800">
                          Student-authored - pending co-sign
                        </span>
                        {canManage && (
                          <form action={coSignHomeVisitAction}>
                            <input type="hidden" name="assessmentId" value={assessment.id} />
                            <input type="hidden" name="visitId" value={v.id} />
                            <button
                              type="submit"
                              className="rounded bg-red-700 px-2 py-1 text-xs font-medium text-white"
                            >
                              Co-sign
                            </button>
                          </form>
                        )}
                      </div>
                    )}
                    {v.coSignedAt && v.coSignedBy && (
                      <p className="mt-1 text-xs text-slate-500">
                        Co-signed by {v.coSignedBy.fullName} on {v.coSignedAt.toDateString()}
                      </p>
                    )}
                  </li>
                );
              })}
            </ul>
          )}

          {assessment.carePlan.homeVisits.length === 0 && (
            <p className="mb-4 text-sm text-slate-500">No visits logged yet.</p>
          )}

          {canAuthor && (
            <LogHomeVisitForm
              assessmentId={assessment.id}
              carePlanId={assessment.carePlan.id}
            />
          )}
        </div>
      )}
    </div>
  );
}
