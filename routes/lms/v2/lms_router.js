const router = require("express").Router();

const {
  readLms,
  filteredData,
  upatedLeads,
  addRemarks,
  getRemarks,
  addLms,
} = require("../../../controllers/LMS/v2/lms_controller");
const middleware = require("../../../middleware/joi");
const schema = require("../../../schemas/lms/v2/lmsSchema");

router.get("/read", readLms);
router.post("/filter/read", middleware(schema.filteredRead), filteredData);
// router.post("/filter/read", filteredData);
router.post("/update/:LeadId", upatedLeads);
// router.post("/add-remakrs",addRemarks);
router.get("/get-remarks/:leadId", getRemarks);
router.post("/add", addLms);

module.exports = router;
