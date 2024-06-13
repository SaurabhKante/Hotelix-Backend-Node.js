const router = require("express").Router();

const { findRole } = require("../../../controllers/Role/role");

router.get("/get-roles", findRole);

module.exports = router;
