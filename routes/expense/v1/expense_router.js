const { getAllVendors, addObject, getObjectsByDateRange } = require("../../../controllers/expense/expense_controller");

const router = require("express").Router();


router.get("/get-vendors", getAllVendors);
router.post("/add-object", addObject);
router.post("/get-object", getObjectsByDateRange);

module.exports = router;
