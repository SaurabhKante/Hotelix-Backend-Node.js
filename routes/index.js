const router = require("express").Router();
const role = require(".././middleware/role");

router.use("/api/vehicle-brand", require("./vehicle-brand_api"));
// router.use("/api/rider", require("./rider_api"));
// router.use("/api/vehicle", require("./vehicle_api"));
// router.use("/api/notification", require("./notification_api"));
// router.use("/api/rider-stats", require("./rider_stats"));
router.use(
  "/api/lms",
  (req, res, next) => role(req, res, next, [3, 5]),
  require("./lms")
);
router.use("/api/state", require("./state"));
router.use("/api/vehicle", require("./vehicle_api"));
// router.use("/api/inspection", require("./inspection_api/index"));
// router.use("/api/hrc", require("./HRC"));
// router.use("/api/mails", require("./mail_api"));
// router.use("/api/sms", require("./sms_api"));
router.use("/api/GT_users", require("./GT_user"));
// router.use("/api/vehicle-manual-testing", require("./Vehicle_manual_testing"));
// router.use("/api/transit-ops", require("./transit_ops"));
router.use("/api/role", require("./Role"));
router.use("/api/website", require("./website"));
// router.use("/api/service-history", require("./services"));
// router.use("/api/analytics", require("./analytics"));
router.use("/api/gender", require("./gender"));
// router.use("/api/remote-lock", require("./remote-lock"));
// router.use("/api/shipping", require("./shipping_methods"));
// router.use("/api/sow", require("./sow"));
// router.use("/api/customer-consent", require("./customer_consent"));
router.use("/api/country", require("./country"));
// router.use("/api/bank", require("./bank"));
router.use("/api/whatsapp", require("./whatsapp"));
router.use("/api/profession", require("./profession"));
// router.use("/api/customer", require("./customer"));
// router.use("/api/ota", require("./ota"));
// router.use("/api/alerts", require("./alerts"));
// router.use("/api/otp", require("./otp"));
// router.use("/api/client", require("./client"));
module.exports = router;
