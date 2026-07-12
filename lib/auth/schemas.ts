import { z } from "zod";

import { AUTH_CONSTANTS } from "./constants";

const emailSchema = z
  .string()
  .trim()
  .min(1, "Email is required.")
  .email("Enter a valid email address.");

const passwordSchema = z
  .string()
  .min(1, "Password is required.")
  .min(
    AUTH_CONSTANTS.minimumPasswordLength,
    `Password must be at least ${AUTH_CONSTANTS.minimumPasswordLength} characters.`,
  );

export const loginSchema = z.object({ email: emailSchema, password: passwordSchema });

export const signupSchema = z
  .object({
    email: emailSchema,
    password: passwordSchema,
    confirmPassword: z.string().min(1, "Please confirm your password."),
  })
  .refine(({ password, confirmPassword }) => password === confirmPassword, {
    message: "Passwords do not match.",
    path: ["confirmPassword"],
  });

export type LoginInput = z.infer<typeof loginSchema>;
export type SignupInput = z.infer<typeof signupSchema>;
