"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.sampleCustomers = exports.sampleSales = exports.sampleProducts = void 0;
exports.sampleProducts = [
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
exports.sampleSales = [
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
        timestamp: new Date(Date.now() - 1000 * 60 * 30).toISOString(),
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
        timestamp: new Date(Date.now() - 1000 * 60 * 60 * 2).toISOString(),
        cashierName: 'Demo User'
    }
];
exports.sampleCustomers = [
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
//# sourceMappingURL=sampleData.js.map