const router = require("express").Router();
const controller = require("../controllers/properties.controller");
const { validateQuery } = require("../middlewares/validate");
const { searchPropertySchema } = require("../validations/property.validation");
const authMiddleware = require("../middlewares/auth.middleware");
const roleMiddleware = require("../middlewares/role.middleware");
const upload = require("../middlewares/upload.middleware");

router.get(
    "/search",
    validateQuery(searchPropertySchema),
    controller.searchProperties
);
router.get(
  "/owner",
  authMiddleware,
  roleMiddleware("OWNER"),
  controller.getOwnerProperties
);
router.get("/", controller.getList);
router.get("/:id", controller.getDetail);

router.post(
  "/",
  authMiddleware,
  roleMiddleware("OWNER"),
  controller.createProperty
);

router.post(
  "/:id/photos",
  authMiddleware,
  roleMiddleware("OWNER"),
  upload.array("photos", 10), //maks 10 foto
  controller.uploadPhotos
);

router.put(
  "/:id",
  authMiddleware,
  roleMiddleware("OWNER"),
  controller.updateProperty
)

module.exports = router;
