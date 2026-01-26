const router = require("express").Router();
const controller = require("../controllers/properties.controller");
const { validateQuery } = require("../middlewares/validate");
const { searchPropertySchema } = require("../validations/property.validation");

router.get(
    "/search",
    validateQuery(searchPropertySchema),
    controller.searchProperties
);
router.get("/", controller.getList);
router.get("/:id", controller.getDetail);

router.post("/", controller.createProperty);

module.exports = router;
