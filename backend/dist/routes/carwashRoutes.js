"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const CarwashController_1 = require("../controllers/CarwashController");
const authMiddleware_1 = require("../middleware/authMiddleware");
const router = express_1.default.Router();
const carwashController = new CarwashController_1.CarwashController();
router.get('/services', async (req, res) => {
    await carwashController.getServices(req, res);
});
router.post('/orders', async (req, res) => {
    await carwashController.createOrder(req, res);
});
router.get('/orders', async (req, res) => {
    await carwashController.getOrders(req, res);
});
router.put('/orders/:id/status', async (req, res) => {
    await carwashController.updateOrderStatus(req, res);
});
router.get('/stats', async (req, res) => {
    await carwashController.getCarwashStats(req, res);
});
router.post('/services', authMiddleware_1.authMiddleware, (req, res) => {
    res.json({ message: 'Services are pre-configured. Use GET /services to retrieve them.' });
});
exports.default = router;
//# sourceMappingURL=carwashRoutes.js.map