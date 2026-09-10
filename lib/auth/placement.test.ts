import { describe, it, expect } from "vitest";
import { hasActivePlacement, getActivePlacement } from "@/lib/auth/placement";
import type { ClinicalPlacement, PlacementStatus } from "@/app/generated/prisma/client";

const DAY_MS = 1000 * 60 * 60 * 24;

function makePlacement(overrides: {
  status: PlacementStatus;
  startDate: Date;
  endDate: Date;
  id?: string;
}): ClinicalPlacement {
  return {
    id: overrides.id ?? "placement-1",
    clinicalArea: null,
    studentId: "student-1",
    departmentId: "dept-1",
    supervisorId: null,
    startDate: overrides.startDate,
    endDate: overrides.endDate,
    status: overrides.status,
    createdAt: new Date(),
    updatedAt: new Date(),
  };
}

describe("hasActivePlacement", () => {
  const now = new Date();
  const yesterday = new Date(now.getTime() - DAY_MS);
  const tomorrow = new Date(now.getTime() + DAY_MS);
  const lastWeek = new Date(now.getTime() - 7 * DAY_MS);
  const nextWeek = new Date(now.getTime() + 7 * DAY_MS);

  it("is true for status ACTIVE when today falls within the date range", () => {
    const placement = makePlacement({ status: "ACTIVE", startDate: lastWeek, endDate: nextWeek });
    expect(hasActivePlacement([placement])).toBe(true);
  });

  // Regression test for the bug found and fixed in Phase 6 step 1: this
  // function used to also require status === "ACTIVE", which permanently
  // locked out a student whose placement was created ahead of their start
  // date - there is no background job anywhere in this project that ever
  // transitions UPCOMING -> ACTIVE, so that student would never get in.
  it("is true for status UPCOMING when today still falls within the date range", () => {
    const placement = makePlacement({ status: "UPCOMING", startDate: lastWeek, endDate: nextWeek });
    expect(hasActivePlacement([placement])).toBe(true);
  });

  it("is true for status EXTENDED when today falls within the date range", () => {
    const placement = makePlacement({ status: "EXTENDED", startDate: lastWeek, endDate: nextWeek });
    expect(hasActivePlacement([placement])).toBe(true);
  });

  it("is true for status EXPIRED when today still falls within the date range", () => {
    // Same reasoning as UPCOMING: nothing keeps this label in sync with
    // the dates, so an appropriately-dated placement must still grant
    // access regardless of what its display status says.
    const placement = makePlacement({ status: "EXPIRED", startDate: lastWeek, endDate: nextWeek });
    expect(hasActivePlacement([placement])).toBe(true);
  });

  it("is false for status SUSPENDED even when today falls within the date range", () => {
    // SUSPENDED is the one deliberate override - an explicit admin
    // action, not a timing state that can drift.
    const placement = makePlacement({ status: "SUSPENDED", startDate: lastWeek, endDate: nextWeek });
    expect(hasActivePlacement([placement])).toBe(false);
  });

  it("is false when today is before the start date", () => {
    const placement = makePlacement({ status: "ACTIVE", startDate: tomorrow, endDate: nextWeek });
    expect(hasActivePlacement([placement])).toBe(false);
  });

  it("is false when today is after the end date", () => {
    const placement = makePlacement({ status: "ACTIVE", startDate: lastWeek, endDate: yesterday });
    expect(hasActivePlacement([placement])).toBe(false);
  });

  it("is false for an empty placement list", () => {
    expect(hasActivePlacement([])).toBe(false);
  });

  it("is true if any one of several placements is currently active", () => {
    const expired = makePlacement({ id: "p1", status: "ACTIVE", startDate: lastWeek, endDate: yesterday });
    const active = makePlacement({ id: "p2", status: "ACTIVE", startDate: lastWeek, endDate: nextWeek });
    expect(hasActivePlacement([expired, active])).toBe(true);
  });
});

describe("getActivePlacement", () => {
  const now = new Date();
  const lastWeek = new Date(now.getTime() - 7 * DAY_MS);
  const nextWeek = new Date(now.getTime() + 7 * DAY_MS);
  const yesterday = new Date(now.getTime() - DAY_MS);

  it("returns the matching placement object, not just a boolean", () => {
    const placement = makePlacement({ id: "p1", status: "ACTIVE", startDate: lastWeek, endDate: nextWeek });
    expect(getActivePlacement([placement])?.id).toBe("p1");
  });

  it("returns undefined when no placement is currently active", () => {
    const expired = makePlacement({ status: "ACTIVE", startDate: lastWeek, endDate: yesterday });
    const suspended = makePlacement({ status: "SUSPENDED", startDate: lastWeek, endDate: nextWeek });
    expect(getActivePlacement([expired, suspended])).toBeUndefined();
  });
});
