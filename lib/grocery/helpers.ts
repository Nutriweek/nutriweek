export type BasketSnapshotItem = {
  id: string;
  name: string;
  quantity: number;
  manualAdjustmentQuantity: number;
  baseUnit: string;
  selectedForPurchase: boolean;
  purchased: boolean;
};

export function parseBasketSnapshot(value: unknown): BasketSnapshotItem[] {
  if (!Array.isArray(value)) return [];
  return value.flatMap((item) => {
    if (!item || typeof item !== "object") return [];
    const snapshot = item as Record<string, unknown>;
    return typeof snapshot.id === "string" && typeof snapshot.name === "string" && typeof snapshot.quantity === "number" && typeof snapshot.manualAdjustmentQuantity === "number" && typeof snapshot.baseUnit === "string" && typeof snapshot.purchased === "boolean"
      ? [{ id: snapshot.id, name: snapshot.name, quantity: snapshot.quantity, manualAdjustmentQuantity: snapshot.manualAdjustmentQuantity, baseUnit: snapshot.baseUnit, selectedForPurchase: typeof snapshot.selectedForPurchase === "boolean" ? snapshot.selectedForPurchase : snapshot.purchased, purchased: snapshot.purchased }]
      : [];
  });
}
