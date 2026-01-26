const router = require("express").Router();

router.use("/auth", require("../auth/auth.routes"));
router.use("/properties", require("./properties.routes"));
router.use("/inquiries", require("./inquiries.routes"));
router.use("/meta", require("./meta.routes"));

module.exports = router;
