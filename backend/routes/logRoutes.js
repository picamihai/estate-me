const express = require("express");
const router = express.Router();

const controller = require("../controllers/logController");
const authenticateToken = require("../middleware/authenticateToken");
const requireAdmin = require("../middleware/requireAdmin");

router.get("/", authenticateToken, requireAdmin, controller.getLogs);
router.get("/observations", authenticateToken, requireAdmin, controller.getObservationList);
router.put("/observations/:id/resolve", authenticateToken, requireAdmin, controller.resolveObservation);

module.exports = router;