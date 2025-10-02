"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const AuthController_1 = __importDefault(require("../controllers/AuthController"));
const authValidator_1 = require("../validators/authValidator");
const authMiddleware_1 = require("../middleware/authMiddleware");
const router = express_1.default.Router();
router.post('/register', authValidator_1.authValidator.register, AuthController_1.default.register);
router.post('/login', authValidator_1.authValidator.login, AuthController_1.default.login);
router.post('/refresh', AuthController_1.default.refreshToken);
router.post('/logout', AuthController_1.default.logout);
router.get('/profile', authMiddleware_1.authMiddleware, AuthController_1.default.getProfile);
router.put('/profile', authMiddleware_1.authMiddleware, authValidator_1.authValidator.updateProfile, AuthController_1.default.updateProfile);
router.post('/change-password', authMiddleware_1.authMiddleware, authValidator_1.authValidator.changePassword, AuthController_1.default.changePassword);
exports.default = router;
//# sourceMappingURL=authRoutes.js.map