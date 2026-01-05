import Dexie, { type Table } from "dexie";

// --- INTERFACES ---

export interface UserProfile {
  id?: number;
  tdee: number;
  targetCalories: number;
  targetProtein: number;
  goal: 'lose' | 'maintain' | 'gain';
}

export interface Ingredient {
  id?: number;
  name: string;
  calories: number; 
  protein: number;
  carbs: number;
  fat: number;
  category: string;
  measure: 'g' | 'unit' | 'ml';
  unitWeight?: number; 
}

export interface FridgeItem {
  id?: number;
  name: string;
  calories: number; 
  protein: number; 
  carbs: number;
  fat: number;
  totalWeight: number;
  currentWeight: number;
  createdAt: Date;
  measure: 'g' | 'ml'; 
}

export interface SavedRecipe {
  id?: number;
  name: string;
  ingredients: any[]; 
  defaultCookedWeight?: number; 
}

export interface DailyLog {
  id?: number;
  date: string; 
  name: string;
  amountConsumed: number;
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
  timestamp: Date;
  fridgeItemId?: number; 
}

// --- DATABASE ---

class MacroPrepDB extends Dexie {
  user!: Table<UserProfile>;
  ingredients!: Table<Ingredient>;
  fridge!: Table<FridgeItem>; 
  recipes!: Table<SavedRecipe>; 
  logs!: Table<DailyLog>;

  constructor() {
    super("MacroPrepDB");
    this.version(9).stores({
      user: "++id",
      ingredients: "++id, name, category",
      fridge: "++id, name", 
      recipes: "++id, name", 
      logs: "++id, date, fridgeItemId" 
    });
  }
}

export const db = new MacroPrepDB();

// --- EXPANDED MASTER LIST ---
// This list contains the "Factory Default" items.
const MASTER_INGREDIENTS: Omit<Ingredient, 'id'>[] = [
  // --- PROTEIN SOURCES ---
  { name: 'Chicken Breast (Raw)', calories: 110, protein: 23, carbs: 0, fat: 1.2, category: 'protein', measure: 'g' },
  { name: 'Chicken Thigh (Raw)', calories: 177, protein: 20, carbs: 0, fat: 10, category: 'protein', measure: 'g' },
  { name: 'Ground Beef (90/10)', calories: 217, protein: 26, carbs: 0, fat: 12, category: 'protein', measure: 'g' },
  { name: 'Ground Beef (80/20)', calories: 254, protein: 17, carbs: 0, fat: 20, category: 'protein', measure: 'g' },
  { name: 'Steak (Sirloin)', calories: 244, protein: 27, carbs: 0, fat: 14, category: 'protein', measure: 'g' },
  { name: 'Salmon (Raw)', calories: 208, protein: 20, carbs: 0, fat: 13, category: 'protein', measure: 'g' },
  { name: 'White Fish (Cod/Tilapia)', calories: 82, protein: 18, carbs: 0, fat: 0.7, category: 'protein', measure: 'g' },
  { name: 'Tuna (Canned in Water)', calories: 116, protein: 26, carbs: 0, fat: 1, category: 'protein', measure: 'g' },
  { name: 'Shrimp (Raw)', calories: 99, protein: 24, carbs: 0.2, fat: 0.3, category: 'protein', measure: 'g' },
  { name: 'Pork Chop (Lean)', calories: 143, protein: 26, carbs: 0, fat: 3.5, category: 'protein', measure: 'g' },
  { name: 'Turkey Breast', calories: 135, protein: 30, carbs: 0, fat: 1, category: 'protein', measure: 'g' },
  
  // Vegetarian Protein
  { name: 'Egg (Large)', calories: 72, protein: 6.3, carbs: 0.4, fat: 5, category: 'protein', measure: 'unit', unitWeight: 50 },
  { name: 'Egg White', calories: 17, protein: 3.6, carbs: 0.2, fat: 0, category: 'protein', measure: 'unit', unitWeight: 33 },
  { name: 'Tofu (Firm)', calories: 144, protein: 17, carbs: 3, fat: 9, category: 'protein', measure: 'g' },
  { name: 'Tempeh', calories: 192, protein: 20, carbs: 7.6, fat: 11, category: 'protein', measure: 'g' },
  { name: 'Lentils (Dry)', calories: 352, protein: 25, carbs: 63, fat: 1, category: 'protein', measure: 'g' },
  { name: 'Chickpeas (Canned)', calories: 139, protein: 7, carbs: 23, fat: 2, category: 'protein', measure: 'g' },

  // --- SUPPLEMENTS & POWDERS ---
  { name: 'Whey Protein (Standard)', calories: 390, protein: 78, carbs: 6, fat: 6, category: 'protein', measure: 'g' },
  { name: 'Whey Isolate', calories: 370, protein: 90, carbs: 1, fat: 1, category: 'protein', measure: 'g' },
  { name: 'Casein Protein', calories: 360, protein: 75, carbs: 4, fat: 2, category: 'protein', measure: 'g' },
  { name: 'Pea Protein (Vegan)', calories: 380, protein: 75, carbs: 3, fat: 6, category: 'protein', measure: 'g' },
  { name: 'Creatine Monohydrate', calories: 0, protein: 0, carbs: 0, fat: 0, category: 'other', measure: 'g' },

  // --- NUTS & DRY FRUITS ---
  { name: 'Almonds (Raw)', calories: 579, protein: 21, carbs: 22, fat: 50, category: 'fat', measure: 'g' },
  { name: 'Walnuts', calories: 654, protein: 15, carbs: 14, fat: 65, category: 'fat', measure: 'g' },
  { name: 'Pistachios', calories: 560, protein: 20, carbs: 28, fat: 45, category: 'fat', measure: 'g' },
  { name: 'Cashews', calories: 553, protein: 18, carbs: 30, fat: 44, category: 'fat', measure: 'g' },
  { name: 'Peanuts', calories: 567, protein: 26, carbs: 16, fat: 49, category: 'fat', measure: 'g' },
  { name: 'Pumpkin Seeds', calories: 559, protein: 30, carbs: 10, fat: 49, category: 'fat', measure: 'g' },
  { name: 'Chia Seeds', calories: 486, protein: 17, carbs: 42, fat: 31, category: 'fat', measure: 'g' },
  { name: 'Dates (Medjool)', calories: 277, protein: 1.8, carbs: 75, fat: 0.2, category: 'carb', measure: 'unit', unitWeight: 24 },
  { name: 'Raisins', calories: 299, protein: 3, carbs: 79, fat: 0.5, category: 'carb', measure: 'g' },

  // --- CARB SOURCES ---
  { name: 'White Rice (Raw)', calories: 365, protein: 7, carbs: 80, fat: 0.7, category: 'carb', measure: 'g' },
  { name: 'Brown Rice (Raw)', calories: 367, protein: 7.5, carbs: 76, fat: 3.2, category: 'carb', measure: 'g' },
  { name: 'Basmati Rice (Raw)', calories: 350, protein: 9, carbs: 78, fat: 0.5, category: 'carb', measure: 'g' },
  { name: 'Oats (Rolled)', calories: 379, protein: 13, carbs: 68, fat: 6.5, category: 'carb', measure: 'g' },
  { name: 'Pasta (Semolina)', calories: 371, protein: 13, carbs: 75, fat: 1.5, category: 'carb', measure: 'g' },
  { name: 'Quinoa (Raw)', calories: 368, protein: 14, carbs: 64, fat: 6, category: 'carb', measure: 'g' },
  { name: 'Potato (White, Raw)', calories: 77, protein: 2, carbs: 17, fat: 0.1, category: 'carb', measure: 'g' },
  { name: 'Sweet Potato (Raw)', calories: 86, protein: 1.6, carbs: 20, fat: 0.1, category: 'carb', measure: 'g' },
  
  // Breads & Wraps (Units)
  { name: 'Slice of Bread (White)', calories: 79, protein: 2.7, carbs: 15, fat: 1, category: 'carb', measure: 'unit', unitWeight: 30 },
  { name: 'Slice of Bread (Whole Wheat)', calories: 81, protein: 4, carbs: 14, fat: 1, category: 'carb', measure: 'unit', unitWeight: 33 },
  { name: 'Tortilla (Flour, Medium)', calories: 140, protein: 4, carbs: 24, fat: 3.5, category: 'carb', measure: 'unit', unitWeight: 45 },
  { name: 'Bagel (Plain)', calories: 250, protein: 10, carbs: 49, fat: 1.5, category: 'carb', measure: 'unit', unitWeight: 95 },

  // --- FATS & OILS ---
  { name: 'Olive Oil', calories: 884, protein: 0, carbs: 0, fat: 100, category: 'fat', measure: 'ml' },
  { name: 'Coconut Oil', calories: 862, protein: 0, carbs: 0, fat: 100, category: 'fat', measure: 'g' },
  { name: 'Butter', calories: 717, protein: 0.9, carbs: 0.1, fat: 81, category: 'fat', measure: 'g' },
  { name: 'Avocado', calories: 160, protein: 2, carbs: 8.5, fat: 15, category: 'fat', measure: 'g' },
  { name: 'Peanut Butter', calories: 588, protein: 25, carbs: 20, fat: 50, category: 'fat', measure: 'g' },

  // --- DAIRY & LIQUIDS ---
  { name: 'Whole Milk', calories: 61, protein: 3.2, carbs: 4.8, fat: 3.3, category: 'other', measure: 'ml' },
  { name: 'Skim Milk (0%)', calories: 34, protein: 3.4, carbs: 5, fat: 0.1, category: 'other', measure: 'ml' },
  { name: 'Almond Milk (Unsweetened)', calories: 13, protein: 0.4, carbs: 0.1, fat: 1.1, category: 'other', measure: 'ml' },
  { name: 'Oat Milk', calories: 45, protein: 0.8, carbs: 8, fat: 1.5, category: 'other', measure: 'ml' },
  { name: 'Greek Yogurt (0% Fat)', calories: 59, protein: 10, carbs: 3.6, fat: 0.4, category: 'protein', measure: 'g' },
  { name: 'Cheddar Cheese', calories: 402, protein: 25, carbs: 1.3, fat: 33, category: 'fat', measure: 'g' },
  { name: 'Mozzarella (Low Moisture)', calories: 300, protein: 22, carbs: 2, fat: 22, category: 'fat', measure: 'g' },
  { name: 'Cottage Cheese (Low Fat)', calories: 72, protein: 12, carbs: 3, fat: 1, category: 'protein', measure: 'g' },
  
  // --- FRUITS ---
  { name: 'Banana (Medium)', calories: 105, protein: 1.3, carbs: 27, fat: 0.4, category: 'carb', measure: 'unit', unitWeight: 118 },
  { name: 'Apple (Medium)', calories: 95, protein: 0.5, carbs: 25, fat: 0.3, category: 'carb', measure: 'unit', unitWeight: 182 },
  { name: 'Orange', calories: 62, protein: 1.2, carbs: 15, fat: 0.2, category: 'carb', measure: 'unit', unitWeight: 130 },
  { name: 'Blueberries', calories: 57, protein: 0.7, carbs: 14, fat: 0.3, category: 'carb', measure: 'g' },
  { name: 'Strawberries', calories: 32, protein: 0.7, carbs: 7.7, fat: 0.3, category: 'carb', measure: 'g' },

  // --- VEGETABLES ---
  { name: 'Broccoli', calories: 34, protein: 2.8, carbs: 7, fat: 0.4, category: 'veg', measure: 'g' },
  { name: 'Spinach (Raw)', calories: 23, protein: 2.9, carbs: 3.6, fat: 0.4, category: 'veg', measure: 'g' },
  { name: 'Carrots', calories: 41, protein: 0.9, carbs: 10, fat: 0.2, category: 'veg', measure: 'g' },
  { name: 'Onion', calories: 40, protein: 1.1, carbs: 9, fat: 0.1, category: 'veg', measure: 'g' },
  { name: 'Red Bell Pepper', calories: 31, protein: 1, carbs: 6, fat: 0.3, category: 'veg', measure: 'g' },
  { name: 'Tomato', calories: 18, protein: 0.9, carbs: 3.9, fat: 0.2, category: 'veg', measure: 'g' },
  { name: 'Cucumber', calories: 15, protein: 0.7, carbs: 3.6, fat: 0.1, category: 'veg', measure: 'g' },
  { name: 'Green Beans', calories: 31, protein: 1.8, carbs: 7, fat: 0.2, category: 'veg', measure: 'g' },
  { name: 'Mushrooms', calories: 22, protein: 3.1, carbs: 3.3, fat: 0.3, category: 'veg', measure: 'g' },
  
  // --- PANTRY / CONDIMENTS ---
  { name: 'Honey', calories: 304, protein: 0.3, carbs: 82, fat: 0, category: 'carb', measure: 'g' },
  { name: 'Maple Syrup', calories: 260, protein: 0, carbs: 67, fat: 0, category: 'carb', measure: 'ml' },
  { name: 'Soy Sauce', calories: 53, protein: 8, carbs: 5, fat: 0, category: 'other', measure: 'ml' },
  { name: 'Mayonnaise', calories: 680, protein: 1, carbs: 1, fat: 75, category: 'fat', measure: 'g' },
  { name: 'Ketchup', calories: 111, protein: 1, carbs: 26, fat: 0, category: 'carb', measure: 'g' },
];

// --- SMART SEEDER ---

export async function seedDatabase() {
  const count = await db.ingredients.count();
  
  if (count === 0) {
    // FRESH INSTALL: Add everything
    console.log("Seeding Database for the first time...");
    await db.ingredients.bulkAdd(MASTER_INGREDIENTS);
  } else {
    // SMART SYNC: Check what's missing and add it
    // 1. Get list of current ingredient names
    const existingItems = await db.ingredients.toArray();
    const existingNames = new Set(existingItems.map(i => i.name));
    
    // 2. Filter master list for items that don't exist yet
    const newItems = MASTER_INGREDIENTS.filter(i => !existingNames.has(i.name));
    
    // 3. Add only the new items
    if (newItems.length > 0) {
      console.log(`Smart Sync: Found ${newItems.length} new items. Adding them...`);
      await db.ingredients.bulkAdd(newItems);
    }
  }
}