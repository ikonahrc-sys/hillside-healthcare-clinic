import "dotenv/config";
import { prisma } from "../lib/db";
import { hashPassword } from "../lib/auth/password";
import { getFacilityDayRange } from "../lib/utils/schedule";

// Fills an otherwise-empty (or freshly-launched) database with generic,
// clearly-fictional demo data spanning every department, so staff can
// click through real workflows (booking, co-sign, referrals, dispensing,
// public health) without waiting for actual patients. Safe to run more
// than once - it checks for its own marker email domain and does nothing
// if that data already exists, rather than duplicating on a re-run.

const DEMO_EMAIL_DOMAIN = "@hillside.test";
const DEMO_STAFF_PASSWORD = "DemoPass123!";

function daysAgo(n: number): Date {
  return new Date(Date.now() - n * 86_400_000);
}

// A specific Belize-local wall-clock time on a day relative to today -
// reuses the same day-boundary math the real scheduling code uses, so
// seeded appointments land in the "Today"/"Tomorrow"/"Upcoming" windows
// the dashboards actually query, however far the demo has drifted from
// the day it was first seeded.
function facilityDateTime(daysOffset: number, hour: number, minute = 0): Date {
  const { start } = getFacilityDayRange(daysOffset);
  return new Date(start.getTime() + hour * 3600_000 + minute * 60_000);
}

async function getOrCreateStaff(
  email: string,
  fullName: string,
  roleName: string,
  departmentCode: string,
) {
  const existing = await prisma.user.findUnique({ where: { email } });
  if (existing) return existing;

  const role = await prisma.role.findUniqueOrThrow({ where: { name: roleName } });
  const department = await prisma.department.findUniqueOrThrow({ where: { code: departmentCode } });
  const passwordHash = await hashPassword(DEMO_STAFF_PASSWORD);

  return prisma.user.create({
    data: { email, fullName, passwordHash, roleId: role.id, departmentId: department.id },
  });
}

async function main() {
  const alreadySeeded = await prisma.patient.findFirst({
    where: { email: { endsWith: DEMO_EMAIL_DOMAIN } },
  });
  if (alreadySeeded) {
    console.log("Demo data already present (found a @hillside.test patient) - skipping.");
    return;
  }

  const departmentsByCode = new Map(
    (await prisma.department.findMany()).map((d) => [d.code, d]),
  );
  const med = departmentsByCode.get("MED")!;
  const pharm = departmentsByCode.get("PHARM")!;
  const rehab = departmentsByCode.get("REHAB")!;
  const hn = departmentsByCode.get("HN")!;
  const ph = departmentsByCode.get("PH")!;

  // Reuse whatever real staff already exist (created through the app's own
  // Users & Roles screen) rather than shadowing them with duplicates -
  // only fill in the roles nothing yet covers.
  const admin = await prisma.user.findUniqueOrThrow({ where: { email: "admin@hillside.local" } });
  const rehabDirector = await prisma.user.findFirst({
    where: { role: { name: "REHABILITATION_DIRECTOR" } },
  });
  const rehabStudent = await prisma.user.findFirst({ where: { role: { name: "STUDENT" } } });

  const doctor = await getOrCreateStaff("doctor.demo@hillside.test", "Dr. Demo Physician", "DOCTOR", "MED");
  const pharmacist = await getOrCreateStaff("pharmacist.demo@hillside.test", "Demo Pharmacist", "PHARMACIST", "PHARM");
  const physio = await getOrCreateStaff("physio.demo@hillside.test", "Demo Physiotherapist", "PHYSIOTHERAPIST", "REHAB");
  const nurse = await getOrCreateStaff("nurse.demo@hillside.test", "Demo Home Nurse", "HOME_NURSING_STAFF", "HN");
  const publicHealthOfficer = await getOrCreateStaff(
    "publichealth.demo@hillside.test",
    "Demo Public Health Officer",
    "PUBLIC_HEALTH_DIRECTOR",
    "PH",
  );

  const rehabAuthor = rehabDirector ?? physio;

  const amoxicillin = await prisma.medicine.findFirstOrThrow({ where: { name: "Amoxicillin", dosageForm: "Capsule" } });
  const paracetamol = await prisma.medicine.findFirstOrThrow({ where: { name: "Paracetamol" } });

  // --- Patient 1: Maria Gonzalez - Medical -> Rehab (Outpatient PT), full journey ---
  const maria = await prisma.patient.create({
    data: {
      firstName: "Maria",
      lastName: "Gonzalez",
      dateOfBirth: new Date("1985-03-14"),
      sex: "FEMALE",
      address: "12 Coral Street, Belize City",
      phone: "501-555-0101",
      email: `maria.gonzalez${DEMO_EMAIL_DOMAIN}`,
      allergies: "Penicillin",
    },
  });

  const mariaConsult = await prisma.consultation.create({
    data: {
      patientId: maria.id,
      doctorId: doctor.id,
      consultationDate: daysAgo(10),
      chiefComplaint: "Low back pain radiating to right leg for 2 weeks",
      historyOfPresentIllness: "Onset after lifting a heavy box at work. Worse with sitting, better with walking.",
      examinationNotes: "Positive straight leg raise on right. No red flags.",
      assessment: "Lumbar radiculopathy, likely L5 nerve root",
      treatmentNotes: "Referred to Physiotherapy for conservative management",
      vitals: {
        create: {
          temperatureC: 36.8,
          heartRateBpm: 78,
          respiratoryRatePerMin: 16,
          bloodPressureSystolic: 128,
          bloodPressureDiastolic: 82,
          oxygenSaturationPercent: 98,
          weightKg: 68,
          heightCm: 162,
        },
      },
      diagnoses: {
        create: [{ patientId: maria.id, description: "Lumbar radiculopathy", isPrimary: true }],
      },
    },
  });

  const mariaReferral = await prisma.referral.create({
    data: {
      patientId: maria.id,
      fromDepartmentId: med.id,
      toDepartmentId: rehab.id,
      referringUserId: doctor.id,
      consultationId: mariaConsult.id,
      reason: "Conservative management of lumbar radiculopathy",
      status: "ACCEPTED",
      respondedByUserId: physio.id,
      respondedAt: daysAgo(9),
    },
  });

  const mariaAssessment = await prisma.rehabAssessment.create({
    data: {
      patientId: maria.id,
      referralId: mariaReferral.id,
      therapistId: physio.id,
      discipline: "PHYSIOTHERAPY",
      evaluationType: "OUTPATIENT",
      findings: "Reduced lumbar ROM, positive SLR at 40 degrees right, 5/5 strength throughout",
      functionalLimitations: "Unable to sit more than 20 minutes, difficulty with prolonged standing",
      chiefComplaint: "Low back pain radiating to right leg",
      mechanismOfInjury: "Lifting injury at work",
      dateOfOnset: "2 weeks ago",
      painType: ["Sharp", "Achy"],
      painAggravates: "Sitting, bending forward",
      painRelieves: "Walking, lying flat",
      painTiming: ["In AM"],
      painLevelWorst: 8,
      painLevelBest: 3,
      painLevelCurrent: 5,
      socialHistory: "Works as a warehouse clerk, lifting required",
      medicalScreenFlags: [],
      sensoryExam: "Intact to light touch bilaterally",
      reflexesExam: "2+ patellar and achilles bilaterally",
      patientGoals: "Return to work without restrictions",
      postureExam: "Mild forward pelvic tilt",
      palpationExam: "Tenderness over right L5 paraspinals",
      gaitExam: "Antalgic, favoring right side",
      strengthExam: "5/5 throughout, guarded lumbar flexion",
      romExam: "Lumbar flexion 40 degrees, limited by pain",
      ptRecommendedFrequency: "2x/week for 4 weeks",
      shortTermGoals: ["Reduce pain to 3/10 within 2 weeks", "Improve lumbar flexion by 20%"],
      longTermGoals: ["Return to work full duty within 6 weeks"],
      createdAt: daysAgo(9),
    },
  });

  const mariaPlan = await prisma.rehabTreatmentPlan.create({
    data: {
      assessmentId: mariaAssessment.id,
      patientId: maria.id,
      therapistId: physio.id,
      goals: "Reduce pain, restore lumbar ROM, return to full work duty",
      frequency: "2x/week for 4 weeks",
      reviewDate: daysAgo(-19),
      status: "ACTIVE",
      createdAt: daysAgo(9),
    },
  });

  await prisma.therapySession.create({
    data: {
      treatmentPlanId: mariaPlan.id,
      patientId: maria.id,
      therapistId: physio.id,
      sessionDate: daysAgo(5),
      setting: "CLINIC",
      subjective: "Reports pain improved to 4/10, sleeping better",
      objective: "Lumbar flexion improved to 55 degrees, SLR now negative",
      assessment: "Good progress, responding well to manual therapy and exercise",
      plan: "Progress core stabilization exercises, continue manual therapy",
      homeExerciseProgram: "Pelvic tilts, cat-cow, walking 20 min/day",
    },
  });
  await prisma.therapySession.create({
    data: {
      treatmentPlanId: mariaPlan.id,
      patientId: maria.id,
      therapistId: physio.id,
      sessionDate: daysAgo(2),
      setting: "CLINIC",
      subjective: "Pain now 2/10, able to sit through full work shift",
      objective: "Full lumbar ROM, strength 5/5, gait normal",
      assessment: "Excellent progress, nearing discharge criteria",
      plan: "Continue home program, reassess in 1 week for discharge",
      homeExerciseProgram: "Progressing to bridges and bird-dog, 3x/week",
    },
  });

  await prisma.appointment.create({
    data: {
      patientId: maria.id,
      departmentId: rehab.id,
      staffId: physio.id,
      type: "PHYSIOTHERAPY",
      scheduledAt: facilityDateTime(1, 9, 0),
      notes: "Follow-up session, reassess for discharge",
    },
  });

  // --- Patient 2: John Pinto - Medical -> Pharmacy, with an actual dispensed item ---
  const john = await prisma.patient.create({
    data: {
      firstName: "John",
      lastName: "Pinto",
      dateOfBirth: new Date("1978-11-02"),
      sex: "MALE",
      address: "45 Mahogany Ave, Belmopan",
      phone: "501-555-0202",
      email: `john.pinto${DEMO_EMAIL_DOMAIN}`,
    },
  });

  const johnConsult = await prisma.consultation.create({
    data: {
      patientId: john.id,
      doctorId: doctor.id,
      consultationDate: daysAgo(2),
      chiefComplaint: "Fever and productive cough for 3 days",
      examinationNotes: "Crackles in right lower lobe",
      assessment: "Community-acquired pneumonia, right lower lobe",
      vitals: {
        create: { temperatureC: 38.6, heartRateBpm: 96, respiratoryRatePerMin: 20, oxygenSaturationPercent: 95 },
      },
      diagnoses: {
        create: [{ patientId: john.id, description: "Community-acquired pneumonia", isPrimary: true }],
      },
    },
  });

  await prisma.referral.create({
    data: {
      patientId: john.id,
      fromDepartmentId: med.id,
      toDepartmentId: pharm.id,
      referringUserId: doctor.id,
      consultationId: johnConsult.id,
      reason: "Dispense antibiotic course and counsel on completion",
      status: "PENDING",
    },
  });

  const amoxBatch = await prisma.medicineBatch.create({
    data: {
      medicineId: amoxicillin.id,
      batchNumber: "DEMO-AMX-001",
      expiryDate: daysAgo(-365),
      quantityOnHand: 80,
      receivedAt: daysAgo(30),
    },
  });
  await prisma.inventoryTransaction.create({
    data: {
      medicineBatchId: amoxBatch.id,
      type: "RECEIVED",
      quantityChange: 100,
      performedByUserId: pharmacist.id,
      notes: "Initial stock receipt (demo data)",
      createdAt: daysAgo(30),
    },
  });

  const johnPrescription = await prisma.prescription.create({
    data: {
      patientId: john.id,
      consultationId: johnConsult.id,
      prescribedByUserId: doctor.id,
      status: "PROCESSING",
      items: {
        create: [
          { medicineId: amoxicillin.id, dosageInstructions: "500mg three times daily for 7 days", quantity: 21 },
          { medicineId: paracetamol.id, dosageInstructions: "500mg every 6 hours as needed for fever", quantity: 20 },
        ],
      },
    },
    include: { items: true },
  });

  const amoxItem = johnPrescription.items.find((i) => i.medicineId === amoxicillin.id)!;
  await prisma.prescriptionItem.update({
    where: { id: amoxItem.id },
    data: {
      dispensedAt: daysAgo(1),
      dispensedFromBatchId: amoxBatch.id,
      dispensedByUserId: pharmacist.id,
    },
  });
  await prisma.inventoryTransaction.create({
    data: {
      medicineBatchId: amoxBatch.id,
      type: "DISPENSED",
      quantityChange: -21,
      performedByUserId: pharmacist.id,
      relatedPrescriptionItemId: amoxItem.id,
      createdAt: daysAgo(1),
    },
  });
  await prisma.medicineBatch.update({
    where: { id: amoxBatch.id },
    data: { quantityOnHand: { decrement: 21 } },
  });

  await prisma.appointment.create({
    data: {
      patientId: john.id,
      departmentId: pharm.id,
      staffId: pharmacist.id,
      type: "PHARMACY_CONSULTATION",
      scheduledAt: facilityDateTime(0, 14, 30),
      notes: "Medication counseling - completing antibiotic course",
    },
  });

  // --- Patient 3: Elena Cruz - Medical -> Home Nursing, full journey ---
  const elena = await prisma.patient.create({
    data: {
      firstName: "Elena",
      lastName: "Cruz",
      dateOfBirth: new Date("1948-06-20"),
      sex: "FEMALE",
      address: "8 Seagrape Lane, San Ignacio",
      phone: "501-555-0303",
      email: `elena.cruz${DEMO_EMAIL_DOMAIN}`,
      emergencyContactName: "Miguel Cruz (son)",
      emergencyContactPhone: "501-555-0304",
      medicalHistoryNotes: "Type 2 diabetes, hypertension, limited mobility post-stroke",
    },
  });

  const elenaConsult = await prisma.consultation.create({
    data: {
      patientId: elena.id,
      doctorId: doctor.id,
      consultationDate: daysAgo(14),
      chiefComplaint: "Follow-up post-stroke, difficulty with home mobility and wound care",
      assessment: "Stable post-CVA, needs home nursing support for mobility and wound care",
    },
  });

  const elenaReferral = await prisma.referral.create({
    data: {
      patientId: elena.id,
      fromDepartmentId: med.id,
      toDepartmentId: hn.id,
      referringUserId: doctor.id,
      consultationId: elenaConsult.id,
      reason: "Home nursing support - mobility assistance and pressure wound monitoring",
      status: "ACCEPTED",
      respondedByUserId: nurse.id,
      respondedAt: daysAgo(13),
    },
  });

  const elenaAssessment = await prisma.homeNursingAssessment.create({
    data: {
      patientId: elena.id,
      referralId: elenaReferral.id,
      nurseId: nurse.id,
      findings: "Stage 2 pressure sore on right heel, limited left-side mobility post-CVA",
      careNeeds: "Wound care, mobility assistance, medication reminders",
      precautions: "Fall risk - requires assistance with transfers",
      createdAt: daysAgo(13),
    },
  });

  const elenaCarePlan = await prisma.homeNursingCarePlan.create({
    data: {
      assessmentId: elenaAssessment.id,
      patientId: elena.id,
      nurseId: nurse.id,
      goals: "Heal pressure wound, prevent further skin breakdown, maintain safe mobility",
      frequency: "3x/week",
      reviewDate: daysAgo(-16),
      status: "ACTIVE",
      createdAt: daysAgo(13),
    },
  });

  await prisma.homeVisit.create({
    data: {
      carePlanId: elenaCarePlan.id,
      patientId: elena.id,
      nurseId: nurse.id,
      visitDate: daysAgo(6),
      careProvided: "Wound cleaning and redressing, blood pressure check, medication review",
      patientCondition: "Wound showing granulation, no signs of infection",
    },
  });
  await prisma.homeVisit.create({
    data: {
      carePlanId: elenaCarePlan.id,
      patientId: elena.id,
      nurseId: nurse.id,
      visitDate: daysAgo(2),
      careProvided: "Wound redressing, mobility exercises, family caregiver education",
      patientCondition: "Wound continuing to heal, improved mobility with walker",
    },
  });

  await prisma.appointment.create({
    data: {
      patientId: elena.id,
      departmentId: hn.id,
      staffId: nurse.id,
      type: "HOME_NURSING_VISIT",
      scheduledAt: facilityDateTime(3, 10, 0),
      notes: "Routine wound check and vitals",
    },
  });

  // --- Patient 4: baby Noah Flores - Rehab registers a walk-in directly, Pediatric evaluation ---
  const noah = await prisma.patient.create({
    data: {
      firstName: "Noah",
      lastName: "Flores",
      dateOfBirth: new Date("2024-01-15"),
      sex: "MALE",
      address: "22 Cashew Street, Dangriga",
      phone: "501-555-0405",
      email: `noah.flores${DEMO_EMAIL_DOMAIN}`,
    },
  });

  const noahAssessment = await prisma.rehabAssessment.create({
    data: {
      patientId: noah.id,
      therapistId: rehabAuthor.id,
      discipline: "PHYSIOTHERAPY",
      evaluationType: "PEDIATRIC",
      findings: "Delayed gross motor milestones consistent with mild hypotonia. PT indicated 2x/week.",
      village: "Hopkins Village",
      caregiver1: "Ana Flores (mother)",
      secondaryConcern: "Delayed walking compared to peers",
      birthHistory: "Full-term, uncomplicated vaginal delivery",
      milestoneHistoryNote: "Sat independently at 9 months, not yet pulling to stand at 18 months",
      familyGoals: "Walking independently, keeping up with older siblings",
      behavioralObservation: "Alert, socially engaged, tolerated handling well",
      grossMotorNote: "Mild central hypotonia, decreased antigravity control",
      milestonesComment: "Working on pull-to-stand and cruising",
      createdAt: daysAgo(4),
      milestones: {
        createMany: {
          data: [
            { milestone: "Visual Tracking", achieved: true },
            { milestone: "Head Control", achieved: true },
            { milestone: "Rolling", achieved: true },
            { milestone: "Sitting", achieved: true, assistLevel: "Independent" },
            { milestone: "Quadruped", achieved: true, assistLevel: "Min assist" },
            { milestone: "Crawling", achieved: false },
            { milestone: "Tall Kneeling", achieved: false },
            { milestone: "Standing", achieved: false },
            { milestone: "Walking", achieved: false },
          ],
        },
      },
    },
  });

  const noahPlan = await prisma.rehabTreatmentPlan.create({
    data: {
      assessmentId: noahAssessment.id,
      patientId: noah.id,
      therapistId: rehabAuthor.id,
      goals: "Achieve independent pull-to-stand and cruising within 8 weeks",
      frequency: "2x/week",
      reviewDate: daysAgo(-24),
      status: "ACTIVE",
      createdAt: daysAgo(4),
    },
  });

  await prisma.therapySession.create({
    data: {
      treatmentPlanId: noahPlan.id,
      patientId: noah.id,
      therapistId: rehabAuthor.id,
      sessionDate: daysAgo(1),
      setting: "CLINIC",
      subjective: "Mother reports Noah attempting to pull up on furniture at home",
      objective: "Achieved pull-to-stand with min assist x2 trials, tolerated 5 min of tummy time play",
      assessment: "Emerging antigravity strength, good engagement with therapy",
      plan: "Continue strengthening activities, add cruising practice next session",
      homeExerciseProgram: "Encourage supported standing at low furniture, tummy time 3x/day",
    },
  });

  await prisma.appointment.create({
    data: {
      patientId: noah.id,
      departmentId: rehab.id,
      staffId: rehabAuthor.id,
      type: "PHYSIOTHERAPY",
      scheduledAt: facilityDateTime(0, 11, 0),
      notes: "Pediatric PT follow-up",
    },
  });

  // --- Patient 5: Carlos Reyes - Rehab Home Health evaluation ---
  const carlos = await prisma.patient.create({
    data: {
      firstName: "Carlos",
      lastName: "Reyes",
      dateOfBirth: new Date("1952-09-08"),
      sex: "MALE",
      address: "3 Orange Walk Road, Orange Walk Town",
      phone: "501-555-0506",
      email: `carlos.reyes${DEMO_EMAIL_DOMAIN}`,
      medicalHistoryNotes: "Recent hip replacement, homebound during early recovery",
    },
  });

  const carlosAssessment = await prisma.rehabAssessment.create({
    data: {
      patientId: carlos.id,
      therapistId: physio.id,
      discipline: "PHYSIOTHERAPY",
      evaluationType: "HOME_HEALTH",
      findings: "Post-op right total hip replacement, 2 weeks out, weight-bearing as tolerated",
      priorTreatment: "Inpatient PT during hospital stay",
      generalHealth: "Otherwise healthy, motivated for recovery",
      priorFunctionalLevelAdUse: "Independent with cane prior to surgery",
      vitalsBp: "130/84",
      vitalsHr: "76",
      bedMobilityExam: "Independent with hip precautions",
      transfersExam: "Modified independent with walker",
      adlsExam: "Needs min assist for lower body dressing",
      gaitExam: "Ambulates 50 feet with walker, antalgic gait",
      romExam: "Hip flexion limited to 80 degrees per precautions",
      ptRecommendedFrequency: "2x/week home health",
      shortTermGoals: ["Ambulate 150 feet with walker within 2 weeks"],
      longTermGoals: ["Return to prior level of function with cane within 8 weeks"],
      createdAt: daysAgo(3),
    },
  });

  const carlosPlan = await prisma.rehabTreatmentPlan.create({
    data: {
      assessmentId: carlosAssessment.id,
      patientId: carlos.id,
      therapistId: physio.id,
      goals: "Progress weight-bearing and gait independence per hip precautions",
      frequency: "2x/week home health",
      reviewDate: daysAgo(-25),
      status: "ACTIVE",
      createdAt: daysAgo(3),
    },
  });

  await prisma.therapySession.create({
    data: {
      treatmentPlanId: carlosPlan.id,
      patientId: carlos.id,
      therapistId: physio.id,
      sessionDate: daysAgo(0),
      setting: "HOME_HEALTH_VISIT",
      subjective: "Reports less pain today, motivated to progress",
      objective: "Ambulated 80 feet with walker, hip flexion now 90 degrees",
      assessment: "Progressing as expected for post-op timeline",
      plan: "Advance to single-point cane practice next visit",
      homeExerciseProgram: "Ankle pumps, quad sets, heel slides within precautions",
    },
  });

  await prisma.appointment.create({
    data: {
      patientId: carlos.id,
      departmentId: rehab.id,
      staffId: physio.id,
      type: "PHYSIOTHERAPY",
      scheduledAt: facilityDateTime(5, 13, 0),
      notes: "Home health PT visit",
    },
  });

  // --- Patient 6: Grace Tillett - Public Health ---
  const grace = await prisma.patient.create({
    data: {
      firstName: "Grace",
      lastName: "Tillett",
      dateOfBirth: new Date("1990-02-27"),
      sex: "FEMALE",
      address: "Cattle Landing, Punta Gorda",
      phone: "501-555-0607",
      email: `grace.tillett${DEMO_EMAIL_DOMAIN}`,
    },
  });

  await prisma.diseaseSurveillanceCase.create({
    data: {
      patientId: grace.id,
      reportedByUserId: publicHealthOfficer.id,
      diseaseName: "Dengue Fever",
      reportDate: daysAgo(4),
      location: "Punta Gorda",
      status: "CONFIRMED",
      notes: "Confirmed via rapid test, household spraying scheduled",
    },
  });

  await prisma.communityOutreachVisit.create({
    data: {
      staffId: publicHealthOfficer.id,
      visitDate: daysAgo(7),
      location: "Punta Gorda - Cattle Landing area",
      activity: "Dengue prevention education and mosquito breeding site inspection",
      peopleReached: 45,
      notes: "Distributed larvicide, identified 3 standing-water sites for follow-up",
    },
  });
  await prisma.communityOutreachVisit.create({
    data: {
      staffId: publicHealthOfficer.id,
      visitDate: daysAgo(1),
      location: "Hopkins Village",
      activity: "Childhood immunization awareness drive",
      peopleReached: 60,
      notes: "Partnered with village council, scheduled follow-up clinic day",
    },
  });

  await prisma.appointment.create({
    data: {
      patientId: grace.id,
      departmentId: ph.id,
      staffId: publicHealthOfficer.id,
      type: "PUBLIC_HEALTH_VISIT",
      scheduledAt: facilityDateTime(1, 15, 0),
      notes: "Follow-up household visit re: dengue case",
    },
  });

  // --- Patient 7: Amara Duke - student-authored, pending co-sign, with a supervisor comment ---
  const amara = await prisma.patient.create({
    data: {
      firstName: "Amara",
      lastName: "Duke",
      dateOfBirth: new Date("1999-05-30"),
      sex: "FEMALE",
      address: "17 Pine Ridge Road, Belmopan",
      phone: "501-555-0708",
      email: `amara.duke${DEMO_EMAIL_DOMAIN}`,
    },
  });

  if (rehabStudent && rehabDirector) {
    const amaraAssessment = await prisma.rehabAssessment.create({
      data: {
        patientId: amara.id,
        therapistId: rehabStudent.id,
        discipline: "PHYSIOTHERAPY",
        evaluationType: "OUTPATIENT",
        findings: "Shoulder impingement, positive Neer and Hawkins-Kennedy tests",
        functionalLimitations: "Difficulty with overhead reaching",
        chiefComplaint: "Right shoulder pain with overhead activity",
        painLevelCurrent: 6,
        shortTermGoals: ["Reduce pain with overhead reaching"],
        createdAt: daysAgo(1),
      },
    });

    await prisma.recordComment.create({
      data: {
        entityType: "RehabAssessment",
        entityId: amaraAssessment.id,
        authorId: rehabDirector.id,
        content: "Good exam findings - please also document AROM vs PROM measurements before I co-sign.",
      },
    });
  }

  console.log("Demo data seeded:");
  console.log("Staff created/reused:", {
    doctor: doctor.email,
    pharmacist: pharmacist.email,
    physio: physio.email,
    nurse: nurse.email,
    publicHealthOfficer: publicHealthOfficer.email,
    demoStaffPassword: DEMO_STAFF_PASSWORD,
  });
  console.log("Patients created:", [
    maria.id && "Maria Gonzalez",
    john.id && "John Pinto",
    elena.id && "Elena Cruz",
    noah.id && "Noah Flores",
    carlos.id && "Carlos Reyes",
    grace.id && "Grace Tillett",
    amara.id && "Amara Duke",
  ]);
  console.log("Reused existing accounts:", {
    admin: admin.email,
    rehabDirector: rehabDirector?.email ?? "(none found)",
    rehabStudent: rehabStudent?.email ?? "(none found)",
  });
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
