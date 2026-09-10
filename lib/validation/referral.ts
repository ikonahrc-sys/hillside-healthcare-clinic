import { z } from "zod";

export const referralInputSchema = z.object({
  toDepartmentId: z.string().trim().min(1, "Select a department"),
  reason: z.string().trim().min(1, "Reason is required"),
});

export type ReferralInput = z.infer<typeof referralInputSchema>;

export const referralResponseSchema = z.object({
  decision: z.enum(["ACCEPTED", "DECLINED"]),
  // .nullish() (not just .optional()) - formData.get() returns null, not
  // undefined, for a field with no matching <input> at all. This form has
  // no responseNotes input yet, so that's the value that actually arrives.
  responseNotes: z
    .string()
    .trim()
    .nullish()
    .transform((v) => (v && v !== "" ? v : undefined)),
});

export type ReferralResponseInput = z.infer<typeof referralResponseSchema>;
