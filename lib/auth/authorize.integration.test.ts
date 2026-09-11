import { describe, it, expect, beforeAll, afterAll } from "vitest";
import { prisma } from "@/lib/db";
import { can, authorize, requireAuthenticated, AuthorizationError } from "@/lib/auth/authorize";
import { authorizeClinicalAuthor, canAuthorClinicalRecord } from "@/lib/auth/clinical-author";
import type { CurrentUser } from "@/lib/auth/session";

// Unlike placement.test.ts, these functions are meaningless without a real
// database round trip - authorize()/can() query RolePermission,
// authorizeClinicalAuthor() also queries ClinicalPlacement. Mocking Prisma
// here would only prove the mock returns what we told it to; it wouldn't
// catch a wrong `where` clause. This suite runs against a dedicated test
// database (see .env.test / vitest.setup.env.ts), never the dev DB used for
// manual/browser verification.
//
// All fixtures below are created fresh by this file and deleted in
// afterAll - nothing here depends on prisma/seed.ts's demo data, so this
// suite stays correct even if the seed data changes.
//
// One subtlety worth noting: authorize.ts's getPermissionKeys is wrapped in
// React's cache(), keyed by roleId. Outside of Next.js's per-request scope
// (i.e. under plain Vitest), that cache has no request boundary to reset
// it - it simply persists for the life of this test process. That's fine
// as long as a role's permission set never changes after it's created
// (which is true below - every role's permissions are fixed at fixture
// creation), but it does mean this cache would return stale data if a test
// tried to mutate an existing role's permissions mid-run instead of
// creating a new role.

const DAY_MS = 1000 * 60 * 60 * 24;
let unique = 0;
function tag() {
  unique += 1;
  return `${Date.now()}-${unique}`;
}

const roleIds: string[] = [];
const permissionIds: string[] = [];
const departmentIds: string[] = [];
const userIds: string[] = [];
const placementIds: string[] = [];

async function makeDepartment() {
  const department = await prisma.department.create({
    data: { name: `Test Department ${tag()}`, code: `TEST-${tag()}` },
  });
  departmentIds.push(department.id);
  return department;
}

async function makeRole(permissionKeys: string[] = [], name = `TEST_ROLE_${tag()}`) {
  const role = await prisma.role.create({ data: { name } });
  roleIds.push(role.id);
  for (const key of permissionKeys) {
    const permission = await prisma.permission.create({ data: { key: `${key}:${tag()}` } });
    permissionIds.push(permission.id);
    await prisma.rolePermission.create({
      data: { roleId: role.id, permissionId: permission.id },
    });
  }
  return role;
}

async function makeUser(role: { id: string; name: string }, departmentId: string | null = null): Promise<CurrentUser> {
  const user = await prisma.user.create({
    data: {
      email: `test-${tag()}@example.test`,
      passwordHash: "not-a-real-hash",
      fullName: `Test User ${tag()}`,
      roleId: role.id,
      departmentId,
    },
  });
  userIds.push(user.id);
  return {
    id: user.id,
    email: user.email,
    fullName: user.fullName,
    role: { id: role.id, name: role.name },
    departmentId,
  };
}

async function makePlacement(opts: {
  studentId: string;
  departmentId: string;
  status?: "UPCOMING" | "ACTIVE" | "EXPIRED" | "SUSPENDED" | "EXTENDED";
  startDate?: Date;
  endDate?: Date;
}) {
  const now = new Date();
  const placement = await prisma.clinicalPlacement.create({
    data: {
      studentId: opts.studentId,
      departmentId: opts.departmentId,
      status: opts.status ?? "ACTIVE",
      startDate: opts.startDate ?? new Date(now.getTime() - 7 * DAY_MS),
      endDate: opts.endDate ?? new Date(now.getTime() + 7 * DAY_MS),
    },
  });
  placementIds.push(placement.id);
  return placement;
}

afterAll(async () => {
  await prisma.clinicalPlacement.deleteMany({ where: { id: { in: placementIds } } });
  await prisma.user.deleteMany({ where: { id: { in: userIds } } });
  await prisma.rolePermission.deleteMany({ where: { roleId: { in: roleIds } } });
  await prisma.permission.deleteMany({ where: { id: { in: permissionIds } } });
  await prisma.role.deleteMany({ where: { id: { in: roleIds } } });
  await prisma.department.deleteMany({ where: { id: { in: departmentIds } } });
});

// authorizeClinicalAuthor() checks `role.name === "STUDENT"` literally, and
// Role.name is unique - so every "a student does X" test below shares this
// one role (with a fixed, empty permission set) and varies the placement
// instead, rather than each test minting its own differently-named "student"
// role that would never actually hit the student code path.
let studentRole: { id: string; name: string };
beforeAll(async () => {
  studentRole = await makeRole([], "STUDENT");
});

describe("can()", () => {
  it("is true when the user's role holds the permission", async () => {
    const role = await makeRole(["patient:read"]);
    const user = await makeUser(role);
    const [rolePermission] = await prisma.rolePermission.findMany({
      where: { roleId: role.id },
      include: { permission: true },
    });
    expect(await can(user, rolePermission.permission.key)).toBe(true);
  });

  it("is false when the user's role does not hold the permission", async () => {
    const role = await makeRole([]);
    const user = await makeUser(role);
    expect(await can(user, "some:unrelated:permission")).toBe(false);
  });
});

describe("authorize()", () => {
  it("returns the user when the permission is present", async () => {
    const role = await makeRole(["placement:manage"]);
    const user = await makeUser(role);
    const [rolePermission] = await prisma.rolePermission.findMany({
      where: { roleId: role.id },
      include: { permission: true },
    });
    await expect(authorize(user, rolePermission.permission.key)).resolves.toBe(user);
  });

  it("throws when the permission is missing", async () => {
    const role = await makeRole([]);
    const user = await makeUser(role);
    await expect(authorize(user, "clinical-prep:manage")).rejects.toThrow(AuthorizationError);
  });

  it("throws when there is no signed-in user", async () => {
    await expect(authorize(null, "placement:manage")).rejects.toThrow(AuthorizationError);
  });
});

describe("requireAuthenticated()", () => {
  it("returns the user when signed in", () => {
    const fakeUser = { id: "x", email: "x@x.com", fullName: "X", role: { id: "r", name: "R" }, departmentId: null };
    expect(requireAuthenticated(fakeUser)).toBe(fakeUser);
  });

  it("throws when not signed in", () => {
    expect(() => requireAuthenticated(null)).toThrow(AuthorizationError);
  });
});

describe("authorizeClinicalAuthor()", () => {
  it("lets a normal permission holder author outright, with no co-sign required", async () => {
    const department = await makeDepartment();
    const role = await makeRole(["rehab:manage"]);
    const user = await makeUser(role, department.id);
    const [rolePermission] = await prisma.rolePermission.findMany({
      where: { roleId: role.id },
      include: { permission: true },
    });

    const result = await authorizeClinicalAuthor(user, rolePermission.permission.key, department.code);
    expect(result).toEqual({ authedUser: user, requiresCoSign: false });
  });

  it("lets a STUDENT with an active placement in the matching department author, flagged for co-sign", async () => {
    const department = await makeDepartment();
    const student = await makeUser(studentRole);
    await makePlacement({ studentId: student.id, departmentId: department.id, status: "ACTIVE" });

    const result = await authorizeClinicalAuthor(student, "rehab:manage", department.code);
    expect(result).toEqual({ authedUser: student, requiresCoSign: true });
  });

  it("throws for a STUDENT whose active placement is in a different department", async () => {
    const deptA = await makeDepartment();
    const deptB = await makeDepartment();
    const student = await makeUser(studentRole);
    await makePlacement({ studentId: student.id, departmentId: deptB.id, status: "ACTIVE" });

    await expect(authorizeClinicalAuthor(student, "rehab:manage", deptA.code)).rejects.toThrow(AuthorizationError);
  });

  it("throws for a STUDENT with no placement at all", async () => {
    const department = await makeDepartment();
    const student = await makeUser(studentRole);

    await expect(authorizeClinicalAuthor(student, "rehab:manage", department.code)).rejects.toThrow(AuthorizationError);
  });

  it("throws for a STUDENT whose placement's date window has already ended", async () => {
    // Proves the real end-to-end wiring (authorizeClinicalAuthor ->
    // getActivePlacementDepartment -> a live DB query -> the date-window
    // logic covered in isolation by placement.test.ts) actually connects,
    // not just that each piece works alone.
    const department = await makeDepartment();
    const student = await makeUser(studentRole);
    const now = new Date();
    await makePlacement({
      studentId: student.id,
      departmentId: department.id,
      status: "EXPIRED",
      startDate: new Date(now.getTime() - 30 * DAY_MS),
      endDate: new Date(now.getTime() - 2 * DAY_MS),
    });

    await expect(authorizeClinicalAuthor(student, "rehab:manage", department.code)).rejects.toThrow(AuthorizationError);
  });

  it("throws for a STUDENT whose otherwise-current placement is SUSPENDED", async () => {
    const department = await makeDepartment();
    const student = await makeUser(studentRole);
    await makePlacement({ studentId: student.id, departmentId: department.id, status: "SUSPENDED" });

    await expect(authorizeClinicalAuthor(student, "rehab:manage", department.code)).rejects.toThrow(AuthorizationError);
  });

  it("throws for a non-student who holds no relevant permission", async () => {
    const department = await makeDepartment();
    const role = await makeRole([]);
    const user = await makeUser(role, department.id);

    await expect(authorizeClinicalAuthor(user, "rehab:manage", department.code)).rejects.toThrow(AuthorizationError);
  });

  it("canAuthorClinicalRecord returns false instead of throwing for the same failing case", async () => {
    const department = await makeDepartment();
    const role = await makeRole([]);
    const user = await makeUser(role, department.id);

    expect(await canAuthorClinicalRecord(user, "rehab:manage", department.code)).toBe(false);
  });
});
