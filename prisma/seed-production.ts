import "dotenv/config";
import crypto from "node:crypto";
import { prisma } from "../lib/db";
import { hashPassword } from "../lib/auth/password";

// Production bootstrap only: catalog/config data (departments, roles,
// permissions, medicine catalog) plus exactly one admin account with a
// freshly generated password. Deliberately does NOT create the demo
// staff/student accounts or sample patient data that prisma/seed.ts does
// for local dev - those all share a well-known password, which is fine on
// a machine only reachable on localhost but not on a real public site.
// Every other real account should be created afterward through the
// Users & Roles page (/users/new), each with its own password.

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
  { key: "publichealth:manage", description: "Log community outreach visits and disease surveillance cases" },
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
  STUDENT: ["patient:read", "clinical-prep:manage"],
  MEDICAL_DIRECTOR: [
    "patient:read",
    "patient:write",
    "consultation:create",
    "prescription:create",
    "referral:manage",
    "appointment:manage",
    "placement:manage",
  ],
  REHABILITATION_DIRECTOR: [
    "patient:read",
    "referral:manage",
    "rehab:manage",
    "appointment:manage",
    "placement:manage",
  ],
  HEAD_OF_NURSING: [
    "patient:read",
    "referral:manage",
    "homenursing:manage",
    "appointment:manage",
    "placement:manage",
  ],
  HEAD_OF_PHARMACY: [
    "patient:read",
    "prescription:dispense",
    "referral:manage",
    "inventory:manage",
    "placement:manage",
  ],
  PUBLIC_HEALTH_DIRECTOR: ["patient:read", "publichealth:manage", "placement:manage"],
};

const DEPARTMENTS = [
  { name: "Administration", code: "ADMIN" },
  { name: "Medical", code: "MED" },
  { name: "Pharmacy", code: "PHARM" },
  { name: "Rehabilitation", code: "REHAB" },
  { name: "Home Nursing", code: "HN" },
  { name: "Public Health", code: "PH" },
] as const;

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
  const adminDepartment = departmentsByCode.get("ADMIN")!;

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

  const adminRole = rolesByName.get("ADMINISTRATOR")!;
  const existingAdmin = await prisma.user.findUnique({
    where: { email: "admin@hillside.local" },
  });

  if (existingAdmin) {
    console.log("Admin account already exists - not touching its password.");
    console.log("Seeded:", {
      departments: [...departmentsByCode.keys()],
      roles: [...rolesByName.keys()],
      permissions: [...permissionsByKey.keys()],
      medicines: MEDICINES.length,
      adminUser: existingAdmin.email,
    });
    return;
  }

  const generatedPassword = crypto.randomBytes(15).toString("base64url");
  const passwordHash = await hashPassword(generatedPassword);

  const adminUser = await prisma.user.create({
    data: {
      email: "admin@hillside.local",
      passwordHash,
      fullName: "System Administrator",
      roleId: adminRole.id,
      departmentId: adminDepartment.id,
    },
  });

  console.log("Seeded:", {
    departments: [...departmentsByCode.keys()],
    roles: [...rolesByName.keys()],
    permissions: [...permissionsByKey.keys()],
    medicines: MEDICINES.length,
  });
  console.log("");
  console.log("=============================================");
  console.log("ADMIN ACCOUNT CREATED - SAVE THIS PASSWORD NOW");
  console.log(`  Email:    ${adminUser.email}`);
  console.log(`  Password: ${generatedPassword}`);
  console.log("This password is shown only once and is not stored anywhere in plain text.");
  console.log("=============================================");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
