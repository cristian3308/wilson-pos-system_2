export interface Product {
  id: string;
  name: string;
  price: number;
  category: string;
  stock: number;
  barcode?: string;
  description?: string;
  image?: string;
}

export interface Sale {
  id: string;
  products: SaleItem[];
  total: number;
  subtotal: number;
  tax: number;
  discount: number;
  paymentMethod: 'cash' | 'card' | 'transfer';
  timestamp: string;
  cashierName: string;
}

export interface SaleItem {
  productId: string;
  productName: string;
  quantity: number;
  unitPrice: number;
  total: number;
}

export interface Customer {
  id: string;
  name: string;
  email?: string;
  phone?: string;
  totalPurchases: number;
  lastPurchase?: string;
}

// Sample data
export const sampleProducts: Product[] = [
  {
    id: '1',
    name: 'Café Espresso',
    price: 2500,
    category: 'Bebidas',
    stock: 50,
    barcode: '7891234567890',
    description: 'Café espresso tradicional',
  },
  {
    id: '2',
    name: 'Sandwich de Pollo',
    price: 8500,
    category: 'Comida',
    stock: 25,
    barcode: '7891234567891',
    description: 'Sandwich de pollo con vegetales',
  },
  {
    id: '3',
    name: 'Agua Mineral',
    price: 1500,
    category: 'Bebidas',
    stock: 100,
    barcode: '7891234567892',
    description: 'Agua mineral natural 500ml',
  },
  {
    id: '4',
    name: 'Brownie de Chocolate',
    price: 3500,
    category: 'Postres',
    stock: 15,
    barcode: '7891234567893',
    description: 'Brownie casero con chocolate',
  },
  {
    id: '5',
    name: 'Ensalada César',
    price: 12000,
    category: 'Comida',
    stock: 10,
    barcode: '7891234567894',
    description: 'Ensalada césar con pollo',
  }
];

export const sampleSales: Sale[] = [
  {
    id: 'sale-001',
    products: [
      {
        productId: '1',
        productName: 'Café Espresso',
        quantity: 2,
        unitPrice: 2500,
        total: 5000
      },
      {
        productId: '4',
        productName: 'Brownie de Chocolate',
        quantity: 1,
        unitPrice: 3500,
        total: 3500
      }
    ],
    subtotal: 8500,
    tax: 1615,
    discount: 0,
    total: 10115,
    paymentMethod: 'card',
    timestamp: new Date(Date.now() - 1000 * 60 * 30).toISOString(), // 30 minutos atrás
    cashierName: 'Demo User'
  },
  {
    id: 'sale-002',
    products: [
      {
        productId: '2',
        productName: 'Sandwich de Pollo',
        quantity: 1,
        unitPrice: 8500,
        total: 8500
      },
      {
        productId: '3',
        productName: 'Agua Mineral',
        quantity: 1,
        unitPrice: 1500,
        total: 1500
      }
    ],
    subtotal: 10000,
    tax: 1900,
    discount: 500,
    total: 11400,
    paymentMethod: 'cash',
    timestamp: new Date(Date.now() - 1000 * 60 * 60 * 2).toISOString(), // 2 horas atrás
    cashierName: 'Demo User'
  }
];

export const sampleCustomers: Customer[] = [
  {
    id: 'customer-001',
    name: 'María González',
    email: 'maria@example.com',
    phone: '300-123-4567',
    totalPurchases: 125000,
    lastPurchase: new Date(Date.now() - 1000 * 60 * 60 * 24).toISOString()
  },
  {
    id: 'customer-002',
    name: 'Carlos Pérez',
    email: 'carlos@example.com',
    phone: '300-987-6543',
    totalPurchases: 85000,
    lastPurchase: new Date(Date.now() - 1000 * 60 * 60 * 48).toISOString()
  },
  {
    id: 'customer-003',
    name: 'Ana Rodríguez',
    phone: '300-555-1234',
    totalPurchases: 65000,
    lastPurchase: new Date(Date.now() - 1000 * 60 * 60 * 72).toISOString()
  }
];