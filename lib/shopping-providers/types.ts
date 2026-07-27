export type ShoppingProviderId = string;
export type ShoppingProviderStatus = "active" | "coming_soon";
export type ShoppingProviderType = "local_store" | "quick_commerce" | "online_grocery";

export type ShoppingProvider = {
  id: ShoppingProviderId;
  name: string;
  provider_type: ShoppingProviderType;
  status: ShoppingProviderStatus;
  sort_order: number;
  icon: string | null;
};

export type ShoppingProviderActionResult = { success: boolean; message: string };
