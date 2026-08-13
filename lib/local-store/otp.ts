import "server-only";

import { createHmac } from "node:crypto";

export function hashDeliveryOtp(otp: string) {
  const secret = process.env.DELIVERY_OTP_SECRET;
  if (!secret) throw new Error("DELIVERY_OTP_SECRET is required for delivery confirmation.");
  return createHmac("sha256", secret).update(otp).digest("hex");
}
