// src/menuData.js
// export default [
//   {
//     id: 1,
//     name: 'Main Courses',
//     subcategories: [
//       {
//         id: 11,
//         name: 'Test',
//         dishes: [
//           { id: 111, name: 'One', price: 60 },
//           { id: 112, name: 'Solyanka', price: 70 }
//         ]
//       }
//     ]
//   },
//   {
//     id: 2,
//     name: 'Side Dishes',
//     subcategories: [
//       {
//         id: 21,
//         name: 'Pasta',
//         dishes: [
//           { id: 211, name: 'Navy-style pasta', price: 55 }
//         ]
//       }
//     ]
//   }
// ];

export default [
  {
    id: 1,
    name: 'Main Courses',
    subcategories: [
      {
        id: 11,
        name: 'Soups',
        dishes: [
          { id: 111, name: 'Borscht', price: 60 },
          { id: 112, name: 'Solyanka', price: 70 }
        ]
      },
      {
        id: 12,
        name: 'Test',
        dishes: [
          { id: 121, name: 'Navy-style pasta', price: 55 },
          { id: 122, name: 'Carbonara', price: 80 }
        ]
      }
    ]
  },
  {
    id: 2,
    name: 'Side Dishes',
    subcategories: [
      {
        id: 21,
        name: 'Rice',
        dishes: [
          { id: 211, name: 'Rice with vegetables', price: 40 }
        ]
      }
    ]
  }
];
