export interface CuratedCategory {
  name: string
  items: string[]
}

export const curatedPantryItems: CuratedCategory[] = [
  {
    name: 'Vegetables',
    items: [
      'Onions',
      'Garlic',
      'Potatoes',
      'Tomatoes',
      'Carrots',
      'Bell peppers',
      'Broccoli',
      'Spinach',
      'Lettuce',
    ],
  },
  {
    name: 'Fruits',
    items: [
      'Apples',
      'Bananas',
      'Oranges',
      'Lemons',
      'Limes',
      'Berries',
      'Avocados',
    ],
  },
  {
    name: 'Proteins',
    items: [
      'Chicken',
      'Ground beef',
      'Eggs',
      'Bacon',
      'Tofu',
      'Black beans',
      'Chickpeas',
    ],
  },
  {
    name: 'Dairy',
    items: ['Milk', 'Butter', 'Cheese', 'Yogurt', 'Cream', 'Sour cream'],
  },
  {
    name: 'Pantry Staples',
    items: [
      'Rice',
      'Pasta',
      'Bread',
      'Flour',
      'Sugar',
      'Salt',
      'Pepper',
      'Olive oil',
      'Vegetable oil',
      'Soy sauce',
      'Vinegar',
      'Honey',
    ],
  },
  {
    name: 'Baking',
    items: [
      'Baking powder',
      'Baking soda',
      'Vanilla extract',
      'Brown sugar',
      'Chocolate chips',
    ],
  },
  {
    name: 'Canned & Jarred',
    items: [
      'Canned tomatoes',
      'Tomato paste',
      'Chicken broth',
      'Peanut butter',
      'Jam',
      'Pickles',
    ],
  },
  {
    name: 'Seasonings & Spices',
    items: [
      'Garlic powder',
      'Onion powder',
      'Paprika',
      'Cumin',
      'Chili powder',
      'Oregano',
      'Basil',
      'Thyme',
      'Cinnamon',
    ],
  },
]
