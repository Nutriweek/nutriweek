import type { ShoppingProviderStatus } from "./types";

export const SHOPPING_PROVIDER_STATUS = {
  ACTIVE: "active",
  COMING_SOON: "coming_soon",
} as const satisfies Record<string, ShoppingProviderStatus>;
