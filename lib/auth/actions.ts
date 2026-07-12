import { createClient } from "@/lib/supabase/client";

import { AUTH_MESSAGES } from "./constants";
import type { LoginInput, SignupInput } from "./schemas";
import type { AuthActionResult } from "./types";

function getAuthErrorMessage(message: string) {
  const normalizedMessage = message.toLowerCase();

  if (normalizedMessage.includes("invalid login credentials")) {
    return AUTH_MESSAGES.invalidCredentials;
  }

  if (normalizedMessage.includes("email not confirmed")) {
    return AUTH_MESSAGES.emailNotConfirmed;
  }

  if (normalizedMessage.includes("user already registered")) {
    return AUTH_MESSAGES.accountExists;
  }

  if (normalizedMessage.includes("email rate limit exceeded")) {
    return "Too many signup attempts. Please wait a few minutes before trying again.";
  }

  return AUTH_MESSAGES.unexpectedError;
}

export async function login(input: LoginInput): Promise<AuthActionResult> {
  try {
    const { error } = await createClient().auth.signInWithPassword(input);

    return error
      ? { success: false, message: getAuthErrorMessage(error.message) }
      : { success: true, message: AUTH_MESSAGES.loginSuccess };
  } catch {
    return { success: false, message: AUTH_MESSAGES.unexpectedError };
  }
}

export async function signup(input: SignupInput): Promise<AuthActionResult> {
  try {
    const response = await createClient().auth.signUp({
      email: input.email,
      password: input.password,
    });
    const { data, error } = response;

    if (error) {
      return { success: false, message: getAuthErrorMessage(error.message) };
    }

    const requiresEmailConfirmation = data.session === null;

    return {
      success: true,
      message: requiresEmailConfirmation
        ? AUTH_MESSAGES.signupConfirmationRequired
        : AUTH_MESSAGES.signupSuccess,
      requiresEmailConfirmation,
    };
  } catch {
    return { success: false, message: AUTH_MESSAGES.unexpectedError };
  }
}
