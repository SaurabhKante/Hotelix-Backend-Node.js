const router = require("express").Router();

router.use("/v1", require("./v1/country"));

module.exports = router;
