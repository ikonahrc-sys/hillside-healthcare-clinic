import { z } from "zod";

export const patientInputSchema = z.object({
  firstName: z.string().trim().min(1, "First name is required"),
  lastName: z.string().trim().min(1, "Last name is required"),
  dateOfBirth: z.coerce.date().refine((d) => d <= new Date(), {
    message: "Date of birth cannot be in the future",
  }),
  sex: z.enum(["MALE", "FEMALE", "OTHER"]),
  address: z.string().trim().optional().or(z.literal("")),
  phone: z.string().trim().optional().or(z.literal("")),
  email: z.string().trim().email().optional().or(z.literal("")),
  emergencyContactName: z.string().trim().optional().or(z.literal("")),
  emergencyContactPhone: z.string().trim().optional().or(z.literal("")),
  allergies: z.string().trim().optional().or(z.literal("")),
  medicalHistoryNotes: z.string().trim().optional().or(z.literal("")),
});

export type PatientInput = z.infer<typeof patientInputSchema>;
