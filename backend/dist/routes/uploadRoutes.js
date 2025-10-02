"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const authMiddleware_1 = require("../middleware/authMiddleware");
const router = express_1.default.Router();
router.post('/image', authMiddleware_1.authMiddleware, (req, res) => {
    res.json({ message: 'Upload image - Implementation pending' });
});
router.post('/document', authMiddleware_1.authMiddleware, (req, res) => {
    res.json({ message: 'Upload document - Implementation pending' });
});
router.delete('/:fileId', authMiddleware_1.authMiddleware, (req, res) => {
    res.json({ message: `Delete file ${req.params.fileId} - Implementation pending` });
});
exports.default = router;
//# sourceMappingURL=uploadRoutes.js.map