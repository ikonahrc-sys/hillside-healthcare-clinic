import { z } from "zod";

// Dynamic repeating rows (one per medicine) don't map cleanly onto plain
// FormData field names, so the client encodes them as a JSON string in a
// single hidden input and this schema decodes + validates that string.
const prescriptionItemSchema = z.object({
  medicineId: z.string().trim().min(1, "Select a medicine"),
  dosageInstructions: z.string().trim().min(1, "Dosage instructions are required"),
  quantity: z.coerce.number().int().positive("Quantity must be a positive number"),
});

export const prescriptionInputSchema = z.object({
  notes: z
    .string()
    .trim()
    .nullish()
    .transform((v) => (v && v !== "" ? v : undefined)),
  itemsJson: z
    .string()
    .transform((raw, ctx) => {
      try {
        return JSON.parse(raw);
      } catch {
        ctx.addIssue({ code: "custom", message: "Invalid items payload" });
        return z.NEVER;
      }
    })
    .pipe(z.array(prescriptionItemSchema).min(1, "Add at least one medicine")),
});

export type PrescriptionInput = z.infer<typeof prescriptionInputSchema>;
export type PrescriptionItemInput = z.infer<typeof prescriptionItemSchema>;
