import "dotenv/config";
import { prisma } from "../lib/db";
import { hashPassword } from "../lib/auth/password";

// The starter permission set. This will grow as each department's
// workflows get built - keep keys as "resource:action" pairs.
const PERMISSIONS = [
  { key: "patient:read", description: "Read a patient's full record" },
  { key: "patient:write", description: "Create or update a patient's record" },
  { key: "consultation:create", description: "Author a medical consultation" },
  { key: "prescription:create", description: "Write a prescription" },
  { key: "prescription:dispense", description: "Dispense a prescription" },
  { key: "referral:manage", description: "Create, accept, or decline referrals" },
  { key: "appointment:manage", description: "Schedule and view scheduled appointments" },
  { key: "inventory:manage", description: "View stock and receive new medicine batches" },
  { key: "rehab:manage", description: "Create rehabilitation assessments and treatment plans" },
  { key: "homenursing:manage", description: "Create home nursing assessments and care plans" },
  { key: "user:manage", description: "Create/edit user accounts and roles" },
  { key: "placement:manage", description: "Manage student clinical placements" },
  { key: "clinical-prep:manage", description: "Create and view your own clinical preparation notes" },
] as const;

const ROLE_PERMISSIONS: Record<string, readonly string[]> = {
  ADMINISTRATOR: PERMISSIONS.map((p) => p.key),
  DOCTOR: [
    "patient:read",
    "patient:write",
    "consultation:create",
    "prescription:create",
    "referral:manage",
    "appointment:manage",
  ],
  PHARMACIST: [
    "patient:read",
    "prescription:dispense",
    "referral:manage",
    "inventory:manage",
  ],
  PHYSIOTHERAPIST: ["patient:read", "referral:manage", "rehab:manage", "appointment:manage"],
  SPEECH_THERAPIST: ["patient:read", "referral:manage", "rehab:manage", "appointment:manage"],
  OCCUPATIONAL_THERAPIST: ["patient:read", "referral:manage", "rehab:manage", "appointment:manage"],
  HOME_NURSING_STAFF: ["patient:read", "referral:manage", "homenursing:manage", "appointment:manage"],
  // patient:read is broad on purpose - which patients actually come into
  // view is scoped to the student's active placement department at query
  // time (see listPatientsForStudent), not expressed here. Authoring
  // official records (rehab:manage/homenursing:manage-gated create
  // actions) doesn't come from a permission grant either - see
  // authorizeClinicalAuthor, which lets a student with a matching active
  // placement through regardless of their own permission set, flagged
  // pending co-sign. clinical-prep:manage is different: prep notes are
  // never official, so it's a real permission grant like any other.
  STUDENT: ["patient:read", "clinical-prep:manage"],
};

// Dev-only test accounts, one per role, so every phase can be tested as the
// role it's actually built for - not just as an all-permissions admin.
const TEST_USERS = [
  { email: "doctor@hillside.local", fullName: "Dr. Sarah Mitchell", roleName: "DOCTOR" },
  { email: "pharmacist@hillside.local", fullName: "James Okafor", roleName: "PHARMACIST" },
  { email: "physio@hillside.local", fullName: "Lisa Chen", roleName: "PHYSIOTHERAPIST" },
  { email: "speech@hillside.local", fullName: "Marcus Reyes", roleName: "SPEECH_THERAPIST" },
  { email: "ot@hillside.local", fullName: "Priya Nair", roleName: "OCCUPATIONAL_THERAPIST" },
  { email: "nurse@hillside.local", fullName: "Grace Obi", roleName: "HOME_NURSING_STAFF" },
  { email: "student@hillside.local", fullName: "Alex Torres", roleName: "STUDENT" },
  { email: "student2@hillside.local", fullName: "Jordan Reyes", roleName: "STUDENT" },
] as const;

const DEPARTMENTS = [
  { name: "Administration", code: "ADMIN" },
  { name: "Medical", code: "MED" },
  { name: "Pharmacy", code: "PHARM" },
  { name: "Rehabilitation", code: "REHAB" },
  { name: "Home Nursing", code: "HN" },
] as const;

// A small starter catalog so prescribing is actually testable. No
// stock/inventory here - that's Phase 3's job. Real catalog management
// (adding new medicines) doesn't have a UI yet either - this is just
// enough to write against for now.
const MEDICINES = [
  { name: "Amoxicillin", genericName: "Amoxicillin", category: "Antibiotic", dosageForm: "Capsule", strength: "500mg", reorderLevel: 50 },
  { name: "Amoxicillin", genericName: "Amoxicillin", category: "Antibiotic", dosageForm: "Syrup", strength: "250mg/5ml", reorderLevel: 10 },
  { name: "Paracetamol", genericName: "Acetaminophen", category: "Analgesic", dosageForm: "Tablet", strength: "500mg", reorderLevel: 100 },
  { name: "Ibuprofen", genericName: "Ibuprofen", category: "NSAID", dosageForm: "Tablet", strength: "400mg", reorderLevel: 50 },
  { name: "Cetirizine", genericName: "Cetirizine", category: "Antihistamine", dosageForm: "Tablet", strength: "10mg", reorderLevel: 30 },
  { name: "Omeprazole", genericName: "Omeprazole", category: "Proton Pump Inhibitor", dosageForm: "Capsule", strength: "20mg", reorderLevel: 30 },
] as const;

async function main() {
  const departmentsByCode = new Map<string, { id: string; code: string }>();
  for (const dept of DEPARTMENTS) {
    const created = await prisma.department.upsert({
      where: { code: dept.code },
      update: {},
      create: dept,
    });
    departmentsByCode.set(created.code, created);
  }
  const department = departmentsByCode.get("ADMIN")!;

  const permissionsByKey = new Map<string, { id: string; key: string }>();
  for (const permission of PERMISSIONS) {
    const created = await prisma.permission.upsert({
      where: { key: permission.key },
      update: { description: permission.description },
      create: permission,
    });
    permissionsByKey.set(created.key, created);
  }

  const rolesByName = new Map<string, { id: string; name: string }>();
  for (const roleName of Object.keys(ROLE_PERMISSIONS)) {
    const role = await prisma.role.upsert({
      where: { name: roleName },
      update: {},
      create: { name: roleName },
    });
    rolesByName.set(role.name, role);

    for (const permissionKey of ROLE_PERMISSIONS[roleName]) {
      const permission = permissionsByKey.get(permissionKey);
      if (!permission) throw new Error(`Unknown permission key: ${permissionKey}`);
      await prisma.rolePermission.upsert({
        where: {
          roleId_permissionId: { roleId: role.id, permissionId: permission.id },
        },
        update: {},
        create: { roleId: role.id, permissionId: permission.id },
      });
    }
  }

  const adminRole = rolesByName.get("ADMINISTRATOR")!;
  const passwordHash = await hashPassword("Password123!");

  const adminUser = await prisma.user.upsert({
    where: { email: "admin@hillside.local" },
    update: {},
    create: {
      email: "admin@hillside.local",
      passwordHash,
      fullName: "System Administrator",
      roleId: adminRole.id,
      departmentId: department.id,
    },
  });

  const ROLE_DEPARTMENT: Record<string, string> = {
    DOCTOR: "MED",
    PHARMACIST: "PHARM",
    PHYSIOTHERAPIST: "REHAB",
    SPEECH_THERAPIST: "REHAB",
    OCCUPATIONAL_THERAPIST: "REHAB",
    HOME_NURSING_STAFF: "HN",
  };

  const testUsers: string[] = [];
  const usersByEmail = new Map<string, { id: string; email: string }>();
  for (const testUser of TEST_USERS) {
    const role = rolesByName.get(testUser.roleName);
    if (!role) throw new Error(`Unknown role for test user: ${testUser.roleName}`);
    const deptCode = ROLE_DEPARTMENT[testUser.roleName];
    const dept = deptCode ? departmentsByCode.get(deptCode) : undefined;

    const user = await prisma.user.upsert({
      where: { email: testUser.email },
      update: {},
      create: {
        email: testUser.email,
        passwordHash,
        fullName: testUser.fullName,
        roleId: role.id,
        departmentId: dept?.id,
      },
    });
    testUsers.push(user.email);
    usersByEmail.set(user.email, user);
  }

  // Seeded ACTIVE placements so each student test account can actually log
  // in (getCurrentUser rejects a STUDENT with no active placement) and so
  // Phase 6's department-scoped patient list and student co-authorship
  // flows have something real to test against in every department that
  // has co-sign wired up so far.
  const SEED_PLACEMENTS = [
    {
      studentEmail: "student@hillside.local",
      supervisorEmail: "physio@hillside.local",
      departmentCode: "REHAB",
      clinicalArea: "Physiotherapy - Orthopedic Rotation",
    },
    {
      studentEmail: "student2@hillside.local",
      supervisorEmail: "nurse@hillside.local",
      departmentCode: "HN",
      clinicalArea: "Home Nursing - Chronic Disease Management Rotation",
    },
  ] as const;

  for (const placement of SEED_PLACEMENTS) {
    const studentUser = usersByEmail.get(placement.studentEmail);
    const supervisorUser = usersByEmail.get(placement.supervisorEmail);
    const dept = departmentsByCode.get(placement.departmentCode);
    if (!studentUser || !dept) continue;

    const now = new Date();
    const startDate = new Date(now);
    startDate.setDate(startDate.getDate() - 7);
    const endDate = new Date(now);
    endDate.setDate(endDate.getDate() + 21);

    const existingPlacement = await prisma.clinicalPlacement.findFirst({
      where: { studentId: studentUser.id, departmentId: dept.id },
    });
    if (!existingPlacement) {
      await prisma.clinicalPlacement.create({
        data: {
          studentId: studentUser.id,
          departmentId: dept.id,
          supervisorId: supervisorUser?.id,
          startDate,
          endDate,
          status: "ACTIVE",
          clinicalArea: placement.clinicalArea,
        },
      });
    }
  }

  for (const medicine of MEDICINES) {
    await prisma.medicine.upsert({
      where: {
        name_strength_dosageForm: {
          name: medicine.name,
          strength: medicine.strength,
          dosageForm: medicine.dosageForm,
        },
      },
      update: { reorderLevel: medicine.reorderLevel },
      create: medicine,
    });
  }

  console.log("Seeded:", {
    departments: [...departmentsByCode.keys()],
    roles: [...rolesByName.keys()],
    permissions: [...permissionsByKey.keys()],
    adminUser: adminUser.email,
    testUsers,
    medicines: MEDICINES.length,
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
