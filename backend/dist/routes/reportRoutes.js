"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const authMiddleware_1 = require("../middleware/authMiddleware");
const router = express_1.default.Router();
router.get('/dashboard', authMiddleware_1.authMiddleware, (req, res) => {
    res.json({ message: 'Get dashboard report - Implementation pending' });
});
router.get('/revenue', authMiddleware_1.authMiddleware, (req, res) => {
    res.json({ message: 'Get revenue report - Implementation pending' });
});
router.get('/parking', authMiddleware_1.authMiddleware, (req, res) => {
    res.json({ message: 'Get parking report - Implementation pending' });
});
router.get('/carwash', authMiddleware_1.authMiddleware, (req, res) => {
    res.json({ message: 'Get carwash report - Implementation pending' });
});
router.get('/employees', authMiddleware_1.authMiddleware, (req, res) => {
    res.json({ message: 'Get employee report - Implementation pending' });
});
exports.default = router;
//# sourceMappingURL=reportRoutes.js.map