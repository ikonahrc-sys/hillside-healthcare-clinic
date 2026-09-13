"use server";

import { revalidatePath } from "next/cache";
import { addCommentSchema } from "@/lib/validation/record-comment";
import { addComment, type CommentableEntityType } from "@/lib/services/record-comment-service";
import { getCurrentUser } from "@/lib/auth/session";

export type AddCommentState = { error: string } | null;

export async function addCommentAction(
  entityType: CommentableEntityType,
  entityId: string,
  revalidatePathTarget: string,
  _prevState: AddCommentState,
  formData: FormData,
): Promise<AddCommentState> {
  const parsed = addCommentSchema.safeParse({ content: formData.get("content") });

  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Invalid input." };
  }

  const user = await getCurrentUser();

  try {
    await addComment(user, entityType, entityId, parsed.data.content);
  } catch (e) {
    if (e instanceof Error) {
      return { error: e.message };
    }
    throw e;
  }

  revalidatePath(revalidatePathTarget);
  return null;
}
