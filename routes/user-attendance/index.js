const router = require("express").Router();

router.use("/v1", require("./v1/userAttendance_router"));

module.exports = router;