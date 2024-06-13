const Joi = require("joi");
const schemas = {
  adduser: Joi.object().keys({
    Email: Joi.string().email().required(),
    Username:  Joi.string().required(),
    MobileNumber:Joi.string().pattern(/^[0-9]{10}$/).required(),
  }),
  updateUser:Joi.object().keys({
    Email: Joi.string().email(),
    Username:  Joi.string(),
    MobileNumber:Joi.string().pattern(/^[0-9]{10}$/),
    RoleId: Joi.number().required(),
  }),
  idParam:Joi.object().keys({
    id:Joi.number().required()
  }),
  deactivateUser:Joi.object().keys({
    email: Joi.string().email().required()
  }),
  assignRole:Joi.object().pattern(
    /^[1-9][0-9]*$/,
    Joi.array().items(Joi.number().required())
  ),
  userIdParam:Joi.object().keys({
userId:Joi.number().required()
  })
};

module.exports = schemas;
