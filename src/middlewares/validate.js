const validateBody = (schema) => (req, res, next) => {
  try {
    const result = schema.parse(req.body);
    req.body = result;
    next();
  } catch (error) {
    return res.status(400).json({
      status: "error",
      message: "Invalid request body",
      errors: error.errors,
    });
  }
};

const validateQuery = (schema) => (req, res, next) => {
  try {
    const result = schema.parse(req.query);
    req.query = result;
    next();
  } catch (error) {
    return res.status(400).json({
      status: "error",
      message: "Invalid query parameters",
      errors: error.errors,
    });
  }
};

module.exports = {
  validateBody,
  validateQuery,
};
