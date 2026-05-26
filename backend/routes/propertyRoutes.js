const express = require("express");
const router = express.Router();
const controller = require("../controllers/propertyController");
const requirePermission = require("../middleware/requirePermission");
const authenticateToken = require("../middleware/authenticateToken");

router.get("/", controller.getAll);
router.get("/statistics", controller.stats);

router.post(
    "/start-generator",
    authenticateToken,
    requirePermission("CREATE_PROPERTY"),
    controller.startGenerator
);

router.post(
    "/stop-generator",
    authenticateToken,
    requirePermission("CREATE_PROPERTY"),
    controller.stopGenerator
);

router.get("/:id", controller.getById);

router.post(
    "/",
    authenticateToken,
    requirePermission("CREATE_PROPERTY"),
    controller.create
);

router.put(
    "/:id",
    authenticateToken,
    requirePermission("UPDATE_PROPERTY"),
    controller.update
);

router.delete(
    "/:id",
    authenticateToken,
    requirePermission("DELETE_PROPERTY"),
    controller.remove
);

module.exports = router;