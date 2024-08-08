const router = require("express").Router();
const {
  postUserAttendance,
  updateUserAttendance,
  getUserAttendance,
//   vehicleModelDropdown,
} = require("../../../controllers/user-attendance/user-attendance-controller");

router.post("/post-user-attendance", postUserAttendance);
router.post("/update-user-attendance", updateUserAttendance);
router.post("/get-user-attendance", getUserAttendance);

// router.post("/vehicle-model", vehicleModelDropdown);

module.exports = router;
