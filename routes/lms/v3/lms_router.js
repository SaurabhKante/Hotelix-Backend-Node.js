const router = require("express").Router();
const {
  readLmsv3,
  getUser,
  addLeadInBulk,
  deleteLead,
} = require("../../../controllers/LMS/v3/lms_controller");

router.get("/read", readLmsv3);
router.get("/get-user", getUser);
router.post("/add", addLeadInBulk);
router.delete("/disable/:id", deleteLead);

module.exports = router;
