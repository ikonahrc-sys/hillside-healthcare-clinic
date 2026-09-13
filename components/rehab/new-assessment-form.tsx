"use client";

import { useState } from "react";
import { useActionState } from "react";
import {
  createRehabAssessmentAction,
  type RehabActionState,
} from "@/lib/actions/rehab";
import { PEDIATRIC_MILESTONES } from "@/lib/validation/rehab";

const inputClass = "rounded border border-slate-300 px-3 py-2 text-sm";
const labelClass = "text-sm font-medium text-slate-700";
const sectionClass = "flex flex-col gap-4 rounded border border-slate-200 bg-white p-4";
const sectionTitleClass = "text-sm font-semibold text-slate-700";

const PAIN_TYPES = ["Achy", "Burning", "Sharp", "Dull", "Crepitus", "Other"];
const PAIN_TIMINGS = ["In AM", "In PM", "Night Pain"];
const MEDICAL_SCREEN_ITEMS = [
  "Chest Pain/SOB",
  "Bowel/Bladder Changes",
  "Fever",
  "Visceral",
  "Nausea/Vomiting",
  "Unexplained Confusion/Memory Loss",
  "Unexplained Weight Loss/Gain",
];

function CheckboxGroup({ name, options }: { name: string; options: string[] }) {
  return (
    <div className="flex flex-wrap gap-3">
      {options.map((opt) => (
        <label key={opt} className="flex items-center gap-1 text-sm text-slate-700">
          <input type="checkbox" name={name} value={opt} />
          {opt}
        </label>
      ))}
    </div>
  );
}

export function NewAssessmentForm({
  patientId,
  referralId,
}: {
  patientId: string;
  referralId?: string;
}) {
  const actionWithPatientId = createRehabAssessmentAction.bind(null, patientId);
  const [state, formAction, isPending] = useActionState<
    RehabActionState,
    FormData
  >(actionWithPatientId, null);

  const [evaluationType, setEvaluationType] = useState<"OUTPATIENT" | "HOME_HEALTH" | "PEDIATRIC">(
    "OUTPATIENT",
  );

  return (
    <form action={formAction} className="flex max-w-3xl flex-col gap-6">
      {referralId && <input type="hidden" name="referralId" value={referralId} />}

      <div className={sectionClass}>
        <div className="flex flex-col gap-1">
          <label htmlFor="discipline" className={labelClass}>
            Discipline
          </label>
          <select id="discipline" name="discipline" required className={inputClass}>
            <option value="">Select discipline...</option>
            <option value="PHYSIOTHERAPY">Physiotherapy</option>
            <option value="SPEECH_THERAPY">Speech Therapy</option>
            <option value="OCCUPATIONAL_THERAPY">Occupational Therapy</option>
          </select>
        </div>

        <div className="flex flex-col gap-1">
          <label htmlFor="evaluationType" className={labelClass}>
            Evaluation form
          </label>
          <select
            id="evaluationType"
            name="evaluationType"
            value={evaluationType}
            onChange={(e) => setEvaluationType(e.target.value as typeof evaluationType)}
            className={inputClass}
          >
            <option value="OUTPATIENT">Outpatient</option>
            <option value="HOME_HEALTH">Home Health</option>
            <option value="PEDIATRIC">Pediatric</option>
          </select>
        </div>
      </div>

      {evaluationType === "HOME_HEALTH" && (
        <div className={sectionClass}>
          <h2 className={sectionTitleClass}>Vitals</h2>
          <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
            <div className="flex flex-col gap-1">
              <label htmlFor="vitalsBp" className={labelClass}>BP</label>
              <input id="vitalsBp" name="vitalsBp" className={inputClass} />
            </div>
            <div className="flex flex-col gap-1">
              <label htmlFor="vitalsHr" className={labelClass}>HR</label>
              <input id="vitalsHr" name="vitalsHr" className={inputClass} />
            </div>
            <div className="flex flex-col gap-1">
              <label htmlFor="vitalsO2" className={labelClass}>O2</label>
              <input id="vitalsO2" name="vitalsO2" className={inputClass} />
            </div>
            <div className="flex flex-col gap-1">
              <label htmlFor="vitalsTemp" className={labelClass}>Temp</label>
              <input id="vitalsTemp" name="vitalsTemp" className={inputClass} />
            </div>
          </div>
        </div>
      )}

      {evaluationType === "PEDIATRIC" && (
        <div className={sectionClass}>
          <h2 className={sectionTitleClass}>Information</h2>
          <div className="grid grid-cols-2 gap-3">
            <div className="flex flex-col gap-1">
              <label htmlFor="village" className={labelClass}>Village</label>
              <input id="village" name="village" className={inputClass} />
            </div>
            <div className="flex flex-col gap-1">
              <label htmlFor="caregiver1" className={labelClass}>Caregiver 1</label>
              <input id="caregiver1" name="caregiver1" className={inputClass} />
            </div>
            <div className="flex flex-col gap-1">
              <label htmlFor="caregiver2" className={labelClass}>Caregiver 2</label>
              <input id="caregiver2" name="caregiver2" className={inputClass} />
            </div>
            <div className="flex flex-col gap-1">
              <label htmlFor="secondaryConcern" className={labelClass}>Secondary Concern</label>
              <input id="secondaryConcern" name="secondaryConcern" className={inputClass} />
            </div>
          </div>
          <div className="flex flex-col gap-1">
            <label htmlFor="birthHistory" className={labelClass}>Birth History</label>
            <textarea id="birthHistory" name="birthHistory" rows={2} className={inputClass} />
          </div>
          <div className="flex flex-col gap-1">
            <label htmlFor="milestoneHistoryNote" className={labelClass}>Milestone History</label>
            <textarea id="milestoneHistoryNote" name="milestoneHistoryNote" rows={2} className={inputClass} />
          </div>
          <div className="flex flex-col gap-1">
            <label htmlFor="relevantFamilyHistory" className={labelClass}>Relevant Family History</label>
            <textarea id="relevantFamilyHistory" name="relevantFamilyHistory" rows={2} className={inputClass} />
          </div>
          <div className="flex flex-col gap-1">
            <label htmlFor="relevantHomeEnvironment" className={labelClass}>Relevant Home Environment</label>
            <textarea id="relevantHomeEnvironment" name="relevantHomeEnvironment" rows={2} className={inputClass} />
          </div>
          <div className="flex flex-col gap-1">
            <label htmlFor="babySleepingEnvironment" className={labelClass}>Baby Sleeping Environment</label>
            <input id="babySleepingEnvironment" name="babySleepingEnvironment" className={inputClass} />
          </div>
          <div className="flex flex-col gap-1">
            <label htmlFor="familyGoals" className={labelClass}>Family Goals</label>
            <textarea id="familyGoals" name="familyGoals" rows={2} className={inputClass} />
          </div>
          <div className="flex flex-col gap-1">
            <label htmlFor="behavioralObservation" className={labelClass}>Behavioral Observation</label>
            <textarea id="behavioralObservation" name="behavioralObservation" rows={2} className={inputClass} />
          </div>
          <div className="flex flex-col gap-1">
            <label htmlFor="followingDirections" className={labelClass}>Following Directions</label>
            <input id="followingDirections" name="followingDirections" className={inputClass} />
          </div>
          <div className="flex flex-col gap-1">
            <label htmlFor="strengthsNote" className={labelClass}>Strengths</label>
            <textarea id="strengthsNote" name="strengthsNote" rows={2} className={inputClass} />
          </div>
        </div>
      )}

      <div className={sectionClass}>
        <h2 className={sectionTitleClass}>
          {evaluationType === "PEDIATRIC" ? "Primary Concern & History" : "Current History"}
        </h2>
        <div className="flex flex-col gap-1">
          <label htmlFor="chiefComplaint" className={labelClass}>
            {evaluationType === "PEDIATRIC" ? "Primary Concern" : "Current Complaint"}
          </label>
          <textarea id="chiefComplaint" name="chiefComplaint" rows={2} className={inputClass} />
        </div>
        {evaluationType === "OUTPATIENT" && (
          <div className="flex flex-col gap-1">
            <label htmlFor="mechanismOfInjury" className={labelClass}>MOI</label>
            <input id="mechanismOfInjury" name="mechanismOfInjury" className={inputClass} />
          </div>
        )}
        <div className="flex flex-col gap-1">
          <label htmlFor="dateOfOnset" className={labelClass}>Date of Onset</label>
          <input id="dateOfOnset" name="dateOfOnset" className={inputClass} />
        </div>
        <div className="flex flex-col gap-1">
          <label htmlFor="functionalLimitations" className={labelClass}>
            Functional Limitations (PLOF and CLOF)
          </label>
          <textarea id="functionalLimitations" name="functionalLimitations" rows={2} className={inputClass} />
        </div>
        {evaluationType === "HOME_HEALTH" && (
          <>
            <div className="flex flex-col gap-1">
              <label htmlFor="priorTreatment" className={labelClass}>Prior Treatment</label>
              <input id="priorTreatment" name="priorTreatment" className={inputClass} />
            </div>
            <div className="flex flex-col gap-1">
              <label htmlFor="generalHealth" className={labelClass}>General Health</label>
              <input id="generalHealth" name="generalHealth" className={inputClass} />
            </div>
            <div className="flex flex-col gap-1">
              <label htmlFor="priorFunctionalLevelAdUse" className={labelClass}>
                Prior Functional Level / AD Use
              </label>
              <input id="priorFunctionalLevelAdUse" name="priorFunctionalLevelAdUse" className={inputClass} />
            </div>
          </>
        )}
      </div>

      {evaluationType !== "PEDIATRIC" && (
        <div className={sectionClass}>
          <h2 className={sectionTitleClass}>Pain Description</h2>
          <div className="flex flex-col gap-1">
            <span className={labelClass}>Type of Pain</span>
            <CheckboxGroup name="painType" options={PAIN_TYPES} />
          </div>
          <div className="flex flex-col gap-1">
            <label htmlFor="painAggravates" className={labelClass}>Aggravates</label>
            <input id="painAggravates" name="painAggravates" className={inputClass} />
          </div>
          <div className="flex flex-col gap-1">
            <label htmlFor="painRelieves" className={labelClass}>Relieves</label>
            <input id="painRelieves" name="painRelieves" className={inputClass} />
          </div>
          <div className="flex flex-col gap-1">
            <span className={labelClass}>Pain Timing</span>
            <CheckboxGroup name="painTiming" options={PAIN_TIMINGS} />
            <input
              name="painTimingDetail"
              placeholder="Details"
              className={`${inputClass} mt-1`}
            />
          </div>
          <div className="grid grid-cols-3 gap-3">
            <div className="flex flex-col gap-1">
              <label htmlFor="painLevelWorst" className={labelClass}>Pain at Worst (0-10)</label>
              <input id="painLevelWorst" name="painLevelWorst" type="number" min={0} max={10} className={inputClass} />
            </div>
            <div className="flex flex-col gap-1">
              <label htmlFor="painLevelBest" className={labelClass}>Pain at Best (0-10)</label>
              <input id="painLevelBest" name="painLevelBest" type="number" min={0} max={10} className={inputClass} />
            </div>
            <div className="flex flex-col gap-1">
              <label htmlFor="painLevelCurrent" className={labelClass}>Pain Currently (0-10)</label>
              <input id="painLevelCurrent" name="painLevelCurrent" type="number" min={0} max={10} className={inputClass} />
            </div>
          </div>
        </div>
      )}

      <div className={sectionClass}>
        <h2 className={sectionTitleClass}>History</h2>
        {evaluationType === "OUTPATIENT" && (
          <div className="flex flex-col gap-1">
            <label htmlFor="homeEquipment" className={labelClass}>Home/Equipment</label>
            <input id="homeEquipment" name="homeEquipment" className={inputClass} />
          </div>
        )}
        <div className="flex flex-col gap-1">
          <label htmlFor="socialHistory" className={labelClass}>Social/Vocational History</label>
          <input id="socialHistory" name="socialHistory" className={inputClass} />
        </div>
        <div className="flex flex-col gap-1">
          <label htmlFor="precautions" className={labelClass}>PMH/Precautions</label>
          <textarea id="precautions" name="precautions" rows={2} className={inputClass} />
        </div>
        <div className="flex flex-col gap-1">
          <label htmlFor="medicationsAndTesting" className={labelClass}>Medications/Diagnostic Testing</label>
          <textarea id="medicationsAndTesting" name="medicationsAndTesting" rows={2} className={inputClass} />
        </div>
        {evaluationType === "OUTPATIENT" && (
          <div className="flex flex-col gap-1">
            <span className={labelClass}>Medical Screen</span>
            <CheckboxGroup name="medicalScreenFlags" options={MEDICAL_SCREEN_ITEMS} />
          </div>
        )}
        {evaluationType === "HOME_HEALTH" && (
          <div className="flex flex-col gap-1">
            <label htmlFor="fallsHistory" className={labelClass}>Falls History</label>
            <input id="fallsHistory" name="fallsHistory" className={inputClass} />
          </div>
        )}
        <div className="flex flex-col gap-1">
          <label htmlFor="sensoryExam" className={labelClass}>Sensory</label>
          <input id="sensoryExam" name="sensoryExam" className={inputClass} />
        </div>
        <div className="flex flex-col gap-1">
          <label htmlFor="reflexesExam" className={labelClass}>Reflexes</label>
          <input id="reflexesExam" name="reflexesExam" className={inputClass} />
        </div>
        <div className="flex flex-col gap-1">
          <label htmlFor="patientGoals" className={labelClass}>Patient/Family Goals</label>
          <textarea id="patientGoals" name="patientGoals" rows={2} className={inputClass} />
        </div>
      </div>

      {evaluationType === "HOME_HEALTH" && (
        <div className={sectionClass}>
          <h2 className={sectionTitleClass}>Functional Assessment</h2>
          <div className="flex flex-col gap-1">
            <label htmlFor="bedMobilityExam" className={labelClass}>Bed Mobility</label>
            <input id="bedMobilityExam" name="bedMobilityExam" className={inputClass} />
          </div>
          <div className="flex flex-col gap-1">
            <label htmlFor="transfersExam" className={labelClass}>Transfers</label>
            <input id="transfersExam" name="transfersExam" className={inputClass} />
          </div>
          <div className="flex flex-col gap-1">
            <label htmlFor="adlsExam" className={labelClass}>ADLs</label>
            <input id="adlsExam" name="adlsExam" className={inputClass} />
          </div>
        </div>
      )}

      {evaluationType === "PEDIATRIC" && (
        <div className={sectionClass}>
          <h2 className={sectionTitleClass}>Milestones Achieved</h2>
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-xs uppercase text-slate-400">
                <th className="pb-2">Milestone</th>
                <th className="pb-2">Achieved</th>
                <th className="pb-2">Level of Assist Needed</th>
              </tr>
            </thead>
            <tbody>
              {PEDIATRIC_MILESTONES.map((m) => (
                <tr key={m} className="border-t border-slate-100">
                  <td className="py-2 pr-2">{m}</td>
                  <td className="py-2 pr-2">
                    <input type="checkbox" name={`milestone_${m}_achieved`} />
                  </td>
                  <td className="py-2">
                    <input name={`milestone_${m}_assistLevel`} className={inputClass} />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          <div className="flex flex-col gap-1">
            <label htmlFor="milestonesComment" className={labelClass}>Comments</label>
            <textarea id="milestonesComment" name="milestonesComment" rows={2} className={inputClass} />
          </div>
        </div>
      )}

      <div className={sectionClass}>
        <h2 className={sectionTitleClass}>Objective</h2>
        <div className="flex flex-col gap-1">
          <label htmlFor="postureExam" className={labelClass}>Posture/Structural Alignment</label>
          <textarea id="postureExam" name="postureExam" rows={2} className={inputClass} />
        </div>
        {evaluationType === "OUTPATIENT" && (
          <div className="flex flex-col gap-1">
            <label htmlFor="palpationExam" className={labelClass}>Palpation</label>
            <textarea id="palpationExam" name="palpationExam" rows={2} className={inputClass} />
          </div>
        )}
        <div className="flex flex-col gap-1">
          <label htmlFor="gaitExam" className={labelClass}>
            {evaluationType === "HOME_HEALTH" ? "Gait/Stairs" : "Gait/General Observation"}
          </label>
          <textarea id="gaitExam" name="gaitExam" rows={2} className={inputClass} />
        </div>
        <div className="flex flex-col gap-1">
          <label htmlFor="balanceExam" className={labelClass}>
            {evaluationType === "PEDIATRIC" ? "Balance/Coordination" : "Balance"}
          </label>
          <textarea id="balanceExam" name="balanceExam" rows={2} className={inputClass} />
        </div>
        <div className="flex flex-col gap-1">
          <label htmlFor="strengthExam" className={labelClass}>Strength</label>
          <textarea id="strengthExam" name="strengthExam" rows={2} className={inputClass} />
        </div>
        <div className="flex flex-col gap-1">
          <label htmlFor="romExam" className={labelClass}>
            {evaluationType === "PEDIATRIC" ? "ROM/Strength/Gross Motor Assessment" : "ROM"}
          </label>
          <textarea id="romExam" name="romExam" rows={2} className={inputClass} />
        </div>

        {evaluationType === "OUTPATIENT" && (
          <>
            <div className="flex flex-col gap-1">
              <label htmlFor="furtherObjectiveTesting" className={labelClass}>Further Objective Testing</label>
              <textarea id="furtherObjectiveTesting" name="furtherObjectiveTesting" rows={2} className={inputClass} />
            </div>
            <div className="flex flex-col gap-1">
              <label htmlFor="specialTestsNote" className={labelClass}>Special Tests</label>
              <textarea id="specialTestsNote" name="specialTestsNote" rows={2} className={inputClass} />
            </div>
          </>
        )}

        {evaluationType === "HOME_HEALTH" && (
          <>
            <div className="flex flex-col gap-1">
              <label htmlFor="motorExam" className={labelClass}>Motor</label>
              <input id="motorExam" name="motorExam" className={inputClass} />
            </div>
            <div className="flex flex-col gap-1">
              <label htmlFor="coordinationExam" className={labelClass}>Coordination</label>
              <input id="coordinationExam" name="coordinationExam" className={inputClass} />
            </div>
            <div className="flex flex-col gap-1">
              <label htmlFor="fatigueExam" className={labelClass}>Fatigue</label>
              <input id="fatigueExam" name="fatigueExam" className={inputClass} />
            </div>
            <div className="flex flex-col gap-1">
              <label htmlFor="confusionMemoryExam" className={labelClass}>Confusion/Memory</label>
              <input id="confusionMemoryExam" name="confusionMemoryExam" className={inputClass} />
            </div>
            <div className="flex flex-col gap-1">
              <label htmlFor="hearingVisionSpeechExam" className={labelClass}>Hearing/Vision/Speech</label>
              <input id="hearingVisionSpeechExam" name="hearingVisionSpeechExam" className={inputClass} />
            </div>
            <div className="flex flex-col gap-1">
              <label htmlFor="otherNeuroFindings" className={labelClass}>Other (wounds, etc)</label>
              <input id="otherNeuroFindings" name="otherNeuroFindings" className={inputClass} />
            </div>
          </>
        )}

        {evaluationType === "PEDIATRIC" && (
          <>
            <div className="flex flex-col gap-1">
              <label htmlFor="grossMotorNote" className={labelClass}>Neuromotor/Muscle Tone Assessment</label>
              <textarea id="grossMotorNote" name="grossMotorNote" rows={2} className={inputClass} />
            </div>
            <div className="flex flex-col gap-1">
              <label htmlFor="sensorimotorNote" className={labelClass}>Sensorimotor Assessment</label>
              <textarea id="sensorimotorNote" name="sensorimotorNote" rows={2} className={inputClass} />
            </div>
            <div className="flex flex-col gap-1">
              <label htmlFor="activityLimitationsNote" className={labelClass}>
                Activity Limitations/Participation Restrictions
              </label>
              <textarea id="activityLimitationsNote" name="activityLimitationsNote" rows={2} className={inputClass} />
            </div>
            <div className="flex flex-col gap-1">
              <label htmlFor="assistiveDevicesPresent" className={labelClass}>ADs Already Present in Home</label>
              <textarea id="assistiveDevicesPresent" name="assistiveDevicesPresent" rows={2} className={inputClass} />
            </div>
            <div className="flex flex-col gap-1">
              <label htmlFor="assistiveDevicesRecommended" className={labelClass}>
                May Benefit From Additional ADs
              </label>
              <textarea id="assistiveDevicesRecommended" name="assistiveDevicesRecommended" rows={2} className={inputClass} />
            </div>
          </>
        )}
      </div>

      <div className={sectionClass}>
        <h2 className={sectionTitleClass}>Assessment &amp; Plan</h2>
        <div className="flex flex-col gap-1">
          <label htmlFor="findings" className={labelClass}>
            {evaluationType === "PEDIATRIC" ? "PT Diagnosis/Prognosis/Justification" : "Assessment"}
          </label>
          <textarea id="findings" name="findings" rows={3} required className={inputClass} />
        </div>
        <div className="flex flex-col gap-1">
          <label htmlFor="goals" className={labelClass}>Plan</label>
          <textarea id="goals" name="goals" rows={2} className={inputClass} />
        </div>
        {evaluationType !== "PEDIATRIC" && (
          <div className="flex flex-col gap-1">
            <label htmlFor="ptRecommendedFrequency" className={labelClass}>
              PT Recommended Frequency
            </label>
            <input id="ptRecommendedFrequency" name="ptRecommendedFrequency" className={inputClass} />
          </div>
        )}
        <div className="flex flex-col gap-1">
          <label htmlFor="initialTreatmentPlan" className={labelClass}>
            Initial Treatment/Education Provided/HEP
          </label>
          <textarea id="initialTreatmentPlan" name="initialTreatmentPlan" rows={2} className={inputClass} />
        </div>
        {evaluationType === "OUTPATIENT" && (
          <div className="flex flex-col gap-1">
            <label htmlFor="referralsNote" className={labelClass}>Referrals</label>
            <input id="referralsNote" name="referralsNote" className={inputClass} />
          </div>
        )}
        <div className="flex flex-col gap-1">
          <span className={labelClass}>
            Short Term Goals ({evaluationType === "HOME_HEALTH" ? "in 2 months" : "in x days/weeks/months"})
          </span>
          <input name="shortTermGoals" placeholder="1." className={inputClass} />
          <input name="shortTermGoals" placeholder="2." className={inputClass} />
          <input name="shortTermGoals" placeholder="3." className={inputClass} />
        </div>
        <div className="flex flex-col gap-1">
          <span className={labelClass}>
            Long Term Goals ({evaluationType === "HOME_HEALTH" ? "in 4 months" : "in x days/weeks/months"})
          </span>
          <input name="longTermGoals" placeholder="1." className={inputClass} />
          <input name="longTermGoals" placeholder="2." className={inputClass} />
          <input name="longTermGoals" placeholder="3." className={inputClass} />
        </div>
        <div className="flex flex-col gap-1">
          <label htmlFor="notes" className={labelClass}>Notes</label>
          <textarea id="notes" name="notes" rows={2} className={inputClass} />
        </div>
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
        {isPending ? "Saving..." : "Save assessment"}
      </button>
    </form>
  );
}
