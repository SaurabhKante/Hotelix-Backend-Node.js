const Joi = require("joi");
const schemas = {
  getClientDevices: Joi.object().keys({
    id: Joi.number().required(),
  }),
};

module.exports = schemas;
