import Link from "next/link";
import { notFound } from "next/navigation";
import { getCurrentUser } from "@/lib/auth/session";
import { getRehabAssessment } from "@/lib/services/rehab-service";
import { formatMrn } from "@/lib/services/patient-service";
import { can } from "@/lib/auth/authorize";
import { canAuthorClinicalRecord } from "@/lib/auth/clinical-author";
import { listComments } from "@/lib/services/record-comment-service";
import {
  coSignRehabAssessmentAction,
  coSignTreatmentPlanAction,
  coSignTherapySessionAction,
} from "@/lib/actions/rehab";
import { NewTreatmentPlanForm } from "@/components/rehab/new-treatment-plan-form";
import { LogTherapySessionForm } from "@/components/rehab/log-therapy-session-form";
import { EditAssessmentForm } from "@/components/rehab/edit-assessment-form";
import { EditTreatmentPlanForm } from "@/components/rehab/edit-treatment-plan-form";
import { EditTherapySessionForm } from "@/components/rehab/edit-therapy-session-form";
import { CommentThread } from "@/components/shared/comment-thread";

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

const EVALUATION_TYPE_LABELS: Record<string, string> = {
  OUTPATIENT: "Outpatient",
  HOME_HEALTH: "Home Health",
  PEDIATRIC: "Pediatric",
};

function Field({ label, value }: { label: string; value: string | null }) {
  if (!value) return null;
  return (
    <div className="mb-3">
      <h2 className="mb-1 text-sm font-semibold text-slate-700">{label}</h2>
      <p className="text-sm text-slate-700">{value}</p>
    </div>
  );
}

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

  // Comments and self-edit are only ever relevant while a record is
  // pending co-sign - see clinical-author.ts / RecordComment's design
  // note. isAuthor/canSeeThread also matches record-comment-service.ts's
  // own access check, so this never calls listComments for a viewer who
  // has neither role and would just get an AuthorizationError.
  const isAssessmentAuthor = user?.id === assessment.therapistId;
  const canSeeAssessmentThread = isPendingCoSign && (canManage || isAssessmentAuthor);
  const assessmentComments = canSeeAssessmentThread
    ? (await listComments(user, "RehabAssessment", assessment.id)).map((c) => ({
        ...c,
        createdAt: c.createdAt.toLocaleString(),
      }))
    : [];

  const isPlanAuthor = user?.id === assessment.treatmentPlan?.therapistId;
  const canSeePlanThread = Boolean(isPlanPendingCoSign) && (canManage || isPlanAuthor);
  const planComments =
    canSeePlanThread && assessment.treatmentPlan
      ? (await listComments(user, "RehabTreatmentPlan", assessment.treatmentPlan.id)).map((c) => ({
          ...c,
          createdAt: c.createdAt.toLocaleString(),
        }))
      : [];

  const sessionExtras = new Map<
    string,
    { isAuthor: boolean; canSeeThread: boolean; comments: Awaited<ReturnType<typeof listComments>> }
  >();
  if (assessment.treatmentPlan) {
    for (const s of assessment.treatmentPlan.therapySessions) {
      const sessionPendingCoSign = s.therapist.role.name === "STUDENT" && !s.coSignedAt;
      const isAuthor = user?.id === s.therapistId;
      const canSeeThread = sessionPendingCoSign && (canManage || isAuthor);
      const comments = canSeeThread ? await listComments(user, "TherapySession", s.id) : [];
      sessionExtras.set(s.id, { isAuthor, canSeeThread, comments });
    }
  }

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
        <div className="mb-4 rounded border border-red-200 bg-red-50 p-3">
          <div className="flex items-center justify-between">
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
          {canSeeAssessmentThread && (
            <CommentThread
              entityType="RehabAssessment"
              entityId={assessment.id}
              revalidatePathTarget={`/rehab-assessments/${assessment.id}`}
              comments={assessmentComments}
            />
          )}
          {isAssessmentAuthor && (
            <EditAssessmentForm
              assessmentId={assessment.id}
              initial={{
                discipline: assessment.discipline,
                evaluationType: assessment.evaluationType,
                findings: assessment.findings,
                functionalLimitations: assessment.functionalLimitations,
                goals: assessment.goals,
                precautions: assessment.precautions,
                notes: assessment.notes,

                chiefComplaint: assessment.chiefComplaint,
                mechanismOfInjury: assessment.mechanismOfInjury,
                dateOfOnset: assessment.dateOfOnset,
                painType: assessment.painType,
                painAggravates: assessment.painAggravates,
                painRelieves: assessment.painRelieves,
                painTiming: assessment.painTiming,
                painTimingDetail: assessment.painTimingDetail,
                painLevelWorst: assessment.painLevelWorst,
                painLevelBest: assessment.painLevelBest,
                painLevelCurrent: assessment.painLevelCurrent,
                homeEquipment: assessment.homeEquipment,
                socialHistory: assessment.socialHistory,
                medicationsAndTesting: assessment.medicationsAndTesting,
                medicalScreenFlags: assessment.medicalScreenFlags,
                sensoryExam: assessment.sensoryExam,
                reflexesExam: assessment.reflexesExam,
                patientGoals: assessment.patientGoals,
                postureExam: assessment.postureExam,
                palpationExam: assessment.palpationExam,
                gaitExam: assessment.gaitExam,
                balanceExam: assessment.balanceExam,
                fallsHistory: assessment.fallsHistory,
                strengthExam: assessment.strengthExam,
                romExam: assessment.romExam,
                specialTestsNote: assessment.specialTestsNote,
                furtherObjectiveTesting: assessment.furtherObjectiveTesting,
                ptRecommendedFrequency: assessment.ptRecommendedFrequency,
                initialTreatmentPlan: assessment.initialTreatmentPlan,
                referralsNote: assessment.referralsNote,
                shortTermGoals: assessment.shortTermGoals,
                longTermGoals: assessment.longTermGoals,

                vitalsBp: assessment.vitalsBp,
                vitalsHr: assessment.vitalsHr,
                vitalsO2: assessment.vitalsO2,
                vitalsTemp: assessment.vitalsTemp,
                priorTreatment: assessment.priorTreatment,
                generalHealth: assessment.generalHealth,
                priorFunctionalLevelAdUse: assessment.priorFunctionalLevelAdUse,
                bedMobilityExam: assessment.bedMobilityExam,
                transfersExam: assessment.transfersExam,
                adlsExam: assessment.adlsExam,
                motorExam: assessment.motorExam,
                coordinationExam: assessment.coordinationExam,
                fatigueExam: assessment.fatigueExam,
                confusionMemoryExam: assessment.confusionMemoryExam,
                hearingVisionSpeechExam: assessment.hearingVisionSpeechExam,
                otherNeuroFindings: assessment.otherNeuroFindings,

                village: assessment.village,
                caregiver1: assessment.caregiver1,
                caregiver2: assessment.caregiver2,
                secondaryConcern: assessment.secondaryConcern,
                birthHistory: assessment.birthHistory,
                milestoneHistoryNote: assessment.milestoneHistoryNote,
                relevantFamilyHistory: assessment.relevantFamilyHistory,
                relevantHomeEnvironment: assessment.relevantHomeEnvironment,
                babySleepingEnvironment: assessment.babySleepingEnvironment,
                familyGoals: assessment.familyGoals,
                behavioralObservation: assessment.behavioralObservation,
                followingDirections: assessment.followingDirections,
                strengthsNote: assessment.strengthsNote,
                milestonesComment: assessment.milestonesComment,
                grossMotorNote: assessment.grossMotorNote,
                neuromotorMuscleToneNote: assessment.neuromotorMuscleToneNote,
                sensorimotorNote: assessment.sensorimotorNote,
                activityLimitationsNote: assessment.activityLimitationsNote,
                assistiveDevicesPresent: assessment.assistiveDevicesPresent,
                assistiveDevicesRecommended: assessment.assistiveDevicesRecommended,
                ptDiagnosisPrognosisJustification: assessment.ptDiagnosisPrognosisJustification,

                milestones: assessment.milestones.map((m) => ({
                  milestone: m.milestone,
                  achieved: m.achieved,
                  assistLevel: m.assistLevel,
                })),
              }}
            />
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
        <h2 className="mb-2 text-xs font-semibold uppercase tracking-wide text-slate-400">
          {EVALUATION_TYPE_LABELS[assessment.evaluationType]} Evaluation
        </h2>

        <Field label={assessment.evaluationType === "PEDIATRIC" ? "Primary Concern" : "Current Complaint"} value={assessment.chiefComplaint} />
        {assessment.evaluationType === "OUTPATIENT" && <Field label="Mechanism of Injury" value={assessment.mechanismOfInjury} />}
        <Field label="Date of Onset" value={assessment.dateOfOnset} />
        <Field label="Functional Limitations (PLOF and CLOF)" value={assessment.functionalLimitations} />

        {assessment.evaluationType === "HOME_HEALTH" && (
          <>
            <Field label="Prior Treatment" value={assessment.priorTreatment} />
            <Field label="General Health" value={assessment.generalHealth} />
            <Field label="Prior Functional Level / AD Use" value={assessment.priorFunctionalLevelAdUse} />
            <Field
              label="Vitals"
              value={[assessment.vitalsBp, assessment.vitalsHr, assessment.vitalsO2, assessment.vitalsTemp]
                .filter(Boolean)
                .join(" / ") || null}
            />
          </>
        )}

        {assessment.evaluationType === "PEDIATRIC" && (
          <>
            <Field label="Village" value={assessment.village} />
            <Field label="Caregivers" value={[assessment.caregiver1, assessment.caregiver2].filter(Boolean).join(", ") || null} />
            <Field label="Secondary Concern" value={assessment.secondaryConcern} />
            <Field label="Birth History" value={assessment.birthHistory} />
            <Field label="Milestone History" value={assessment.milestoneHistoryNote} />
            <Field label="Relevant Family History" value={assessment.relevantFamilyHistory} />
            <Field label="Relevant Home Environment" value={assessment.relevantHomeEnvironment} />
            <Field label="Baby Sleeping Environment" value={assessment.babySleepingEnvironment} />
            <Field label="Family Goals" value={assessment.familyGoals} />
            <Field label="Behavioral Observation" value={assessment.behavioralObservation} />
            <Field label="Following Directions" value={assessment.followingDirections} />
            <Field label="Strengths" value={assessment.strengthsNote} />
          </>
        )}

        {assessment.evaluationType !== "PEDIATRIC" && (
          <>
            <Field
              label="Pain"
              value={
                assessment.painType.length || assessment.painLevelCurrent != null
                  ? [
                      assessment.painType.join(", "),
                      assessment.painLevelCurrent != null ? `currently ${assessment.painLevelCurrent}/10` : null,
                      assessment.painLevelWorst != null ? `worst ${assessment.painLevelWorst}/10` : null,
                      assessment.painLevelBest != null ? `best ${assessment.painLevelBest}/10` : null,
                    ]
                      .filter(Boolean)
                      .join(" - ")
                  : null
              }
            />
            <Field label="Aggravates" value={assessment.painAggravates} />
            <Field label="Relieves" value={assessment.painRelieves} />
            <Field
              label="Pain Timing"
              value={[...assessment.painTiming, assessment.painTimingDetail].filter(Boolean).join(", ") || null}
            />
          </>
        )}

        {assessment.evaluationType === "OUTPATIENT" && <Field label="Home/Equipment" value={assessment.homeEquipment} />}
        <Field label="Social/Vocational History" value={assessment.socialHistory} />
        <Field label="PMH/Precautions" value={assessment.precautions} />
        <Field label="Medications/Diagnostic Testing" value={assessment.medicationsAndTesting} />
        {assessment.evaluationType === "OUTPATIENT" && (
          <Field label="Medical Screen" value={assessment.medicalScreenFlags.join(", ") || null} />
        )}
        {assessment.evaluationType === "HOME_HEALTH" && <Field label="Falls History" value={assessment.fallsHistory} />}
        <Field label="Sensory" value={assessment.sensoryExam} />
        <Field label="Reflexes" value={assessment.reflexesExam} />
        <Field label="Patient/Family Goals" value={assessment.patientGoals} />

        {assessment.evaluationType === "HOME_HEALTH" && (
          <>
            <Field label="Bed Mobility" value={assessment.bedMobilityExam} />
            <Field label="Transfers" value={assessment.transfersExam} />
            <Field label="ADLs" value={assessment.adlsExam} />
          </>
        )}

        {assessment.evaluationType === "PEDIATRIC" && assessment.milestones.length > 0 && (
          <div className="mb-3">
            <h2 className="mb-1 text-sm font-semibold text-slate-700">Milestones Achieved</h2>
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-xs uppercase text-slate-400">
                  <th className="pb-1">Milestone</th>
                  <th className="pb-1">Achieved</th>
                  <th className="pb-1">Assist Level</th>
                </tr>
              </thead>
              <tbody>
                {assessment.milestones.map((m) => (
                  <tr key={m.id} className="border-t border-slate-100">
                    <td className="py-1 pr-2 text-slate-700">{m.milestone}</td>
                    <td className="py-1 pr-2 text-slate-700">{m.achieved ? "Yes" : "No"}</td>
                    <td className="py-1 text-slate-700">{m.assistLevel ?? "-"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
            <Field label="Comments" value={assessment.milestonesComment} />
          </div>
        )}

        <Field label="Posture/Structural Alignment" value={assessment.postureExam} />
        {assessment.evaluationType === "OUTPATIENT" && <Field label="Palpation" value={assessment.palpationExam} />}
        <Field label={assessment.evaluationType === "HOME_HEALTH" ? "Gait/Stairs" : "Gait/General Observation"} value={assessment.gaitExam} />
        <Field label={assessment.evaluationType === "PEDIATRIC" ? "Balance/Coordination" : "Balance"} value={assessment.balanceExam} />
        <Field label="Strength" value={assessment.strengthExam} />
        <Field label={assessment.evaluationType === "PEDIATRIC" ? "ROM/Strength/Gross Motor Assessment" : "ROM"} value={assessment.romExam} />

        {assessment.evaluationType === "OUTPATIENT" && (
          <>
            <Field label="Further Objective Testing" value={assessment.furtherObjectiveTesting} />
            <Field label="Special Tests" value={assessment.specialTestsNote} />
          </>
        )}

        {assessment.evaluationType === "HOME_HEALTH" && (
          <>
            <Field label="Motor" value={assessment.motorExam} />
            <Field label="Coordination" value={assessment.coordinationExam} />
            <Field label="Fatigue" value={assessment.fatigueExam} />
            <Field label="Confusion/Memory" value={assessment.confusionMemoryExam} />
            <Field label="Hearing/Vision/Speech" value={assessment.hearingVisionSpeechExam} />
            <Field label="Other (wounds, etc)" value={assessment.otherNeuroFindings} />
          </>
        )}

        {assessment.evaluationType === "PEDIATRIC" && (
          <>
            <Field label="Neuromotor/Muscle Tone Assessment" value={assessment.grossMotorNote} />
            <Field label="Sensorimotor Assessment" value={assessment.sensorimotorNote} />
            <Field label="Activity Limitations/Participation Restrictions" value={assessment.activityLimitationsNote} />
            <Field label="ADs Already Present in Home" value={assessment.assistiveDevicesPresent} />
            <Field label="May Benefit From Additional ADs" value={assessment.assistiveDevicesRecommended} />
          </>
        )}

        <h2 className="mb-1 mt-2 text-sm font-semibold text-slate-700">
          {assessment.evaluationType === "PEDIATRIC" ? "PT Diagnosis/Prognosis/Justification" : "Assessment"}
        </h2>
        <p className="mb-3 text-sm text-slate-700">{assessment.findings}</p>

        {assessment.goals && (
          <>
            <h2 className="mb-1 text-sm font-semibold text-slate-700">Plan</h2>
            <p className="mb-3 text-sm text-slate-700">{assessment.goals}</p>
          </>
        )}

        {assessment.evaluationType !== "PEDIATRIC" && (
          <Field label="PT Recommended Frequency" value={assessment.ptRecommendedFrequency} />
        )}
        <Field label="Initial Treatment/Education Provided/HEP" value={assessment.initialTreatmentPlan} />
        {assessment.evaluationType === "OUTPATIENT" && <Field label="Referrals" value={assessment.referralsNote} />}

        {assessment.shortTermGoals.length > 0 && (
          <Field label="Short Term Goals" value={assessment.shortTermGoals.join("; ")} />
        )}
        {assessment.longTermGoals.length > 0 && (
          <Field label="Long Term Goals" value={assessment.longTermGoals.join("; ")} />
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
          <div className="mb-3 rounded border border-red-200 bg-red-50 p-3">
            <div className="flex items-center justify-between">
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
            {canSeePlanThread && (
              <CommentThread
                entityType="RehabTreatmentPlan"
                entityId={assessment.treatmentPlan!.id}
                revalidatePathTarget={`/rehab-assessments/${assessment.id}`}
                comments={planComments}
              />
            )}
            {isPlanAuthor && (
              <EditTreatmentPlanForm
                assessmentId={assessment.id}
                treatmentPlanId={assessment.treatmentPlan!.id}
                initial={{
                  goals: assessment.treatmentPlan!.goals,
                  frequency: assessment.treatmentPlan!.frequency,
                  reviewDate: assessment.treatmentPlan!.reviewDate
                    ? assessment.treatmentPlan!.reviewDate.toISOString().slice(0, 10)
                    : null,
                  precautions: assessment.treatmentPlan!.precautions,
                }}
              />
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
                const extra = sessionExtras.get(s.id)!;
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
                    <div className="mt-1 flex flex-col gap-1 text-sm text-slate-700">
                      <p><span className="font-medium">S:</span> {s.subjective}</p>
                      <p><span className="font-medium">O:</span> {s.objective}</p>
                      {s.assessment && <p><span className="font-medium">A:</span> {s.assessment}</p>}
                      {s.plan && <p><span className="font-medium">P:</span> {s.plan}</p>}
                      {s.homeExerciseProgram && (
                        <p><span className="font-medium">HEP:</span> {s.homeExerciseProgram}</p>
                      )}
                      {s.additionalNotes && (
                        <p className="text-slate-500">{s.additionalNotes}</p>
                      )}
                    </div>
                    {sessionPendingCoSign && (
                      <div className="mt-2 rounded border border-red-200 bg-red-50 p-2">
                        <div className="flex items-center justify-between">
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
                        {extra.canSeeThread && (
                          <CommentThread
                            entityType="TherapySession"
                            entityId={s.id}
                            revalidatePathTarget={`/rehab-assessments/${assessment.id}`}
                            comments={extra.comments.map((c) => ({
                              ...c,
                              createdAt: c.createdAt.toLocaleString(),
                            }))}
                          />
                        )}
                        {extra.isAuthor && (
                          <EditTherapySessionForm
                            assessmentId={assessment.id}
                            sessionId={s.id}
                            initial={{
                              setting: s.setting,
                              subjective: s.subjective,
                              objective: s.objective,
                              assessment: s.assessment,
                              plan: s.plan,
                              homeExerciseProgram: s.homeExerciseProgram,
                              additionalNotes: s.additionalNotes,
                            }}
                          />
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
