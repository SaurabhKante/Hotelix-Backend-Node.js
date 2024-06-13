const router = require("express").Router();

const { addGtUser, updateGtUser, getUser, getAllUsers, deactivateUser, reActivateUser, getRoles, getSystems, assignRole, removeUserRoles, getUserBySystemMasterAndRoles } = require("../../../controllers/GT_user/GT_user");

router.post("/user/add", addGtUser);
router.post("/user/update/:id", updateGtUser);
router.get("/user/:id", getUser);
router.get("/get-all-users", getAllUsers);
router.patch("/user/deactivate-user", deactivateUser);
router.patch("/user/reactivate-user", reActivateUser);
router.get("/get-systems", getSystems);
router.get("/get-roles", getRoles);
router.post("/assign-roles/:userId", assignRole);
router.delete("/user/remove-role/:id", removeUserRoles);
router.get("/get/:systemMaster/:roles", getUserBySystemMasterAndRoles);

module.exports = router;
