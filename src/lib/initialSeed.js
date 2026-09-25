// Default seed data matching the Lenso Photography design exactly
export const INITIAL_CATEGORIES = [
  { id: 'cat-1', name: 'Weddings', created_at: new Date('2024-01-01').toISOString() },
  { id: 'cat-2', name: 'Portraits', created_at: new Date('2024-01-02').toISOString() },
  { id: 'cat-3', name: 'Landscapes', created_at: new Date('2024-01-03').toISOString() },
  { id: 'cat-4', name: 'Newborn', created_at: new Date('2024-01-04').toISOString() },
  { id: 'cat-5', name: 'Architecture', created_at: new Date('2024-01-05').toISOString() },
  { id: 'cat-6', name: 'Products', created_at: new Date('2024-01-06').toISOString() },
];

export const INITIAL_PROJECTS = [
  {
    id: 'proj-1',
    name: 'Eternal Romance & Vows',
    category_id: 'cat-1',
    category_name: 'Weddings',
    cover_image: 'https://images.unsplash.com/photo-1519741497674-611481863552?auto=format&fit=crop&w=1200&q=85',
    created_at: new Date('2024-01-10').toISOString(),
  },
  {
    id: 'proj-2',
    name: 'Studio Noir & Golden Light',
    category_id: 'cat-2',
    category_name: 'Portraits',
    cover_image: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=1200&q=85',
    created_at: new Date('2024-01-11').toISOString(),
  },
  {
    id: 'proj-3',
    name: 'Glacier Peak & Solitude',
    category_id: 'cat-3',
    category_name: 'Landscapes',
    cover_image: 'https://images.unsplash.com/photo-1464822759023-fed622ff2c3b?auto=format&fit=crop&w=1200&q=85',
    created_at: new Date('2024-01-12').toISOString(),
  },
  {
    id: 'proj-4',
    name: 'Pure Innocence & Slumber',
    category_id: 'cat-4',
    category_name: 'Newborn',
    cover_image: 'https://images.unsplash.com/photo-1555252333-9f8e92e65df9?auto=format&fit=crop&w=1200&q=85',
    created_at: new Date('2024-01-13').toISOString(),
  },
  {
    id: 'proj-5',
    name: 'Modernist Cantilever Villa',
    category_id: 'cat-5',
    category_name: 'Architecture',
    cover_image: 'https://images.unsplash.com/photo-1600585154340-be6161a56a0c?auto=format&fit=crop&w=1200&q=85',
    created_at: new Date('2024-01-14').toISOString(),
  },
  {
    id: 'proj-6',
    name: 'Chronograph Minimalist Edition',
    category_id: 'cat-6',
    category_name: 'Products',
    cover_image: 'https://images.unsplash.com/photo-1522335789203-aabd1fc54bc9?auto=format&fit=crop&w=1200&q=85',
    created_at: new Date('2024-01-15').toISOString(),
  },
];

export const INITIAL_PROJECT_IMAGES = [
  // Weddings
  { id: 'img-101', project_id: 'proj-1', image_url: 'https://images.unsplash.com/photo-1519741497674-611481863552?auto=format&fit=crop&w=1200&q=85', sort_order: 0 },
  { id: 'img-102', project_id: 'proj-1', image_url: 'https://images.unsplash.com/photo-1511285560929-80b456fea0bc?auto=format&fit=crop&w=1200&q=85', sort_order: 1 },
  { id: 'img-103', project_id: 'proj-1', image_url: 'https://images.unsplash.com/photo-1583939003579-730e3918a45a?auto=format&fit=crop&w=1200&q=85', sort_order: 2 },
  
  // Portraits
  { id: 'img-201', project_id: 'proj-2', image_url: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=1200&q=85', sort_order: 0 },
  { id: 'img-202', project_id: 'proj-2', image_url: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=1200&q=85', sort_order: 1 },
  { id: 'img-203', project_id: 'proj-2', image_url: 'https://images.unsplash.com/photo-1517841905240-472988babdf9?auto=format&fit=crop&w=1200&q=85', sort_order: 2 },

  // Landscapes
  { id: 'img-301', project_id: 'proj-3', image_url: 'https://images.unsplash.com/photo-1464822759023-fed622ff2c3b?auto=format&fit=crop&w=1200&q=85', sort_order: 0 },
  { id: 'img-302', project_id: 'proj-3', image_url: 'https://images.unsplash.com/photo-1506744038136-46273834b3fb?auto=format&fit=crop&w=1200&q=85', sort_order: 1 },
  { id: 'img-303', project_id: 'proj-3', image_url: 'https://images.unsplash.com/photo-1470071459604-3b5ec3a7fe05?auto=format&fit=crop&w=1200&q=85', sort_order: 2 },

  // Newborn
  { id: 'img-401', project_id: 'proj-4', image_url: 'https://images.unsplash.com/photo-1555252333-9f8e92e65df9?auto=format&fit=crop&w=1200&q=85', sort_order: 0 },
  { id: 'img-402', project_id: 'proj-4', image_url: 'https://images.unsplash.com/photo-1519689680058-324335c77eba?auto=format&fit=crop&w=1200&q=85', sort_order: 1 },

  // Architecture
  { id: 'img-501', project_id: 'proj-5', image_url: 'https://images.unsplash.com/photo-1600585154340-be6161a56a0c?auto=format&fit=crop&w=1200&q=85', sort_order: 0 },
  { id: 'img-502', project_id: 'proj-5', image_url: 'https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?auto=format&fit=crop&w=1200&q=85', sort_order: 1 },

  // Products
  { id: 'img-601', project_id: 'proj-6', image_url: 'https://images.unsplash.com/photo-1522335789203-aabd1fc54bc9?auto=format&fit=crop&w=1200&q=85', sort_order: 0 },
  { id: 'img-602', project_id: 'proj-6', image_url: 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?auto=format&fit=crop&w=1200&q=85', sort_order: 1 },
];

export const INITIAL_EQUIPMENT = [
  {
    id: 'eq-1',
    name: 'Sony Alpha 1 Mirrorless',
    model: 'ILCE-1 / 50.1MP Flagship',
    image_url: 'https://images.unsplash.com/photo-1516035069371-29a1b244cc32?auto=format&fit=crop&w=800&q=80',
    created_at: new Date('2024-01-01').toISOString(),
  },
  {
    id: 'eq-2',
    name: 'Sony FE 24-70mm f/2.8 GM II',
    model: 'SEL2470GM2 Master Lens',
    image_url: 'https://images.unsplash.com/photo-1617005082133-548c4dd27f35?auto=format&fit=crop&w=800&q=80',
    created_at: new Date('2024-01-02').toISOString(),
  },
  {
    id: 'eq-3',
    name: 'Canon EOS R5 Full-Frame',
    model: 'EOS R5 8K Cinema & Stills',
    image_url: 'https://media.karousell.com/media/photos/products/2023/6/29/pristine_condition_sony_a7iv_f_1688004462_2d284855.jpg',
    created_at: new Date('2024-01-03').toISOString(),
  },
  {
    id: 'eq-4',
    name: 'Profoto B10X Plus Studio Flash',
    model: '500Ws High Speed Sync',
    image_url: 'https://images.unsplash.com/photo-1542038784456-1ea8e935640e?auto=format&fit=crop&w=800&q=80',
    created_at: new Date('2024-01-04').toISOString(),
  },
];
