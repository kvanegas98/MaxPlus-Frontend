export const categories = [
  { id: 'all', name: 'Todos' },
  { id: 'comida', name: 'Comidas Rápidas' },
  { id: 'bebidas', name: 'Bebidas' },
  { id: 'postres', name: 'Postres' },
];

export const products = [
  {
    id: 'p1',
    name: 'Hamburguesa Doble Queso',
    description: 'Doble torta de carne, queso cheddar, lechuga, tomate y salsa especial.',
    price: 180.00,
    categoryId: 'comida',
    isAvailable: true,
    imageUrl: 'https://images.unsplash.com/photo-1568901346375-23c9450c58cd?auto=format&fit=crop&q=80&w=400&h=300'
  },
  {
    id: 'p2',
    name: 'Tacos al Pastor (Orden 4)',
    description: 'Tortillas de maíz, carne al pastor, piña, cilantro y cebolla.',
    price: 140.00,
    categoryId: 'comida',
    isAvailable: true,
    imageUrl: 'https://images.unsplash.com/photo-1551504734-5ee1c4a1479b?auto=format&fit=crop&q=80&w=400&h=300'
  },
  {
    id: 'p3',
    name: 'Refresco Natural (Medio Litro)',
    description: 'Cacao, Pitahaya, o Grama.',
    price: 45.00,
    categoryId: 'bebidas',
    isAvailable: true,
    imageUrl: 'https://images.unsplash.com/photo-1622483767028-3f66f32aef97?auto=format&fit=crop&q=80&w=400&h=300'
  },
  {
    id: 'p4',
    name: 'Coca Cola 12oz',
    description: 'Gaseosa de cola en lata bien fría.',
    price: 35.00,
    categoryId: 'bebidas',
    isAvailable: false,
    imageUrl: 'https://images.unsplash.com/photo-1622483767028-3f66f32aef97?auto=format&fit=crop&q=80&w=400&h=300'
  },
  {
    id: 'p5',
    name: 'Nachos con Carne',
    description: 'Totopos bañados en queso fundido, carne molida, frijoles y pico de gallo.',
    price: 210.00,
    categoryId: 'comida',
    isAvailable: false,
    imageUrl: 'https://images.unsplash.com/photo-1582169505937-b9992bd01ed9?auto=format&fit=crop&q=80&w=400&h=300'
  },
  {
    id: 'p6',
    name: 'Tres Leches Artesanal',
    description: 'Bizcocho húmedo en nuestra mezcla especial de tres leches.',
    price: 80.00,
    categoryId: 'postres',
    isAvailable: true,
    imageUrl: 'https://images.unsplash.com/photo-1579954115545-a95591f88bea?auto=format&fit=crop&q=80&w=400&h=300'
  },
  {
    id: 'p7',
    name: 'Alitas BBQ (6 piezas)',
    description: 'Alitas de pollo bañadas en salsa BBQ casera, con aderezo ranch.',
    price: 250.00,
    categoryId: 'comida',
    isAvailable: true,
    imageUrl: 'https://images.unsplash.com/photo-1527477396000-e27163b481c2?auto=format&fit=crop&q=80&w=400&h=300'
  }
];
