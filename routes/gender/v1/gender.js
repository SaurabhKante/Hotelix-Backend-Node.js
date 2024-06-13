const { genderDropdown } = require("../../../controllers/gender/gender_controller");

const router = require("express").Router();

router.get("/get", genderDropdown);

module.exports = router;
