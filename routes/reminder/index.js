const router = require("express").Router();

router.use("/v1", require("./v1/reminder_router"));

module.exports = router;