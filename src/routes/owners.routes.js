const router = require("express").Router();
const controller = require("../controllers/owners.controller");

router.post("/", controller.createOwner);

module.exports = router;
