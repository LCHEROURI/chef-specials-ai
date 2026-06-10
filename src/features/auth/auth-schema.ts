import { z } from "zod";

export const authSchema = z.object({
  email: z.email("Enter a valid email address."),
  password: z
    .string()
    .min(8, "Password must be at least 8 characters.")
    .max(72, "Password must be 72 characters or fewer.")
});

export type AuthFormValues = z.infer<typeof authSchema>;
