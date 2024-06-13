const router = require("express").Router();
const {
  showAllvehicleBrand,
  getBrand,
  getModel,
  addBrand,
  addModel,
} = require("../../../controllers/vehicle_brand_controller/vehicle_brand_controller");

router.post("/brand/add", addBrand);
router.post("/model/add/:id", addModel);
router.get("/:id/model", getModel);
router.get("/brand/get", getBrand);
router.get("/:model", showAllvehicleBrand);

module.exports = router;
