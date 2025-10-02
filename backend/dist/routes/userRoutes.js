"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const authMiddleware_1 = require("../middleware/authMiddleware");
const router = express_1.default.Router();
router.get('/', authMiddleware_1.authMiddleware, (req, res) => {
    res.json({ message: 'Get all users - Implementation pending' });
});
router.get('/:id', authMiddleware_1.authMiddleware, (req, res) => {
    res.json({ message: `Get user ${req.params.id} - Implementation pending` });
});
router.put('/:id', authMiddleware_1.authMiddleware, (req, res) => {
    res.json({ message: `Update user ${req.params.id} - Implementation pending` });
});
router.delete('/:id', authMiddleware_1.authMiddleware, (req, res) => {
    res.json({ message: `Delete user ${req.params.id} - Implementation pending` });
});
exports.default = router;
//# sourceMappingURL=userRoutes.js.map