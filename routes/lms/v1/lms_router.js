const router = require("express").Router();
const {
  addLms,
  readLms,
  updateLms,
  deleteLms,
  leadStatus,
  statusRead,
  leadSourceDropdown,
  vehicleModelDropdown,
  nextFollowUp,
  leadStatusDropdowm,
  getFollowUp,
  specificFollowUp,
  searchByRegNoMobNo,
  assignLead,
  getUser,
  getFollowUpWalkInLeads,
  getProfession,
  getAllSubStages,
  createCallLog,
  getCallLogsByLeadId,
  createBulkCallLogForParticularLead,
  leadTypeDropDown,
  getLeadDataByLeadId,
  getFollowUpDataOfMissedTodayUpcoming,
  getSourceMediumDestinationCampaignDropDown,
  learningInstituteDropDown,
  classExtensionDropDown,
  openDematDropDown,
  paymentModeDropDown,
  paymentNumberDropDown,
  submitPaymentDetails,
  getPaymentHistory,
  getCallLogsByUserId,
} = require("../../../controllers/LMS/lms_controller");

const { bulkDataUpload } = require("../../../controllers/LMS/lms_bulk_upload");

const { leadHistory } = require("../../../controllers/LMS/lms_history");
const {
  costPerVehicle,
  costOfEachProduct,
  repairCriteriaStage,
  updateRepairCriteriaStage,
} = require("../../../controllers/LMS/lms_repair_criteria");

router.post("/add", addLms);
router.get("/read", readLms);
router.post("/update/:LeadId", updateLms);
router.get("/delete/:id", deleteLms);
router.post("/lead-status/:id/:status", leadStatus);
router.post("/assign-lead/:user", assignLead);
router.get("/get-user", getUser);
router.get("/read/:status", statusRead);
router.get("/lead-source", leadSourceDropdown);
router.get("/vehicle-model", vehicleModelDropdown);
router.post("/follow-up/:id/:date", nextFollowUp);
router.get("/lead-status", leadStatusDropdowm);
router.get("/get/follow-up", getFollowUp);
router.get("/follow-up/:date", specificFollowUp);
router.post("/bulk-upload", bulkDataUpload);
router.get("/searching/:data", searchByRegNoMobNo);
router.get("/lead-history/:id", leadHistory);
router.get("/lead-cost", costPerVehicle);
router.get("/each-question-cost", costOfEachProduct);
router.get("/repair-criteria-stage", repairCriteriaStage);
router.post("/update-stage", updateRepairCriteriaStage);
router.get("/get/follow-up/walk-in", getFollowUpWalkInLeads);
router.get("/get-profession", getProfession);
router.get("/get-sub-stages", getAllSubStages);
router.post("/create/call-logs", createCallLog);
router.get("/get/call-logs/:leadId", getCallLogsByLeadId);
router.post("/create/bulk/call-logs", createBulkCallLogForParticularLead);
// To get Types of Leads
router.get("/get/lead-types", leadTypeDropDown);
//getLead By LeadId
router.get("/get/lead-data/:leadId", getLeadDataByLeadId);
router.get("/fetch/follow-up-data/:type", getFollowUpDataOfMissedTodayUpcoming);
//Get Lead Source,Destination, Medium and Campaign dropdown
router.get(
  "/get/src-medium-dest-camp/:category",
  getSourceMediumDestinationCampaignDropDown
);
router.get("/get/learning-institute", learningInstituteDropDown);
router.get("/get/class-extension", classExtensionDropDown);
router.get("/get/open-demat", openDematDropDown);
router.get("/get/payment-mode", paymentModeDropDown);
router.get("/get/payment-number/:paymentMode", paymentNumberDropDown);
router.post("/submit/payment-details", submitPaymentDetails);
router.get("/get/payment-history/:id", getPaymentHistory);
router.post("/get-call-logs/:id", getCallLogsByUserId);

module.exports = router;
