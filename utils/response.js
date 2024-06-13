//for json response

module.exports = {
  success: (res, msg, data) => {
    return res.status(200).json({
      SUCCESS: true,
      MESSAGE: msg,
      DATA: data,
    });
  },

  success: (res, msg, data, pagination, count) => {
    return res.status(200).json({
      SUCCESS: true,
      MESSAGE: msg,
      DATA: data,
      PAGINATION: pagination,
      COUNT: count,
    });
  },

  failure: (res, msg, err) => {
    return res.status(500).json({
      SUCCESS: false,
      MESSAGE: msg,
      DATA: err,
    });
  },

  unauthorized: (res, msg, err) => {
    return res.status(401).json({
      SUCCESS: false,
      MESSAGE: msg,
      DATA: err,
    });
  },

  created: (res, msg, data) => {
    return res.status(201).json({
      SUCCESS: true,
      MESSAGE: msg,
      DATA: data,
    });
  },
  recordUpdated: (res, msg, data) => {
    return res.status(202).json({
      SUCCESS: true,
      MESSAGE: msg,
      DATA: data,
    });
  },

  validationFailed: (res, msg, data) => {
    return res.status(422).json({
      SUCCESS: false,
      MESSAGE: msg,
      DATA: data,
    });
  },
};
