const router = require("express").Router();

router.use("/v1", require("./v1/mobile_number_router"));

module.exports = router;