export type GroceryCategory = "Vegetables" | "Meat & Seafood" | "Dairy" | "Eggs" | "Rice & Grains" | "Pulses & Lentils" | "Nuts & Seeds" | "Spices & Seasonings" | "Pantry Staples" | "Fruits" | "Other";

export const groceryCategoryOrder: GroceryCategory[] = ["Vegetables", "Meat & Seafood", "Dairy", "Eggs", "Rice & Grains", "Pulses & Lentils", "Nuts & Seeds", "Spices & Seasonings", "Pantry Staples", "Fruits", "Other"];

const categoryMatchers: [GroceryCategory, RegExp][] = [
  ["Eggs", /\begg/], ["Dairy", /milk|paneer|cheese|yogurt|curd|butter|ghee/], ["Meat & Seafood", /chicken|mutton|beef|pork|fish|prawn|shrimp|seafood/],
  ["Rice & Grains", /rice|oat|poha|wheat|flour|atta|millet|quinoa|barley|corn|semolina|rava/], ["Pulses & Lentils", /dal|lentil|chana|chickpea|rajma|bean|moong|urad|toor|pea/],
  ["Nuts & Seeds", /almond|cashew|peanut|walnut|seed|pistachio/], ["Spices & Seasonings", /salt|pepper|masala|turmeric|chilli|cumin|coriander|mustard|spice/],
  ["Fruits", /apple|banana|mango|orange|grape|berry|papaya|fruit|lemon/], ["Vegetables", /onion|tomato|potato|carrot|spinach|cabbage|cauliflower|broccoli|cucumber|vegetable|capsicum|ginger|garlic/],
  ["Pantry Staples", /oil|sugar|honey|vinegar|sauce|paste|stock|bread/],
];

export function categorizeIngredient(name: string, ingredientCategory?: string | null): GroceryCategory {
  const source = `${ingredientCategory ?? ""} ${name}`.toLowerCase();
  return categoryMatchers.find(([, matcher]) => matcher.test(source))?.[0] ?? "Other";
}
