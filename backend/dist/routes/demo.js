"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const DemoController_1 = require("../controllers/DemoController");
const router = (0, express_1.Router)();
const demoController = new DemoController_1.DemoController();
router.get('/demo/products', demoController.getProducts.bind(demoController));
router.get('/demo/sales', demoController.getSales.bind(demoController));
router.get('/demo/customers', demoController.getCustomers.bind(demoController));
router.get('/demo/dashboard-stats', demoController.getDashboardStats.bind(demoController));
router.get('/dashboard', demoController.getDashboardStats.bind(demoController));
exports.default = router;
//# sourceMappingURL=demo.js.map