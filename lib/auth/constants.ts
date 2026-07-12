export const AUTH_MESSAGES = {
  loginSuccess: "You are signed in successfully.",
  signupSuccess: "Your account has been created successfully.",
  signupConfirmationRequired:
    "If your account was created, we've sent a confirmation email. If you already have an account, please sign in or use 'Forgot Password' once it's available.",
  invalidCredentials: "Invalid email or password.",
  emailNotConfirmed: "Please confirm your email address before signing in.",
  accountExists: "An account with this email address already exists.",
  logoutSuccess: "You have been signed out successfully.",
  logoutError: "We couldn't sign you out. Please try again.",
  unexpectedError: "Something went wrong. Please try again.",
} as const;

export const AUTH_CONSTANTS = {
  minimumPasswordLength: 8,
} as const;
