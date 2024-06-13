const router = require("express").Router();

const { getCountryDropDown } = require("../../../controllers/country/country");

router.get("/get/all", getCountryDropDown);
module.exports = router;
