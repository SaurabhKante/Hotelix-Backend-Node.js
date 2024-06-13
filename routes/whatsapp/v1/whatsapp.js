const { createLead, insertContact, captureInterests } = require("../../../controllers/whatsapp/whatsapp_controller");

const router = require("express").Router();

router.post("/lead-generation", createLead);
router.post("/insert-contact", insertContact);
router.post("/campaigns/capture-interests", captureInterests);

module.exports = router;
