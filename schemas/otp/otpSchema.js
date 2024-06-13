const Joi = require("joi");
const schemas = {
  generateOTP: Joi.object().keys({
    vehicleProfileId: Joi.number().required(),
    typeMasterId: Joi.number().min(1).max(160).required(),
    mobileNumber: Joi.string().length(10).required(),
    leadName: Joi.string().min(2).required(),
  }),
};

module.exports = schemas;
