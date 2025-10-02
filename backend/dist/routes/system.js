"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const SystemController_1 = require("../controllers/SystemController");
const router = (0, express_1.Router)();
const systemController = new SystemController_1.SystemController();
router.get('/test', systemController.testConnection.bind(systemController));
router.get('/system/info', systemController.getSystemInfo.bind(systemController));
exports.default = router;
//# sourceMappingURL=system.js.map