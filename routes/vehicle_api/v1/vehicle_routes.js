const router = require("express").Router();
const middleware = require("../../../middleware/joi");
const schema = require("../../../schemas/vehicle/vehicle");
const {
  vehicleProfile,
  getVehicleById,
  updateismodified,
  updateVehileStageById,
  addVehicleProfile,
  getLocationByDeviceId,
  getVehicleByDeviceId,
  getSOCandFGByDeviceId,
  getFirstPacketByDeviceId,
  getVehicleStage,
  getAllRegNo,
  getRearWheelType,
  getVehicleModels,
  getVehicleStageInfo,
  updateVehicleProfile,
  dropVehicleProfile,
  vehicleProfileStage,
  getStageWiseVehiclesData,
  getUpcomingVehicleForCurrentStage,
  getAwaitingApprovalVehicle,
  getVehicleInspectionsStatus,
  getDeviceIdAndBatteryId
} = require("../../../controllers/vehicle_controller/vehicle_controller");

router.get("/all-vehicle", vehicleProfile);
router.get("/get/:id", getVehicleById);
router.post("/is-modified/:id", updateismodified);
router.post("/modified-status/:id/:value", updateVehileStageById);
router.post("/add", addVehicleProfile);
router.get("/iot-data/:Did", getLocationByDeviceId);
router.get("/get-vehicle/:deviceId", getVehicleByDeviceId);
router.get("/iot-data/get-soc-fg/:Did", getSOCandFGByDeviceId);
router.get("/iot-data/first-packet/:deviceId", getFirstPacketByDeviceId);
router.get("/get-vehicle-stage/:regNo", getVehicleStage);
router.get("/get-all-reg-no", getAllRegNo);
router.get("/get-rear-wheel-type", getRearWheelType);
router.get("/get-vehicle-models", getVehicleModels);
router.get("/get-vehicle-status/:regno", getVehicleStageInfo);
router.patch("/update/:id", updateVehicleProfile);
router.patch("/drop-vehicle/:id", dropVehicleProfile);
router.get("/get-stage/:stageCategory", vehicleProfileStage);
router.get("/get-vehicles/:subStage/:stage", getStageWiseVehiclesData);
router.get("/get-upcoming-vehicles/:currentStage/:previousStageId", getUpcomingVehicleForCurrentStage);
router.get("/pending/repair-criteria", getAwaitingApprovalVehicle);
router.get("/get-vehicle-inps-status/:inspType", middleware("",schema.typemasterIdParam), getVehicleInspectionsStatus);
router.get("/get-deviceId-batteryId/:vehicleId",getDeviceIdAndBatteryId);

module.exports = router;
