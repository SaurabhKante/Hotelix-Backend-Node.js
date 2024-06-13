const router = require("express").Router();
const { addLms } = require("../../../controllers/website/website");

router.post("/contact-us", addLms);

module.exports = router;
