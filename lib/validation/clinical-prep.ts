import { z } from "zod";

export const clinicalPreparationNoteSchema = z.object({
  content: z.string().trim().min(1, "Note content is required"),
});

export type ClinicalPreparationNoteInput = z.infer<typeof clinicalPreparationNoteSchema>;
