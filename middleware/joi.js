const joi = require("joi");
const { validationFailed } = require("../utils/response");
// const middleware = (schema, property) => {
//   return (req, res, next) => {
//     const { error } = schema.validate(req.body);
//     const valid = error == null;

//     if (valid) {
//       next();
//     } else {
//       const { details } = error;
//       const message = details.map((i) => i.message).join(",");

//       console.log("error", message);
//       res.status(422).json({ error: message });
//     }
//   };
// };

const middleware = (bodySchema, paramSchema) => {
  return (req, res, next) => {
    const customMessages = {
      "string.base": "{{#label}} should be a type of text",
      "string.alphanum": "{{#label}} should only contain alpha-numeric characters",
      "string.min": "{{#label}} should have a minimum length of {#limit}",
      "string.max": "{{#label}} should have a maximum length of {#limit}",
      "string.email": "{{#label}} should be a valid email address",
      "string.pattern.base": "{{#label}} should follow the specified pattern",
    };

    const options = {
      abortEarly: false,
      messages: customMessages,
      // allowUnknown: true 
    };
    // Validate req.params if it exists
    if (paramSchema) {
      const paramValidationResult = paramSchema.validate(req.params, options);
      if (paramValidationResult.error) {
        const paramError = paramValidationResult.error.details.map((i) => i.message).join(",");
        return validationFailed(res, "Validation Failed", paramError);
      }
    }

    // Validate req.body if it exists
    if (bodySchema) {
      const bodyValidationResult = bodySchema.validate(req.body, options);
      if (bodyValidationResult.error) {
        const bodyError = bodyValidationResult.error.details.map((i) => i.message).join(",");
        return validationFailed(res, "Validation Failed", bodyError);
      }
    }

    // Both validations passed, continue to the next middleware
    next();
  };
};

module.exports = middleware;
