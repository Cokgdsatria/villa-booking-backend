const router = require("express").Router();
const controller = require("../controllers/properties.controller");
const { validateQuery } = require("../middlewares/validate");
const { searchPropertySchema } = require("../validations/property.validation");
const authMiddleware = require("../middlewares/auth.middleware");
const roleMiddleware = require("../middlewares/role.middleware");

router.get(
    "/search",
    validateQuery(searchPropertySchema),
    controller.searchProperties
);
router.get("/", controller.getList);
router.get("/:id", controller.getDetail);

router.post(
  "/",
  authMiddleware,
  roleMiddleware("OWNER"),
  controller.createProperty
);

module.exports = router;
