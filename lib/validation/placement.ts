import { z } from "zod";

export const createPlacementSchema = z
  .object({
    studentId: z.string().trim().min(1, "Student is required"),
    departmentId: z.string().trim().min(1, "Department is required"),
    supervisorId: z
      .string()
      .trim()
      .nullish()
      .transform((v) => (v && v !== "" ? v : undefined)),
    startDate: z.coerce.date({ message: "Start date is required" }),
    endDate: z.coerce.date({ message: "End date is required" }),
    clinicalArea: z
      .string()
      .trim()
      .nullish()
      .transform((v) => (v && v !== "" ? v : undefined)),
  })
  .refine((data) => data.endDate > data.startDate, {
    message: "End date must be after the start date",
    path: ["endDate"],
  });

export type CreatePlacementInput = z.infer<typeof createPlacementSchema>;

export const reassignPlacementSchema = z.object({
  departmentId: z.string().trim().min(1, "Department is required"),
  supervisorId: z
    .string()
    .trim()
    .nullish()
    .transform((v) => (v && v !== "" ? v : null)),
});

export type ReassignPlacementInput = z.infer<typeof reassignPlacementSchema>;
