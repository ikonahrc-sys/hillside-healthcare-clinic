"use server";

import { redirect } from "next/navigation";
import { receiveStockSchema } from "@/lib/validation/inventory";
import { receiveStock } from "@/lib/services/inventory-service";
import { getCurrentUser } from "@/lib/auth/session";
import { AuthorizationError } from "@/lib/auth/authorize";

export type ReceiveStockState = { error: string } | null;

export async function receiveStockAction(
  _prevState: ReceiveStockState,
  formData: FormData,
): Promise<ReceiveStockState> {
  const parsed = receiveStockSchema.safeParse({
    medicineId: formData.get("medicineId"),
    batchNumber: formData.get("batchNumber"),
    quantity: formData.get("quantity"),
    expiryDate: formData.get("expiryDate"),
  });

  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Invalid input." };
  }

  const user = await getCurrentUser();

  try {
    await receiveStock(user, parsed.data);
  } catch (e) {
    if (e instanceof AuthorizationError) {
      return { error: "You are not authorized to receive stock." };
    }
    if (e instanceof Error) {
      return { error: e.message };
    }
    throw e;
  }

  redirect("/pharmacy/inventory");
}
