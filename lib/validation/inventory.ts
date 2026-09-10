import { z } from "zod";

export const receiveStockSchema = z.object({
  medicineId: z.string().trim().min(1, "Select a medicine"),
  batchNumber: z.string().trim().min(1, "Batch number is required"),
  quantity: z.coerce.number().int().positive("Quantity must be a positive number"),
  // Date-only strings ("YYYY-MM-DD") are UTC midnight per the ECMAScript
  // spec regardless of system timezone - unlike datetime-local strings,
  // this one is safe with z.coerce.date() directly.
  expiryDate: z.coerce.date().refine((d) => d.getTime() > Date.now(), {
    message: "Expiry date must be in the future",
  }),
});

export type ReceiveStockInput = z.infer<typeof receiveStockSchema>;
