export type AuthActionResult =
  | { success: true; message: string; requiresEmailConfirmation?: boolean }
  | { success: false; message: string };
