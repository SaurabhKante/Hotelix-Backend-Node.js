const router = require("express").Router();
const { getAllNumbers, addNumberToBlock, addNumberToActive } = require("../../../controllers/mobile_number/mobile_number_controller");

router.post("/get-all-numbers", getAllNumbers);
router.post("/add-number-block", addNumberToBlock);
router.post("/add-number-active", addNumberToActive);


module.exports = router;