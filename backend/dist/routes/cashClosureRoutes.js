"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const CashClosureController_1 = require("../controllers/CashClosureController");
const router = (0, express_1.Router)();
router.post('/cash-closures', CashClosureController_1.CashClosureController.createClosure);
router.get('/cash-closures', CashClosureController_1.CashClosureController.getClosures);
router.get('/cash-closures/last', CashClosureController_1.CashClosureController.getLastClosure);
router.get('/cash-closures/stats', CashClosureController_1.CashClosureController.getClosureStats);
router.get('/cash-closures/:id', CashClosureController_1.CashClosureController.getClosureById);
router.delete('/cash-closures/clear-all', CashClosureController_1.CashClosureController.clearAllClosures);
exports.default = router;
//# sourceMappingURL=cashClosureRoutes.js.map