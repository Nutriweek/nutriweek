export type ShoppingQuantity = { quantity: number; unit: string };

function roundUp(quantity: number, options: number[]) {
  return options.find((option) => quantity <= option) ?? Math.ceil(quantity / 250) * 250;
}

/** Rounds only the consumer-facing grocery quantity; recipe and plan math stays exact. */
export function roundShoppingQuantity(quantity: number, unit: string): ShoppingQuantity {
  const normalizedUnit = unit.trim().toLowerCase();
  if (normalizedUnit === "g" || normalizedUnit === "gram" || normalizedUnit === "grams") {
    const grams = roundUp(quantity, [250, 500, 750, 1000, 1250, 1500, 2000]);
    return grams >= 1000 ? { quantity: grams / 1000, unit: "kg" } : { quantity: grams, unit: "g" };
  }
  if (normalizedUnit === "ml" || normalizedUnit === "millilitre" || normalizedUnit === "milliliter") {
    const millilitres = roundUp(quantity, [500, 1000, 1500, 2000]);
    return millilitres >= 1000 ? { quantity: millilitres / 1000, unit: "L" } : { quantity: millilitres, unit: "ml" };
  }
  if (["count", "pc", "pcs", "piece", "pieces", "unit"].includes(normalizedUnit)) {
    return { quantity: Math.ceil(quantity / 6) * 6, unit: "pcs" };
  }
  return { quantity, unit };
}

export function toBaseShoppingQuantity(quantity: number, displayUnit: string, baseUnit: string) {
  const display = displayUnit.trim().toLowerCase();
  const base = baseUnit.trim().toLowerCase();
  if (display === "kg" && base === "g") return quantity * 1000;
  if (display === "l" && base === "ml") return quantity * 1000;
  return quantity;
}

export function displayShoppingQuantity(quantity: number, unit: string): ShoppingQuantity {
  const normalizedUnit = unit.trim().toLowerCase();
  if (normalizedUnit === "g" && quantity >= 1000) return { quantity: quantity / 1000, unit: "kg" };
  if (normalizedUnit === "ml" && quantity >= 1000) return { quantity: quantity / 1000, unit: "L" };
  if (["count", "pc", "pcs", "piece", "pieces", "unit"].includes(normalizedUnit)) return { quantity, unit: "pcs" };
  return { quantity, unit };
}
