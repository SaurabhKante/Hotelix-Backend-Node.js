const router = require("express").Router();
const {
  readLmsv3,
  getUser,
  addLeadInBulk,
  deleteLead,
  getConversionData,
  addNewPayment,
  getTotalLeadData,
  getPaymentSummaryData,
  addLeadPayment,
  updateLead,
  DropDownList,
  getIncentiveData,
  insertIncentiveData,
  // exportLeadsToExcel
} = require("../../../controllers/LMS/v3/lms_controller");

router.get("/read", readLmsv3);
router.get("/get-user", getUser);
router.post("/add", addLeadInBulk);
router.delete("/disable/:id", deleteLead);
router.post("/get-conversion-data", getConversionData);
router.post("/get-totallead-data", getTotalLeadData);
router.post("/get-payment-summary-data", getPaymentSummaryData);
router.post("/add-new-payment", addNewPayment);
router.post("/add-lead-payment", addLeadPayment);
router.post("/update", updateLead);
router.post("/incentive", getIncentiveData);
router.post("/insert-incentive", insertIncentiveData);
router.get("/get-all-dropdowns", DropDownList);
// router.post("/export", exportLeadsToExcel);

module.exports = router;
