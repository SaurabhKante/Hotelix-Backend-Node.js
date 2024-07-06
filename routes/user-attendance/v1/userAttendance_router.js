const router = require("express").Router();
const {postUserAttendance, updateUserAttendance} = require("../../../controllers/user-attendance/user-attendance-controller");

router.post("/post-user-attendance", postUserAttendance);
router.post("/update-user-attendance", updateUserAttendance);

module.exports = router;