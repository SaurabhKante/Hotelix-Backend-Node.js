const Joi = require("joi");
const schemas = {
  createNewUser: Joi.object().keys({
    UserName: Joi.string().min(2).required(),
    Email: Joi.string().email().required(),
    phoneNumber: Joi.string().length(10).required(),
    leadId: Joi.number().required(),
  }),
};

module.exports = schemas;
