"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const ParkingController_1 = require("../controllers/ParkingController");
const authMiddleware_1 = require("../middleware/authMiddleware");
const router = express_1.default.Router();
const parkingController = new ParkingController_1.ParkingController();
router.post('/entry', async (req, res) => {
    await parkingController.registerEntry(req, res);
});
router.post('/exit', async (req, res) => {
    await parkingController.processExit(req, res);
});
router.get('/active', async (req, res) => {
    await parkingController.getActiveVehicles(req, res);
});
router.get('/history', async (req, res) => {
    await parkingController.getParkingHistory(req, res);
});
router.get('/stats', async (req, res) => {
    await parkingController.getParkingStats(req, res);
});
router.get('/spots', authMiddleware_1.authMiddleware, (req, res) => {
    res.json({ message: 'Use /active endpoint instead' });
});
router.post('/spots', authMiddleware_1.authMiddleware, (req, res) => {
    res.json({ message: 'Use /entry endpoint instead' });
});
router.get('/tickets', authMiddleware_1.authMiddleware, (req, res) => {
    res.json({ message: 'Use /history endpoint instead' });
});
router.post('/tickets', authMiddleware_1.authMiddleware, (req, res) => {
    res.json({ message: 'Use /entry endpoint instead' });
});
router.put('/tickets/:id/exit', authMiddleware_1.authMiddleware, (req, res) => {
    res.json({ message: 'Use /exit endpoint instead' });
});
exports.default = router;
//# sourceMappingURL=parkingRoutes.js.map