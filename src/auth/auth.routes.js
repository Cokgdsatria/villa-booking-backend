const router = require("express").Router();
const controller = require("./auth.controller");
const { validateBody } = require("../middlewares/validate");
const { loginSchema, registerSchema } = require("./auth.validation");

router.post("/login", validateBody(loginSchema), controller.login);
router.post("/register", validateBody(registerSchema), controller.register); 

module.exports = router;
