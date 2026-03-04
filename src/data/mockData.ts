export type Product = {
  id: string;
  name: string;
  category: string;
  sku: string;
  price: number;
  cost: number;
  stock: number;
  minStock: number;
  description: string;
  imageEmoji: string;
};

export type Sale = {
  id: string;
  date: string;
  customerId: string;
  customerName: string;
  products: { productId: string; productName: string; qty: number; price: number }[];
  total: number;
  status: 'completed' | 'pending' | 'refunded';
  paymentMethod: string;
};

export type Expense = {
  id: string;
  date: string;
  category: string;
  description: string;
  amount: number;
  vendor: string;
};

export type Customer = {
  id: string;
  name: string;
  email: string;
  phone: string;
  address: string;
  joinDate: string;
  totalPurchases: number;
  totalSpent: number;
  lastPurchase: string;
  segment: 'VIP' | 'Regular' | 'New' | 'At Risk';
  notes: string;
};

export const products: Product[] = [
  { id: 'p1', name: 'Lavender Reed Diffuser', category: 'Reed Diffusers', sku: 'RD-001', price: 28.99, cost: 12.50, stock: 145, minStock: 30, description: 'Calming lavender scent with natural rattan reeds', imageEmoji: '🌿' },
  { id: 'p2', name: 'Eucalyptus Reed Diffuser', category: 'Reed Diffusers', sku: 'RD-002', price: 32.99, cost: 14.00, stock: 98, minStock: 25, description: 'Fresh eucalyptus for a spa-like atmosphere', imageEmoji: '🌿' },
  { id: 'p3', name: 'Rose & Oud Reed Diffuser', category: 'Reed Diffusers', sku: 'RD-003', price: 42.99, cost: 18.00, stock: 12, minStock: 20, description: 'Luxurious rose and oud blend, premium 200ml', imageEmoji: '🌹' },
  { id: 'p4', name: 'Ultrasonic Cool Mist Humidifier', category: 'Humidifiers', sku: 'HM-001', price: 89.99, cost: 38.00, stock: 54, minStock: 15, description: '2.5L tank, whisper-quiet, LED nightlight', imageEmoji: '💧' },
  { id: 'p5', name: 'Warm & Cool Mist Humidifier', category: 'Humidifiers', sku: 'HM-002', price: 119.99, cost: 52.00, stock: 31, minStock: 10, description: 'Dual-mode 4L humidifier with auto shutoff', imageEmoji: '💧' },
  { id: 'p6', name: 'Mini Desktop Humidifier', category: 'Humidifiers', sku: 'HM-003', price: 34.99, cost: 14.50, stock: 78, minStock: 20, description: 'Compact USB-powered 300ml humidifier', imageEmoji: '💧' },
  { id: 'p7', name: 'Bohemian Kitchen Runner 60x180', category: 'Kitchen Runners', sku: 'KR-001', price: 54.99, cost: 22.00, stock: 40, minStock: 10, description: 'Hand-woven cotton, anti-slip backing', imageEmoji: '🏡' },
  { id: 'p8', name: 'Geometric Kitchen Runner 45x150', category: 'Kitchen Runners', sku: 'KR-002', price: 44.99, cost: 18.50, stock: 27, minStock: 10, description: 'Modern geometric pattern, easy-clean', imageEmoji: '🏡' },
  { id: 'p9', name: 'Speckled Ceramic Vase - Large', category: 'Ceramic Vases', sku: 'CV-001', price: 67.99, cost: 28.00, stock: 22, minStock: 8, description: 'Handthrown 35cm terracotta speckled vase', imageEmoji: '🏺' },
  { id: 'p10', name: 'Organic Form Vase - Set of 3', category: 'Ceramic Vases', sku: 'CV-002', price: 89.99, cost: 36.00, stock: 18, minStock: 5, description: 'Three sizes, matte glazed in sage and cream', imageEmoji: '🏺' },
  { id: 'p11', name: 'Mini Bud Vase - Blush', category: 'Ceramic Vases', sku: 'CV-003', price: 24.99, cost: 9.50, stock: 65, minStock: 20, description: 'Perfect single stem display, 12cm tall', imageEmoji: '🏺' },
  { id: 'p12', name: 'Vanilla & Sandalwood Candle', category: 'Scented Candles', sku: 'SC-001', price: 38.99, cost: 15.00, stock: 92, minStock: 30, description: '250g soy wax, 50hr burn time', imageEmoji: '🕯️' },
  { id: 'p13', name: 'Sea Salt & Driftwood Candle', category: 'Scented Candles', sku: 'SC-002', price: 34.99, cost: 13.50, stock: 75, minStock: 25, description: 'Fresh coastal scent, hand-poured 200g', imageEmoji: '🕯️' },
  { id: 'p14', name: 'Black Amber Candle - Luxury', category: 'Scented Candles', sku: 'SC-003', price: 58.99, cost: 22.00, stock: 8, minStock: 15, description: 'Deep amber in matte black vessel, 350g', imageEmoji: '🕯️' },
  { id: 'p15', name: 'Citrus Burst Candle Trio', category: 'Scented Candles', sku: 'SC-004', price: 72.99, cost: 28.00, stock: 33, minStock: 10, description: 'Gift set: lemon, orange, grapefruit', imageEmoji: '🕯️' },
];

export const customers: Customer[] = [
  { id: 'c1', name: 'Amelia Hart', email: 'amelia.hart@email.com', phone: '+1 555-0101', address: '42 Maple St, Portland OR 97201', joinDate: '2023-02-14', totalPurchases: 12, totalSpent: 892.50, lastPurchase: '2024-11-28', segment: 'VIP', notes: 'Prefers diffusers and candles. Allergic to jasmine.' },
  { id: 'c2', name: 'Marcus Chen', email: 'm.chen@inbox.com', phone: '+1 555-0142', address: '88 Oak Avenue, Seattle WA 98101', joinDate: '2023-06-05', totalPurchases: 7, totalSpent: 541.20, lastPurchase: '2024-10-15', segment: 'Regular', notes: 'Bulk buyer, usually orders humidifiers.' },
  { id: 'c3', name: 'Sofia Rosenberg', email: 'sofia.r@gmail.com', phone: '+1 555-0198', address: '15 Birch Lane, Austin TX 78701', joinDate: '2024-01-22', totalPurchases: 3, totalSpent: 214.97, lastPurchase: '2024-11-01', segment: 'New', notes: 'Interested in home decor sets.' },
  { id: 'c4', name: 'James Okafor', email: 'james.ok@work.net', phone: '+1 555-0167', address: '200 Pine Rd, Chicago IL 60601', joinDate: '2022-09-11', totalPurchases: 18, totalSpent: 1340.80, lastPurchase: '2024-11-30', segment: 'VIP', notes: 'Corporate gifting orders. Best customer.' },
  { id: 'c5', name: 'Luna Patel', email: 'luna.p@mail.com', phone: '+1 555-0213', address: '7 Cedar Close, Denver CO 80201', joinDate: '2023-11-08', totalPurchases: 4, totalSpent: 298.96, lastPurchase: '2024-07-20', segment: 'At Risk', notes: 'Hasn\'t purchased in 4 months.' },
  { id: 'c6', name: 'Oliver Blanc', email: 'o.blanc@french.fr', phone: '+1 555-0245', address: '33 Elm St, Miami FL 33101', joinDate: '2024-03-15', totalPurchases: 2, totalSpent: 127.98, lastPurchase: '2024-09-10', segment: 'New', notes: 'Interested in ceramic vases.' },
  { id: 'c7', name: 'Chloe Williams', email: 'chloe.w@email.com', phone: '+1 555-0289', address: '9 Willow Ave, Nashville TN 37201', joinDate: '2023-04-20', totalPurchases: 9, totalSpent: 674.10, lastPurchase: '2024-11-25', segment: 'Regular', notes: 'Loves kitchen runners and candles.' },
  { id: 'c8', name: 'Nathan Torres', email: 'n.torres@inbox.com', phone: '+1 555-0311', address: '56 Walnut Blvd, Phoenix AZ 85001', joinDate: '2022-12-01', totalPurchases: 14, totalSpent: 1087.60, lastPurchase: '2024-11-18', segment: 'VIP', notes: 'Interior designer, recommends to clients.' },
];

export const sales: Sale[] = [
  { id: 's1', date: '2024-11-30', customerId: 'c4', customerName: 'James Okafor', products: [{ productId: 'p12', productName: 'Vanilla & Sandalwood Candle', qty: 3, price: 38.99 }, { productId: 'p15', productName: 'Citrus Burst Candle Trio', qty: 1, price: 72.99 }], total: 189.96, status: 'completed', paymentMethod: 'Credit Card' },
  { id: 's2', date: '2024-11-28', customerId: 'c1', customerName: 'Amelia Hart', products: [{ productId: 'p1', productName: 'Lavender Reed Diffuser', qty: 2, price: 28.99 }, { productId: 'p9', productName: 'Speckled Ceramic Vase - Large', qty: 1, price: 67.99 }], total: 125.97, status: 'completed', paymentMethod: 'PayPal' },
  { id: 's3', date: '2024-11-25', customerId: 'c7', customerName: 'Chloe Williams', products: [{ productId: 'p7', productName: 'Bohemian Kitchen Runner 60x180', qty: 1, price: 54.99 }, { productId: 'p13', productName: 'Sea Salt & Driftwood Candle', qty: 2, price: 34.99 }], total: 124.97, status: 'completed', paymentMethod: 'Credit Card' },
  { id: 's4', date: '2024-11-22', customerId: 'c8', customerName: 'Nathan Torres', products: [{ productId: 'p4', productName: 'Ultrasonic Cool Mist Humidifier', qty: 2, price: 89.99 }, { productId: 'p10', productName: 'Organic Form Vase - Set of 3', qty: 2, price: 89.99 }], total: 359.96, status: 'completed', paymentMethod: 'Bank Transfer' },
  { id: 's5', date: '2024-11-18', customerId: 'c8', customerName: 'Nathan Torres', products: [{ productId: 'p14', productName: 'Black Amber Candle - Luxury', qty: 4, price: 58.99 }], total: 235.96, status: 'completed', paymentMethod: 'Credit Card' },
  { id: 's6', date: '2024-11-15', customerId: 'c2', customerName: 'Marcus Chen', products: [{ productId: 'p5', productName: 'Warm & Cool Mist Humidifier', qty: 3, price: 119.99 }], total: 359.97, status: 'completed', paymentMethod: 'Credit Card' },
  { id: 's7', date: '2024-11-10', customerId: 'c3', customerName: 'Sofia Rosenberg', products: [{ productId: 'p11', productName: 'Mini Bud Vase - Blush', qty: 3, price: 24.99 }, { productId: 'p1', productName: 'Lavender Reed Diffuser', qty: 1, price: 28.99 }], total: 103.96, status: 'completed', paymentMethod: 'PayPal' },
  { id: 's8', date: '2024-11-05', customerId: 'c1', customerName: 'Amelia Hart', products: [{ productId: 'p3', productName: 'Rose & Oud Reed Diffuser', qty: 1, price: 42.99 }, { productId: 'p12', productName: 'Vanilla & Sandalwood Candle', qty: 2, price: 38.99 }], total: 120.97, status: 'completed', paymentMethod: 'Credit Card' },
  { id: 's9', date: '2024-11-01', customerId: 'c3', customerName: 'Sofia Rosenberg', products: [{ productId: 'p9', productName: 'Speckled Ceramic Vase - Large', qty: 1, price: 67.99 }], total: 67.99, status: 'pending', paymentMethod: 'Bank Transfer' },
  { id: 's10', date: '2024-10-28', customerId: 'c6', customerName: 'Oliver Blanc', products: [{ productId: 'p10', productName: 'Organic Form Vase - Set of 3', qty: 1, price: 89.99 }], total: 89.99, status: 'completed', paymentMethod: 'Credit Card' },
  { id: 's11', date: '2024-10-20', customerId: 'c7', customerName: 'Chloe Williams', products: [{ productId: 'p8', productName: 'Geometric Kitchen Runner 45x150', qty: 2, price: 44.99 }], total: 89.98, status: 'completed', paymentMethod: 'PayPal' },
  { id: 's12', date: '2024-10-15', customerId: 'c2', customerName: 'Marcus Chen', products: [{ productId: 'p6', productName: 'Mini Desktop Humidifier', qty: 5, price: 34.99 }], total: 174.95, status: 'completed', paymentMethod: 'Credit Card' },
  { id: 's13', date: '2024-10-08', customerId: 'c4', customerName: 'James Okafor', products: [{ productId: 'p15', productName: 'Citrus Burst Candle Trio', qty: 5, price: 72.99 }], total: 364.95, status: 'completed', paymentMethod: 'Bank Transfer' },
  { id: 's14', date: '2024-09-25', customerId: 'c5', customerName: 'Luna Patel', products: [{ productId: 'p2', productName: 'Eucalyptus Reed Diffuser', qty: 2, price: 32.99 }, { productId: 'p13', productName: 'Sea Salt & Driftwood Candle', qty: 1, price: 34.99 }], total: 100.97, status: 'refunded', paymentMethod: 'Credit Card' },
];

export const expenses: Expense[] = [
  { id: 'e1', date: '2024-11-28', category: 'Inventory', description: 'Reed diffuser stock reorder', amount: 480.00, vendor: 'AromaCo Wholesale' },
  { id: 'e2', date: '2024-11-20', category: 'Marketing', description: 'Instagram ads campaign - Nov', amount: 250.00, vendor: 'Meta Ads' },
  { id: 'e3', date: '2024-11-15', category: 'Shipping', description: 'Packing materials and boxes', amount: 145.80, vendor: 'PackRight Supplies' },
  { id: 'e4', date: '2024-11-10', category: 'Operations', description: 'Monthly storage unit rent', amount: 320.00, vendor: 'SafeStore Portland' },
  { id: 'e5', date: '2024-11-05', category: 'Inventory', description: 'Ceramic vase shipment', amount: 672.00, vendor: 'ArtCraft Imports' },
  { id: 'e6', date: '2024-11-01', category: 'Software', description: 'Shopify monthly subscription', amount: 79.00, vendor: 'Shopify' },
  { id: 'e7', date: '2024-10-25', category: 'Marketing', description: 'Product photography session', amount: 350.00, vendor: 'Studio Light Co.' },
  { id: 'e8', date: '2024-10-18', category: 'Inventory', description: 'Candle restocking order', amount: 840.00, vendor: 'SoyWax Direct' },
  { id: 'e9', date: '2024-10-10', category: 'Operations', description: 'Monthly storage unit rent', amount: 320.00, vendor: 'SafeStore Portland' },
  { id: 'e10', date: '2024-10-05', category: 'Shipping', description: 'Carrier fee top-up', amount: 88.40, vendor: 'FedEx Business' },
  { id: 'e11', date: '2024-09-30', category: 'Inventory', description: 'Humidifier bulk purchase', amount: 1560.00, vendor: 'ElectroHome Wholesale' },
  { id: 'e12', date: '2024-09-15', category: 'Software', description: 'Accounting software annual', amount: 180.00, vendor: 'QuickBooks' },
];

// Global mutators to simulate real database interactions
export const updateProductStock = (productId: string, deductedQty: number) => {
  const index = products.findIndex(p => p.id === productId);
  if (index !== -1) {
    products[index].stock -= deductedQty;
  }
};

export const updateCustomerStats = (customerId: string, amountSpent: number, date: string) => {
  const index = customers.findIndex(c => c.id === customerId);
  if (index !== -1) {
    customers[index].totalPurchases += 1;
    customers[index].totalSpent += amountSpent;
    customers[index].lastPurchase = date;
  }
};
