const router = require("express").Router();
const {
  addState,
  editState,
  addCity,
  editCity,
  getState,
  getCity,
} = require("../../../controllers/state_city_controller/state_city");

router.post("/add", addState);
router.post("/edit/:id", editState);
router.post("/city/add/:id", addCity);
router.post("/city/edit/:id", editCity);
router.get("/get/:id/state", getState);
router.get("/get/:id/city", getCity);

module.exports = router;
