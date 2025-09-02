const router = require("express").Router();
// const role = require(".././middleware/role");


// router.use(
//   "/api/lms",
//   (req, res, next) => role(req, res, next, [3, 5]),
//   require("./lms")
// );
// router.use(
//   "/api/reminder",
//   (req, res, next) => role(req, res, next, [3, 5]),
//   require("./reminder")
// );


router.use("/api/tables", require("./table"));
router.use("/api/dishes", require("./dish"));
router.use("/api/orders", require("./order"));
router.use("/api/expense", require("./expense"));

module.exports = router;
