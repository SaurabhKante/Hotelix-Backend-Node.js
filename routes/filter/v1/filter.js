const router = require("express").Router();

const {
  getFilterData,
} = require("../../../controllers/filter/filterController");

router.post("/fetch", getFilterData);
module.exports = router;
