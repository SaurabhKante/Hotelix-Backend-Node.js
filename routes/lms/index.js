const router = require("express").Router();

router.use("/v1", require("./v1/lms_router"));
router.use("/v2", require("./v2/lms_router"));
router.use("/v3", require("./v3/lms_router"));

module.exports = router;
