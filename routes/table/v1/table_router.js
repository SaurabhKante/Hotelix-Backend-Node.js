const router = require("express").Router();
const {
  addTable,
  getAllTables,

} = require("../../../controllers/table/table_controller");



router.post("/add", addTable);
router.get("/get-all-tables", getAllTables);


module.exports = router;
