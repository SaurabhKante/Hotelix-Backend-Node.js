const router = require("express").Router();

const { addReminder } = require("../../../controllers/reminder/reminder_controller");

router.post("/add-reminder", addReminder);
module.exports = router;