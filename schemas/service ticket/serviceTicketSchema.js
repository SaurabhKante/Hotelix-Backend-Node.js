const Joi = require("joi");
const schemas = {
  createTicket: Joi.object().keys({
    scheduled_time: Joi.string().required(),
    vehicle_profile_id: Joi.number().required(),
    service_type:Joi.number().required(),
    voc:Joi.array().required(),
  }),
  updateTicket: Joi.object().keys({
    assign_to: Joi.number(),
    scheduled_time: Joi.string(),
    device_id: Joi.number(),
    comments: Joi.string().required(),
    images: Joi.array().items(Joi.string()),
    delivered_time: Joi.string(),
    status: Joi.number(),
  }),
  getTypes: Joi.object().keys({
    category: Joi.string().required(),
  }),
  getAllTickets: Joi.object().keys({
    status: Joi.number().required(),
  }),
  stageMasterGeneric: Joi.object().keys({
    parentId: Joi.number().required(),
  }),
  idParam: Joi.object().keys({
    id: Joi.number().required(),
  }),
  sendOtp: Joi.object().keys({
    otp: Joi.number().required(),
    mobilenumber: Joi.string().pattern(/^[0-9]{10}$/),
  }),
};

module.exports = schemas;
