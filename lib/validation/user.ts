import { z } from "zod";

export const createUserSchema = z.object({
  email: z.string().trim().toLowerCase().email("Enter a valid email address"),
  fullName: z.string().trim().min(1, "Full name is required"),
  password: z.string().min(8, "Password must be at least 8 characters"),
  roleId: z.string().trim().min(1, "Role is required"),
  departmentId: z
    .string()
    .trim()
    .nullish()
    .transform((v) => (v && v !== "" ? v : undefined)),
});

export type CreateUserInput = z.infer<typeof createUserSchema>;
