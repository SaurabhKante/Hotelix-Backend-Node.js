const { getProfession } = require("../../../controllers/profession/profession");

const router = require("express").Router();

router.get("/get-all", getProfession);

module.exports = router;
