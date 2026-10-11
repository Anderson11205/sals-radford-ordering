// Sal's menu items — Part A: Antipasti → Steak Sandwiches (from official PDF)
import type { SeedCategory } from './seed-data'

export const CATEGORIES_A: SeedCategory[] = [
  {
    slug: 'appetizers',
    name: 'Appetizers',
    italianName: 'Antipasti',
    description: 'Appetizers & starters to begin your meal',
    image: '/images/calamari.jpg',
    items: [
      {
        name: 'Capresa',
        description: 'Slices of fresh mozzarella and fresh tomato and spices drizzled with olive oil and drizzled with balsamic',
        price: 12.25,
      },
      {
        name: 'Garlic Knots',
        description: 'Fresh baked garlic knots',
        variants: [
          { name: 'Regular (6)', price: 3.95, isDefault: true },
          { name: 'Regular (12)', price: 6.5 },
          { name: 'Melted Mozzarella (6)', price: 5.5 },
          { name: 'Melted Mozzarella (12)', price: 7.95 },
          { name: 'Bacon & Mozzarella (6)', price: 6.25 },
          { name: 'Bacon & Mozzarella (12)', price: 9.95 },
        ],
      },
      {
        name: 'French Fries',
        variants: [
          { name: 'Regular Small', price: 5.25, isDefault: true },
          { name: 'Regular Large', price: 7.25 },
          { name: 'Melted Mozzarella Small', price: 6.75 },
          { name: 'Melted Mozzarella Large', price: 9.25 },
          { name: 'Bacon & Mozzarella Small', price: 7.95 },
          { name: 'Bacon & Mozzarella Large', price: 10.5 },
        ],
      },
      { name: 'Fried Calamari', description: 'Served with tomato sauce', price: 12.75, image: '/images/calamari.jpg', popular: true },
      { name: 'Fried Zucchini', description: 'Served with ranch', price: 8.75 },
      {
        name: 'Chicken Wings (10)',
        description: 'BBQ, spicy, jerk, teriyaki or plain, boneless or with bone',
        price: 14.95,
        groups: ['wings-flavor', 'wings-style'],
        popular: true,
      },
      { name: 'Fried Mushrooms', description: 'Served with ranch', price: 8.95 },
      { name: 'Fried Ravioli', description: '10 cheese filled breaded ravioli served with sauce', price: 9.25 },
      { name: 'Bruschetta', description: 'Fresh tomatoes, basil and garlic drizzled with olive oil', price: 9.75 },
      {
        name: 'Bruschetta alla Greco',
        description: 'Chopped tomatoes, garlic, fresh basil, kalamata olives, roasted red peppers, Feta cheese, and olive oil',
        price: 12.95,
      },
      {
        name: 'Sautéed Calamari Lola',
        description: 'Sautéed in an olive oil, garlic, and basil sauce with plum tomatoes',
        price: 14.75,
      },
      {
        name: 'Shrimp Gia',
        description: '6 jumbo shrimp sautéed in a butter, white wine, lemon and garlic sauce on top of sautéed spinach',
        price: 14.75,
      },
      {
        name: 'Mussels',
        description: 'Steamed mussels cooked in a lemon and olive oil sauce or with plum tomatoes and fresh basil',
        price: 13.95,
        groups: ['mussels-style'],
      },
      {
        name: 'Mimo Roni',
        description: 'Ciabatta bread topped with pepperoni and melted mozzarella cheese',
        price: 8.75,
      },
      {
        name: 'Garlic Bread',
        variants: [
          { name: 'Classic', price: 3.95, isDefault: true },
          { name: 'With Melted Mozzarella', price: 5.25 },
        ],
      },
      { name: 'Breadsticks', description: 'With cheese', price: 8.95 },
      { name: 'Mozzarella Sticks', description: 'Served with sauce', price: 8.95, image: '/images/mozz-sticks.jpg' },
      {
        name: 'BBQ Nachos',
        description:
          'Fresh BBQ, chopped tomatoes, cut cherry peppers, and melted jalapeno cheese sauce with shredded mozzarella cheese, topped with BBQ sauce and chipotle sauce',
        price: 16.95,
      },
    ],
  },
  {
    slug: 'salads',
    name: 'Salads',
    italianName: 'Insalatas',
    description: 'Fresh salads — dressings: Italian, Honey Mustard, Ranch, Bleu Cheese, Balsamic Vinaigrette, Thousand Island, Caesar',
    image: '/images/salad-greek.jpg',
    items: [
      {
        name: "Sal's Caesar Salad",
        description: 'Tossed with romaine lettuce, shredded carrots, croutons and thinly-sliced red cabbage in our homemade Caesar dressing',
        price: 4.25,
        groups: ['salad-dressing'],
      },
      {
        name: "Sal's Tossed Salad",
        description: 'Lettuce, tomatoes, red onions, cucumbers, shredded carrots, shredded cabbage and croutons',
        price: 4.25,
        groups: ['salad-dressing'],
      },
      {
        name: 'Greek Salad',
        description:
          'Kalamata olives, feta cheese, roasted red peppers, artichokes, red onions, tomatoes, cucumbers, green olives, black olives and fresh mushrooms',
        price: 13.95,
        groups: ['salad-dressing'],
        image: '/images/salad-greek.jpg',
      },
      {
        name: 'Chicken Caesar Salad',
        description:
          'Tossed with romaine lettuce, shredded carrots, thinly-sliced red cabbage in our homemade Caesar dressing. Topped with grilled chicken and croutons',
        price: 13.5,
        groups: ['salad-dressing'],
      },
      {
        name: 'Grilled Chicken Salad',
        description:
          'Lettuce, tomatoes, red onions, artichokes, green olives, fresh mushrooms, cucumbers, Kalamata olives, black olives and roasted red peppers',
        price: 14.95,
        groups: ['salad-dressing'],
      },
      {
        name: 'Grilled Salmon Salad',
        description:
          'Served on top of lettuce, tomatoes, red onions, artichokes, cucumbers, green olives, black olives, Kalamata olives, roasted red peppers and fresh mushrooms',
        price: 16.25,
        groups: ['salad-dressing'],
        image: '/images/salmon.jpg',
      },
      {
        name: 'Cheese Steak Salad',
        description:
          'Lettuce, tomatoes, red onions, Kalamata olives, green olives, black olives, roasted red peppers, cucumbers, fresh mushrooms and artichokes. Topped with shredded steak with melted cheese',
        price: 16.25,
        groups: ['salad-dressing'],
      },
      {
        name: 'Cardinale Salad',
        description:
          'Grilled chicken, roasted red peppers, pepperoni, tomatoes, red onions, fresh mushrooms, fresh mozzarella and Kalamata olives tossed with fresh cut romaine and green leaf lettuce',
        price: 15.25,
        groups: ['salad-dressing'],
      },
    ],
  },
  {
    slug: 'soup',
    name: 'Soup',
    italianName: 'Zuppa',
    description: 'Homemade soups made fresh daily',
    image: '/images/soup.jpg',
    items: [
      {
        name: 'Pasta Fagioli',
        description: 'A white Northern bean soup with carrots, celery garlic, and a splash of marinara',
        variants: [
          { name: 'Cup', price: 4.75, isDefault: true },
          { name: 'Bowl', price: 8.25 },
        ],
      },
      {
        name: 'Italian Wedding',
        description: 'Fresh spinach, pasta, and meatballs, in a chicken stock with parmigiano cheese',
        variants: [
          { name: 'Cup', price: 4.75, isDefault: true },
          { name: 'Bowl', price: 8.75 },
        ],
      },
      {
        name: 'Seafood Soup',
        description: 'Mussels, clams, and baby shrimp in your choice of a New England style cream base or a Manhattan style tomato base',
        variants: [
          { name: 'Cup', price: 7.95, isDefault: true },
          { name: 'Bowl', price: 13.25 },
        ],
        groups: ['soup-base'],
      },
      {
        name: 'Tortellini en Brodo',
        description: 'Cheese tortellini in a chicken stock with sliced mushrooms, shallots, fresh spinach and parmigiano cheese',
        variants: [
          { name: 'Cup', price: 4.75, isDefault: true },
          { name: 'Bowl', price: 8.5 },
        ],
      },
      {
        name: 'Chicken Noodle',
        description: 'Diced chicken breast in a chicken stock with carrots, celery, pasta, and parmigiano cheese',
        variants: [
          { name: 'Cup', price: 4.75, isDefault: true },
          { name: 'Bowl', price: 8.75 },
        ],
      },
      {
        name: 'Tuscan',
        description: 'Italian sausage, bacon, fresh spinach, in a cream base with carrots, celery, and parmigiano cheese',
        variants: [
          { name: 'Cup', price: 5.75, isDefault: true },
          { name: 'Bowl', price: 9.5 },
        ],
      },
    ],
  },
  {
    slug: 'sides',
    name: 'Side Orders',
    italianName: 'Contorni',
    description: 'Sides to complete your meal',
    items: [
      {
        name: 'Meatballs or Sausages',
        price: 5.95,
        groups: ['side-meat-choice'],
      },
      { name: 'Sautéed Broccoli and Garlic', price: 4.95 },
      { name: 'Sautéed Spinach and Garlic', price: 4.95 },
      { name: 'Sautéed Mushrooms and Garlic', price: 4.95 },
      { name: 'Sautéed Spinach and Artichokes', price: 6.95 },
      { name: 'Dipping Olive Oil', price: 1.65 },
      { name: 'Extra Dressing', price: 0.5 },
      { name: 'Calzone Sauce', price: 0.6 },
    ],
  },
  {
    slug: 'pizza',
    name: 'Pizza',
    description:
      'Build your own pizza — Cheese: Small 12.50 / Medium 14.95 / Large 17.50 / Sicilian Thick 16" 18.75. Extra toppings each: +1.95 / +2.25 / +2.50 / +3.00',
    image: '/images/pizza-pepperoni.jpg',
    items: [
      {
        name: 'Create Your Own Cheese Pizza',
        description:
          'Cheese pizza with your choice of toppings. Extra topping prices: Small +1.95, Medium +2.25, Large +2.50, Sicilian Thick +3.00 each',
        variants: [
          { name: 'Small', price: 12.5, isDefault: true },
          { name: 'Medium', price: 14.95 },
          { name: 'Large', price: 17.5 },
          { name: 'Sicilian Thick 16"', price: 18.75 },
        ],
        groups: ['pizza-toppings'],
        sizeTier: true,
        image: '/images/pizza-pepperoni.jpg',
        popular: true,
      },
      {
        name: 'The Works Pizza',
        description: 'Sausage, mushrooms, hamburger, green peppers, pepperoni and onions',
        variants: [
          { name: 'Small', price: 17.95, isDefault: true },
          { name: 'Medium', price: 22.95 },
          { name: 'Large', price: 27.95 },
          { name: 'Sicilian Thick 16"', price: 30.95 },
        ],
        groups: ['pizza-toppings'],
        sizeTier: true,
      },
      {
        name: 'Pizza by the Slice',
        description: 'Cheese slice with your choice of toppings — each additional topping +1.50',
        price: 2.5,
        groups: ['slice-toppings'],
      },
      {
        name: 'Mini Pizza for One',
        description: 'A personal mini pizza — each additional topping +1.50',
        price: 9.25,
        groups: ['slice-toppings'],
      },
    ],
  },
  {
    slug: 'signature-pies',
    name: "Sal's Signature Pies",
    italianName: 'Pizze Speciali',
    description: 'Large only. Each additional topping +2.50',
    image: '/images/pizza-margherita.jpg',
    items: [
      {
        name: 'Pizza alla Margherita',
        description: 'Basil, tomato sauce and mozzarella cheese',
        price: 17.75,
        groups: ['signature-toppings'],
        image: '/images/pizza-margherita.jpg',
        popular: true,
      },
      {
        name: 'Primavera Pie',
        description: 'Artichokes, basil, roasted red peppers, tomatoes, mushrooms and mozzarella cheese',
        price: 23.95,
        groups: ['signature-toppings'],
      },
      {
        name: "Popeye's Pie",
        description: 'Spinach, basil, broccoli, garlic, tomatoes and mozzarella cheese',
        price: 22.95,
        groups: ['signature-toppings'],
      },
      {
        name: 'The Pompeii',
        description: 'Artichokes, Kalamata olives, fresh mushrooms and diced tomatoes with fresh basil. No sauce',
        price: 22.95,
        groups: ['signature-toppings'],
      },
      {
        name: 'Rustica Pizza',
        description: 'Italian pepperoni, roasted red peppers, black olives and basil',
        price: 23.5,
        groups: ['signature-toppings'],
      },
      {
        name: 'Meat Pie',
        description: 'Bacon, pepperoni, sausage and mozzarella cheese',
        price: 23.95,
        groups: ['signature-toppings'],
      },
      {
        name: 'White Ricotta Pizza',
        description: 'Ricotta and mozzarella cheese. No sauce',
        price: 20.95,
        groups: ['signature-toppings'],
      },
      {
        name: 'Pizza alla Monte',
        description: 'Fresh in-season plum tomatoes with a hint of garlic. Topped with basil and fresh mozzarella',
        price: 24.5,
        groups: ['signature-toppings'],
      },
      {
        name: 'The Nico',
        description:
          'Fresh plum tomatoes, fresh mozzarella and fresh prosciutto with Kalamata olives topped with fresh basil and extra virgin olive oil',
        price: 25.95,
        groups: ['signature-toppings'],
      },
      {
        name: "Paisano's Pie",
        description: 'Grilled chicken, basil, roasted red peppers, mushrooms and artichokes. Sprinkled with rosemary',
        price: 24.95,
        groups: ['signature-toppings'],
      },
      {
        name: 'Hawaiian Pizza',
        description: 'Ham, pineapple and mozzarella cheese',
        price: 21.95,
        groups: ['signature-toppings'],
      },
      {
        name: 'Chicken Parmigiana Pizza',
        description: 'Breaded and deep fried strips of chicken, tomato sauce and mozzarella cheese, topped with parmigiano cheese',
        price: 24.95,
        groups: ['signature-toppings'],
      },
      {
        name: 'BBQ Chicken Pizza',
        description: 'Grilled chicken, cut bacon and pineapple topped with BBQ sauce and mozzarella cheese',
        price: 23.95,
        groups: ['signature-toppings'],
      },
      {
        name: 'Greek Pizza',
        description: 'Tomato sauce with feta cheese, basil, mozzarella, garlic and tomatoes',
        price: 23.95,
        groups: ['signature-toppings'],
      },
      {
        name: 'Pesto Pie',
        description: 'Ricotta pizza with pesto and mozzarella cheese',
        price: 21.95,
        groups: ['signature-toppings'],
      },
      {
        name: 'Eggplant Parmigiana Pizza',
        description: 'Breaded eggplant, ricotta, basil, and mozzarella cheese. Topped with tomato sauce',
        price: 23.95,
        groups: ['signature-toppings'],
      },
      {
        name: 'Chipotle Chicken Pizza',
        description: 'Grilled chicken strips, bacon, red onion and mozzarella cheese drizzled with chipotle sauce',
        price: 23.95,
        groups: ['signature-toppings'],
      },
      {
        name: 'Bacon & Chicken Ranch Pizza',
        description: 'Grilled chicken, bacon and mozzarella, topped with ranch dressing. No red sauce',
        price: 23.95,
        groups: ['signature-toppings'],
      },
      {
        name: 'Cheese Steak Pizza',
        description: 'A crispy crust with shredded steak, sautéed onions, mushrooms and green peppers with mozzarella cheese. No sauce',
        price: 27.95,
        groups: ['signature-toppings'],
      },
      {
        name: 'Jerk Chicken Pizza',
        description: 'Grilled chicken, bacon, pineapple, red onion, green pepper, jerk sauce, and mozzarella cheese',
        price: 24.95,
        groups: ['signature-toppings'],
      },
    ],
  },
  {
    slug: 'calzones',
    name: 'Calzones',
    italianName: 'Calzoni',
    description: 'Specialty calzones — each extra item +1.60. Create your own with ricotta, mozzarella & one topping included',
    image: '/images/calzone.jpg',
    items: [
      {
        name: 'Chicken Calzone',
        description: 'Grilled chicken, ricotta cheese and mozzarella cheese',
        price: 13.25,
        groups: ['calzone-extras'],
        image: '/images/calzone.jpg',
      },
      {
        name: 'Four Cheese Calzone',
        description: 'Mozzarella, provolone, ricotta and Parmigiano cheese',
        price: 13.5,
        groups: ['calzone-extras'],
      },
      {
        name: 'Figi Calzone',
        description: 'Fresh mushrooms, tomatoes, feta, ricotta and mozzarella cheese',
        price: 14.5,
        groups: ['calzone-extras'],
      },
      {
        name: 'Greek Calzone',
        description: 'Spinach, garlic, mozzarella, ricotta, and feta cheese',
        price: 14.5,
        groups: ['calzone-extras'],
      },
      {
        name: 'Meat Calzone',
        description: 'Pepperoni, Italian sausage, ham, ricotta and mozzarella cheese',
        price: 14.95,
        groups: ['calzone-extras'],
      },
      {
        name: 'Milano Calzone',
        description: 'Grilled chicken, tomatoes, feta, ricotta and mozzarella cheese',
        price: 14.75,
        groups: ['calzone-extras'],
      },
      {
        name: "Paisano's Calzone",
        description: 'Grilled chicken, artichokes, broccoli, roasted red peppers, ricotta and mozzarella cheese',
        price: 14.95,
        groups: ['calzone-extras'],
      },
      {
        name: "Popeye's Calzone",
        description: 'Spinach, fresh tomato, garlic, broccoli, ricotta and mozzarella cheese',
        price: 14.5,
        groups: ['calzone-extras'],
      },
      {
        name: 'Porcini Calzone',
        description: 'Fresh mushrooms, roasted red peppers and artichokes with ricotta and mozzarella cheese',
        price: 14.25,
        groups: ['calzone-extras'],
      },
      {
        name: 'Rustica Calzone',
        description: 'Pepperoni, roasted red peppers, black olives, ricotta and mozzarella cheese',
        price: 14.5,
        groups: ['calzone-extras'],
      },
      {
        name: 'Steak Calzone',
        description: 'Sliced steak, mushrooms, onions, green peppers, ricotta and mozzarella cheese',
        price: 16.25,
        groups: ['calzone-extras'],
      },
      {
        name: 'Tomato Calzone',
        description: 'Fresh tomatoes mixed in a basil and garlic olive oil with ricotta and mozzarella cheese',
        price: 13.95,
        groups: ['calzone-extras'],
      },
      {
        name: 'Create Your Own Calzone',
        description:
          'Ricotta, mozzarella & one topping included. Each additional topping: Small +1.60, Large +2.85',
        variants: [
          { name: 'Small', price: 13.25, isDefault: true },
          { name: 'Large', price: 18.95 },
        ],
        groups: ['custom-calzone-toppings'],
        sizeTier: true,
      },
      {
        name: 'The Works Calzone',
        description: 'Sausage, mushrooms, hamburger, green peppers, pepperoni, onions, ham, ricotta and mozzarella cheese',
        variants: [
          { name: 'Small', price: 16.95, isDefault: true },
          { name: 'Large', price: 27.95 },
        ],
      },
    ],
  },
  {
    slug: 'pizza-pops',
    name: 'Pizza Pops',
    description: 'Our famous folded pizza pops — when sharing a pop, add .60 for another sauce',
    image: '/images/calzone.jpg',
    items: [
      {
        name: "Sal's Pop",
        description: 'Pepperoni, mushrooms, onions and black olives with mozzarella cheese',
        price: 13.75,
      },
      {
        name: 'Stromboli',
        description: 'Pepperoni, ham, Italian sausage, green peppers and mozzarella cheese',
        price: 13.95,
        popular: true,
      },
      {
        name: 'Chicken Bruschetta Pop',
        description: 'Grilled chicken, chopped tomatoes, garlic, mozzarella cheese, basil and extra virgin olive oil',
        price: 13.5,
      },
      {
        name: 'Chicken Pop',
        description: 'Chicken, mozzarella cheese and parmigiano cheese',
        price: 12.95,
      },
      {
        name: 'Love Puppy',
        description: 'Italian sausage, peppers, onions and mozzarella cheese',
        price: 13.95,
      },
      {
        name: 'Pepperoni Pop',
        description: 'Pepperoni and mozzarella cheese',
        price: 12.95,
        popular: true,
      },
      {
        name: 'Hawaiian Pop',
        description: 'With ham, pineapple and melted mozzarella cheese',
        price: 13.25,
      },
      {
        name: 'Meat Pop',
        description: 'Pepperoni, Italian sausage and ham with melted mozzarella cheese',
        price: 13.95,
      },
      {
        name: 'Steak Pop',
        description: 'Steak, sautéed onions, mushrooms and green peppers with melted mozzarella cheese',
        price: 14.95,
      },
      {
        name: 'BBQ Chicken Pop',
        description: 'With grilled chicken, mozzarella cheese, and BBQ sauce',
        price: 13.95,
      },
      {
        name: 'Chicken Parmigiana Pop',
        description: 'With grilled chicken, mozzarella cheese, and a touch of tomato sauce',
        price: 13.95,
      },
    ],
  },
  {
    slug: 'sandwiches',
    name: 'Specialty Sandwiches',
    italianName: 'Panini Speciali',
    description: 'All sandwiches served with potato chips. Substitute fries for an extra 2.25',
    image: '/images/sub-italian.jpg',
    items: [
      {
        name: 'Special Italian Sub',
        description:
          'Ham, pepperoni, salami, provolone, lettuce, tomato and onions with either Italian dressing or mayo. Served either hot or cold',
        price: 12.95,
        groups: ['fries-sub'],
        image: '/images/sub-italian.jpg',
        popular: true,
      },
      {
        name: 'Chicken Cutlet Parmigiana',
        description: 'Breaded chicken with mozzarella cheese and tomato sauce',
        price: 13.5,
        groups: ['fries-sub'],
      },
      {
        name: 'Meatball Parmigiana',
        description: 'Mozzarella cheese and tomato sauce',
        price: 13.25,
        groups: ['fries-sub'],
      },
      {
        name: 'Veal Cutlet Parmigiana',
        description: 'Breaded veal with mozzarella cheese and tomato sauce',
        price: 14.0,
        groups: ['fries-sub'],
      },
      {
        name: 'Grilled Chicken Wrap',
        description: 'Grilled chicken, onions, mushrooms, tomatoes and mayo. Topped with provolone cheese in a tomato-basil wrap',
        price: 12.75,
        groups: ['fries-sub'],
      },
      {
        name: 'Sausage and Peppers',
        description: 'Sautéed in tomato sauce and served on a hoagie roll',
        price: 13.25,
        groups: ['fries-sub'],
      },
      {
        name: 'Eggplant Parmigiana Sandwich',
        description: 'Breaded eggplant with mozzarella cheese and tomato sauce',
        price: 12.25,
        groups: ['fries-sub'],
      },
      {
        name: 'Grilled Chicken Sub',
        description: 'Grilled chicken with mushrooms, fresh tomato, onions, mayonnaise and provolone cheese. All sautéed',
        price: 13.5,
        groups: ['fries-sub'],
      },
      {
        name: 'Turkey Club',
        description: 'On a sub roll with sliced turkey, bacon and melted provolone cheese with mayonnaise, lettuce, tomatoes and onions',
        price: 12.95,
        groups: ['fries-sub'],
      },
      {
        name: 'Ham and Cheese Club',
        description: 'On a sub roll with sliced ham, bacon and melted provolone cheese with mayonnaise, lettuce, tomatoes and onions. Served hot or cold',
        price: 12.95,
        groups: ['fries-sub'],
      },
      {
        name: 'Ciabatta Capresa',
        description:
          'Tomatoes, fresh basil, and fresh mozzarella served on ciabatta bread with balsamic glaze, drizzled with extra virgin olive oil',
        price: 12.5,
        groups: ['fries-sub'],
      },
      {
        name: 'Blackened Chicken Ciabatta',
        description: 'Grilled chicken with our signature blackening spices with chipotle mayo, lettuce, tomatoes and onions',
        price: 13.95,
        groups: ['fries-sub'],
      },
      {
        name: 'Chipotle Chicken Ciabatta',
        description:
          'Made with fresh grilled chicken, bacon, lettuce, tomatoes and a spicy chipotle mayo topped with melted provolone cheese on ciabatta bread',
        price: 13.95,
        groups: ['fries-sub'],
      },
      {
        name: 'Steak and Cheese Wrap',
        description: 'With onions, mushrooms, green peppers, lettuce, tomatoes and mayo',
        price: 12.95,
        groups: ['fries-sub'],
      },
      {
        name: 'BBQ Sandwich',
        description: 'On a Kaiser roll served with coleslaw and sliced homemade chips',
        price: 15.95,
      },
      {
        name: 'Fish and Chips',
        description: 'Fried cod served with sliced homemade chips, coleslaw, and tarter sauce',
        price: 15.95,
      },
    ],
  },
  {
    slug: 'burgers',
    name: 'Angus Burgers',
    italianName: 'Panini di Manzo',
    description: 'All Angus Burgers are 8 oz. and served on a Kaiser roll with fries',
    image: '/images/burger.jpg',
    items: [
      {
        name: 'Classic Burger',
        description: 'Lettuce, tomato, onions and mayonnaise. Topped with American cheese',
        price: 13.95,
        image: '/images/burger.jpg',
      },
      {
        name: 'BBQ Burger',
        description: 'Sautéed mushrooms, onions and bacon mixed with BBQ sauce. Topped with provolone cheese',
        price: 14.25,
      },
      {
        name: 'Bacon & Cheese Burger',
        description: 'Lettuce, tomato and mayonnaise. Topped with diced bacon and melted American cheese',
        price: 14.25,
      },
      {
        name: 'Bruschetta Burger',
        description: 'Topped with chopped tomatoes, fresh basil, olive oil and well seasoned fresh cubed mozzarella',
        price: 13.95,
      },
    ],
  },
  {
    slug: 'steak-sandwiches',
    name: 'Steak Sandwiches',
    italianName: 'Panini di Bistecca',
    description: 'All sandwiches served with potato chips. Substitute fries for an extra 2.25',
    image: '/images/cheesesteak.jpg',
    items: [
      {
        name: 'Cheese Steak',
        description: 'Onions and mayonnaise',
        price: 11.95,
        groups: ['fries-sub'],
        image: '/images/cheesesteak.jpg',
        popular: true,
      },
      {
        name: 'Cheese Steak Hoagie',
        description: 'Lettuce, tomato, onions, mayonnaise',
        price: 12.75,
        groups: ['fries-sub'],
      },
      {
        name: 'Cheese Steak with Mushrooms',
        description: 'Onions, mushrooms and mayonnaise',
        price: 12.25,
        groups: ['fries-sub'],
      },
      {
        name: 'Special Steak',
        description: 'Green peppers, mushrooms, onions and mayonnaise',
        price: 12.75,
        groups: ['fries-sub'],
      },
      {
        name: 'Cheese Steak The Works',
        description: 'Green peppers, mushrooms, lettuce, tomato, onions, mayonnaise',
        price: 12.95,
        groups: ['fries-sub'],
      },
      {
        name: 'The New Yorker',
        description: 'Onions, mayonnaise, banana peppers, green peppers, cheese, mushrooms, cherry peppers, lettuce and tomatoes',
        price: 13.95,
        groups: ['fries-sub'],
      },
      {
        name: 'Pizza Steak',
        description: 'Tomato sauce, mozzarella cheese and onions',
        price: 12.75,
        groups: ['fries-sub'],
      },
    ],
  },
]
