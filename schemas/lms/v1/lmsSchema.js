const Joi = require("joi");
const schemas = {
  addLead: Joi.object().keys({
    LeadStatus: Joi.number(),
    LeadSourceId: Joi.number().min(1).max(15).valid().required(),
    LeadName: Joi.string().required(),
    MobileNumber: Joi.string()
      .pattern(/^[0-9]{10}$/)
      .required(),
    Gender: Joi.number().valid(1, 2, 3),
    WhatsAppNo: Joi.string()
      .pattern(/^[0-9]{10}$/)
      .required(),
    VehicleRegistrationNumber: Joi.string(),
    CityId: Joi.number(),
    City: Joi.string(),
    NextFollowUp: Joi.string(),
    Email: Joi.string().email(),
    Comments: Joi.string()
      .min(2)
      .max(1000)
      .pattern(/^\S.*\S$/),
    VehicleModelId: Joi.number(),
    DateOfBirth: Joi.string(),
    Profession: Joi.number(),
    AnnualIncome: Joi.number(),
    BookedAmount: Joi.number(),
    SellingPrice: Joi.number(),
    VehicleProfile: Joi.number(),
    LeadTypeId: Joi.number().valid(1, 2, 127),
    Rear_Wheel_Id: Joi.number().valid(1, 2),
    inspectionDate: Joi.string().regex(/^\d{4}-\d{2}-\d{2} \d{2}:\d{2}:\d{2}$/),
  }),
};
module.exports = schemas;
