const Joi = require("joi");
const schemas = {
  typemasterIdParam:Joi.object().keys({
inspType:Joi.number().valid(53,54,74,79,80,142).required()
  })
};

module.exports = schemas;
