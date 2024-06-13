const Joi = require("joi");
const schemas = {
  captureCustomerResponse: Joi.object().keys({
    acknowledge_status: Joi.number().valid(-1,0,1).required(),
    acknowledge_status_time: Joi.date().required(),
    last_notification_sent: Joi.date().required(),
    version: Joi.string().required(),
    updated_status: Joi.number().valid(0,1),
    updated_status_time: Joi.date(),
  }),
  updateCustomerResponse: Joi.object().keys({
    acknowledge_status:Joi.number().valid(-1,0,1).required(),
    acknowledge_status_time: Joi.date().required(),
    last_notification_sent: Joi.date().required(),
    version: Joi.string().required(),
    updated_status: Joi.number().valid(0, 1).required(),
    updated_status_time: Joi.date().required()
  }),
  checkMobile:Joi.object().keys({
    MobileNumber:Joi.string().pattern(/^[0-9]{10}$/).required()
  })

};
module.exports = schemas;
