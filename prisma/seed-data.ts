// Sal's Italian Restaurant & Pizzeria — official menu seed data (Part 1: types + shared groups)
// Source: official menu PDFs linked from https://www.salsradford.com/menu/
// FOOD MENU PDF (8 pages) + BEVERAGE & DESSERT PDF (6 pages) — imported & verified 2026.

export interface SeedVariant {
  name: string
  price: number
  isDefault?: boolean
}

export interface SeedModifier {
  name: string
  price?: number
  tier?: Record<string, number>
}

export interface SeedGroup {
  key: string
  name: string
  minSelect: number
  maxSelect: number
  required: boolean
  includedCount?: number
  modifiers: SeedModifier[]
}

export interface SeedItem {
  name: string
  description?: string
  price?: number
  pricePending?: boolean
  variants?: SeedVariant[]
  groups?: string[]
  image?: string
  popular?: boolean
  alcohol?: boolean
  sizeTier?: boolean
}

export interface SeedCategory {
  slug: string
  name: string
  italianName?: string
  description?: string
  image?: string
  items: SeedItem[]
}

// Topping prices by pizza size tier (from official PIZZA SIZES table)
export const TIER_PIZZA = {
  SMALL: 1.95,
  MEDIUM: 2.25,
  LARGE: 2.5,
  SICILIAN: 3.0,
}

// Additional-topping prices for Create-Your-Own Calzone (Small +1.60 / Large +2.85)
export const TIER_CALZONE = {
  SMALL: 1.6,
  LARGE: 2.85,
}

export const PIZZA_TOPPINGS: SeedModifier[] = [
  'Anchovies',
  'Artichokes',
  'Banana Peppers',
  'Bacon',
  'Basil',
  'Black Olives',
  'Broccoli',
  'Canned Mushrooms',
  'Cherry Peppers',
  'Feta Cheese',
  'Fresh Mushrooms',
  'Fresh Tomatoes',
  'Garlic',
  'Green Olives',
  'Green Peppers',
  'Ham',
  'Hamburger',
  'Meatballs',
  'Onions',
  'Pepperoni',
  'Pineapple',
  'Roasted Red Peppers',
  'Salami',
  'Italian Sausage',
  'Spinach',
  'Sun-Dried Tomatoes',
].map((n) => ({ name: n, tier: TIER_PIZZA }))

// Shredded steak is a flat +3.00 per the official ingredients list
export const STEAK_TOPPING: SeedModifier = { name: 'Shredded Steak', price: 3.0 }

export const GROUPS: SeedGroup[] = [
  {
    key: 'salad-dressing',
    name: 'Choose Your Dressing',
    minSelect: 0,
    maxSelect: 1,
    required: false,
    modifiers: [
      'Italian',
      'Honey Mustard',
      'Ranch',
      'Bleu Cheese',
      'Balsamic Vinaigrette',
      'Thousand Island',
      'Caesar',
    ].map((n) => ({ name: n })),
  },
  {
    key: 'pasta-choice',
    name: 'Choose Your Pasta',
    minSelect: 1,
    maxSelect: 1,
    required: true,
    modifiers: [
      { name: 'Spaghetti' },
      { name: 'Penne' },
      { name: 'Fettuccine' },
      { name: 'Angel Hair' },
      { name: 'Linguini' },
      { name: 'Whole Wheat Penne' },
      { name: 'Gluten-Free Pasta', price: 3.0 },
    ],
  },
  {
    key: 'entree-extras',
    name: 'Entrée Extras',
    minSelect: 0,
    maxSelect: 2,
    required: false,
    modifiers: [{ name: 'Split Order', price: 3.95 }, { name: 'Extra Salad', price: 5.5 }],
  },
  {
    key: 'wings-flavor',
    name: 'Wing Flavor',
    minSelect: 1,
    maxSelect: 1,
    required: true,
    modifiers: [{ name: 'BBQ' }, { name: 'Spicy' }, { name: 'Jerk' }, { name: 'Teriyaki' }, { name: 'Plain' }],
  },
  {
    key: 'wings-style',
    name: 'Wing Style',
    minSelect: 1,
    maxSelect: 1,
    required: true,
    modifiers: [{ name: 'With Bone' }, { name: 'Boneless' }],
  },
  {
    key: 'soup-base',
    name: 'Soup Base',
    minSelect: 1,
    maxSelect: 1,
    required: true,
    modifiers: [{ name: 'New England Style Cream' }, { name: 'Manhattan Style Tomato' }],
  },
  {
    key: 'mussels-style',
    name: 'Preparation',
    minSelect: 1,
    maxSelect: 1,
    required: true,
    modifiers: [{ name: 'Lemon & Olive Oil' }, { name: 'Plum Tomatoes & Fresh Basil' }],
  },
  {
    key: 'fries-sub',
    name: 'Chip Substitution',
    minSelect: 0,
    maxSelect: 1,
    required: false,
    modifiers: [{ name: 'Substitute fries for potato chips', price: 2.25 }],
  },
  {
    key: 'pizza-toppings',
    name: 'Pizza Toppings',
    minSelect: 0,
    maxSelect: 20,
    required: false,
    modifiers: [...PIZZA_TOPPINGS, STEAK_TOPPING],
  },
  {
    key: 'signature-toppings',
    name: 'Extra Toppings (+2.50 each)',
    minSelect: 0,
    maxSelect: 20,
    required: false,
    modifiers: [...PIZZA_TOPPINGS.map((t) => ({ ...t, tier: undefined, price: 2.5 })), STEAK_TOPPING],
  },
  {
    key: 'slice-toppings',
    name: 'Slice Toppings (+1.50 each)',
    minSelect: 0,
    maxSelect: 10,
    required: false,
    modifiers: [...PIZZA_TOPPINGS.map((t) => ({ ...t, tier: undefined, price: 1.5 })), STEAK_TOPPING],
  },
  {
    key: 'calzone-extras',
    name: 'Calzone Extra Items (+1.60 each)',
    minSelect: 0,
    maxSelect: 15,
    required: false,
    modifiers: [...PIZZA_TOPPINGS.map((t) => ({ ...t, tier: undefined, price: 1.6 })), STEAK_TOPPING],
  },
  {
    key: 'custom-calzone-toppings',
    name: 'Additional Toppings (first one included)',
    minSelect: 0,
    maxSelect: 15,
    required: false,
    includedCount: 1,
    modifiers: [...PIZZA_TOPPINGS.map((t) => ({ ...t, tier: TIER_CALZONE })), { name: 'Shredded Steak', price: 3.0 }],
  },
  {
    key: 'pasta-protein',
    name: 'Choose One',
    minSelect: 1,
    maxSelect: 1,
    required: true,
    modifiers: [{ name: 'Meat Sauce' }, { name: 'Meatballs' }, { name: 'Sausage' }],
  },
  {
    key: 'tortellini-choice',
    name: 'Tortellini Filling',
    minSelect: 1,
    maxSelect: 1,
    required: true,
    modifiers: [{ name: 'Meat' }, { name: 'Cheese' }],
  },
  {
    key: 'ravioli-choice',
    name: 'Ravioli Filling',
    minSelect: 1,
    maxSelect: 1,
    required: true,
    modifiers: [{ name: 'Cheese' }, { name: 'Spinach' }],
  },
  {
    key: 'sauce-choice',
    name: 'Sauce Choice',
    minSelect: 1,
    maxSelect: 1,
    required: true,
    modifiers: [{ name: 'White Wine Garlic Sauce' }, { name: 'Red Plum Tomato Sauce with Fresh Basil' }],
  },
  {
    key: 'frittata-fillings',
    name: 'Choose Any Three Fillings',
    minSelect: 3,
    maxSelect: 3,
    required: true,
    modifiers: [
      'Fresh Spinach',
      'Italian Sausage',
      'Fresh Mushrooms',
      'Roasted Red Peppers',
      'Sun-Dried Tomatoes',
      'Black Olives',
      'Green Peppers',
      'Baby Shrimp',
      'Onions',
      'Bacon',
      'Salmon',
      'Scallops',
      'Ham',
      'Zucchini',
      'Squash',
    ].map((n) => ({ name: n })),
  },
  {
    key: 'side-meat-choice',
    name: 'Choose One',
    minSelect: 1,
    maxSelect: 1,
    required: true,
    modifiers: [{ name: 'Meatballs' }, { name: 'Sausages' }],
  },
  {
    key: 'iced-tea-choice',
    name: 'Iced Tea Style',
    minSelect: 1,
    maxSelect: 1,
    required: true,
    modifiers: [{ name: 'Sweetened' }, { name: 'Unsweetened' }],
  },
]
