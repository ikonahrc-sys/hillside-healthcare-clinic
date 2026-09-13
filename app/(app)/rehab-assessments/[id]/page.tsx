import Link from "next/link";
import { notFound } from "next/navigation";
import { getCurrentUser } from "@/lib/auth/session";
import { getRehabAssessment } from "@/lib/services/rehab-service";
import { formatMrn } from "@/lib/services/patient-service";
import { can } from "@/lib/auth/authorize";
import { canAuthorClinicalRecord } from "@/lib/auth/clinical-author";
import {
  coSignRehabAssessmentAction,
  coSignTreatmentPlanAction,
  coSignTherapySessionAction,
} from "@/lib/actions/rehab";
import { NewTreatmentPlanForm } from "@/components/rehab/new-treatment-plan-form";
import { LogTherapySessionForm } from "@/components/rehab/log-therapy-session-form";

const DISCIPLINE_LABELS: Record<string, string> = {
  PHYSIOTHERAPY: "Physiotherapy",
  SPEECH_THERAPY: "Speech Therapy",
  OCCUPATIONAL_THERAPY: "Occupational Therapy",
};

const SETTING_LABELS: Record<string, string> = {
  CLINIC: "Clinic",
  HOME_HEALTH_VISIT: "Home Health Visit",
  MOBILE_CLINIC: "Mobile Clinic",
};

export default async function RehabAssessmentPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const user = await getCurrentUser();
  const assessment = await getRehabAssessment(user, id);

  if (!assessment) {
    notFound();
  }

  const canManage = user ? await can(user, "rehab:manage") : false;
  const canAuthor = await canAuthorClinicalRecord(user, "rehab:manage", "REHAB");
  const isPendingCoSign =
    assessment.therapist.role.name === "STUDENT" && !assessment.coSignedAt;
  const isPlanPendingCoSign =
    assessment.treatmentPlan &&
    assessment.treatmentPlan.therapist.role.name === "STUDENT" &&
    !assessment.treatmentPlan.coSignedAt;

  return (
    <div>
      <div className="mb-4">
        <Link
          href={`/patients/${assessment.patient.id}?tab=rehabilitation`}
          className="text-sm text-slate-500 hover:underline"
        >
          &larr; Back to patient
        </Link>
        <h1 className="mt-1 text-lg font-semibold text-slate-900">
          {DISCIPLINE_LABELS[assessment.discipline]} Assessment
        </h1>
        <p className="text-sm text-slate-500">
          {assessment.patient.lastName}, {assessment.patient.firstName} (
          {formatMrn(assessment.patient.mrnNumber)}) - by{" "}
          {assessment.therapist.fullName} - {assessment.createdAt.toDateString()}
        </p>
      </div>

      {isPendingCoSign && (
        <div className="mb-4 flex items-center justify-between rounded border border-red-200 bg-red-50 p-3">
          <p className="text-sm text-red-800">
            Student-authored - pending supervisor co-sign before this is part
            of the official record.
          </p>
          {canManage && (
            <form action={coSignRehabAssessmentAction}>
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

        {assessment.functionalLimitations && (
          <>
            <h2 className="mb-1 text-sm font-semibold text-slate-700">
              Functional limitations
            </h2>
            <p className="mb-3 text-sm text-slate-700">
              {assessment.functionalLimitations}
            </p>
          </>
        )}

        {assessment.goals && (
          <>
            <h2 className="mb-1 text-sm font-semibold text-slate-700">Goals</h2>
            <p className="mb-3 text-sm text-slate-700">{assessment.goals}</p>
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
          Treatment Plan
        </h2>

        {isPlanPendingCoSign && (
          <div className="mb-3 flex items-center justify-between rounded border border-red-200 bg-red-50 p-3">
            <p className="text-sm text-red-800">
              Student-authored - pending supervisor co-sign.
            </p>
            {canManage && (
              <form action={coSignTreatmentPlanAction}>
                <input type="hidden" name="assessmentId" value={assessment.id} />
                <input
                  type="hidden"
                  name="treatmentPlanId"
                  value={assessment.treatmentPlan!.id}
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

        {assessment.treatmentPlan ? (
          <dl className="flex flex-col gap-2 text-sm">
            <div>
              <dt className="text-xs font-medium uppercase tracking-wide text-slate-400">
                Goals
              </dt>
              <dd className="text-slate-700">{assessment.treatmentPlan.goals}</dd>
            </div>
            <div>
              <dt className="text-xs font-medium uppercase tracking-wide text-slate-400">
                Frequency
              </dt>
              <dd className="text-slate-700">{assessment.treatmentPlan.frequency}</dd>
            </div>
            {assessment.treatmentPlan.reviewDate && (
              <div>
                <dt className="text-xs font-medium uppercase tracking-wide text-slate-400">
                  Review date
                </dt>
                <dd className="text-slate-700">
                  {assessment.treatmentPlan.reviewDate.toDateString()}
                </dd>
              </div>
            )}
            {assessment.treatmentPlan.precautions && (
              <div>
                <dt className="text-xs font-medium uppercase tracking-wide text-slate-400">
                  Precautions
                </dt>
                <dd className="text-slate-700">
                  {assessment.treatmentPlan.precautions}
                </dd>
              </div>
            )}
            <span className="w-fit rounded bg-green-100 px-2 py-0.5 text-xs font-medium text-green-800">
              {assessment.treatmentPlan.status}
            </span>
            {assessment.treatmentPlan.coSignedAt && assessment.treatmentPlan.coSignedBy && (
              <p className="text-xs text-slate-500">
                Co-signed by {assessment.treatmentPlan.coSignedBy.fullName} on{" "}
                {assessment.treatmentPlan.coSignedAt.toDateString()}
              </p>
            )}
          </dl>
        ) : canAuthor ? (
          <NewTreatmentPlanForm assessmentId={assessment.id} />
        ) : (
          <p className="text-sm text-slate-500">No treatment plan yet.</p>
        )}
      </div>

      {assessment.treatmentPlan && (
        <div className="mt-6 rounded border border-slate-200 bg-white p-4">
          <h2 className="mb-3 text-sm font-semibold text-slate-700">
            Therapy Sessions
          </h2>

          {assessment.treatmentPlan.therapySessions.length > 0 && (
            <ul className="mb-4 flex flex-col gap-3">
              {assessment.treatmentPlan.therapySessions.map((s) => {
                const sessionPendingCoSign =
                  s.therapist.role.name === "STUDENT" && !s.coSignedAt;
                return (
                  <li
                    key={s.id}
                    className="border-t border-slate-100 pt-3 first:border-t-0 first:pt-0"
                  >
                    <div className="flex items-baseline justify-between">
                      <span className="text-xs font-medium text-slate-400">
                        {s.sessionDate.toDateString()} - {s.therapist.fullName}
                        {" - "}
                        {SETTING_LABELS[s.setting]}
                      </span>
                    </div>
                    <p className="mt-1 text-sm text-slate-700">{s.activities}</p>
                    {s.progress && (
                      <p className="mt-1 text-sm text-slate-600">
                        Progress: {s.progress}
                      </p>
                    )}
                    {s.notes && (
                      <p className="mt-1 text-sm text-slate-500">{s.notes}</p>
                    )}
                    {sessionPendingCoSign && (
                      <div className="mt-2 flex items-center justify-between rounded border border-red-200 bg-red-50 p-2">
                        <span className="text-xs text-red-800">
                          Student-authored - pending co-sign
                        </span>
                        {canManage && (
                          <form action={coSignTherapySessionAction}>
                            <input type="hidden" name="assessmentId" value={assessment.id} />
                            <input type="hidden" name="sessionId" value={s.id} />
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
                    {s.coSignedAt && s.coSignedBy && (
                      <p className="mt-1 text-xs text-slate-500">
                        Co-signed by {s.coSignedBy.fullName} on {s.coSignedAt.toDateString()}
                      </p>
                    )}
                  </li>
                );
              })}
            </ul>
          )}

          {assessment.treatmentPlan.therapySessions.length === 0 && (
            <p className="mb-4 text-sm text-slate-500">No sessions logged yet.</p>
          )}

          {canAuthor && (
            <LogTherapySessionForm
              assessmentId={assessment.id}
              treatmentPlanId={assessment.treatmentPlan.id}
            />
          )}
        </div>
      )}
    </div>
  );
}
