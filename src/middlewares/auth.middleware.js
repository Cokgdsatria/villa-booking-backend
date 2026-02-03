const jwt = require("../utils/jwt");

module.exports = (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return res.status(401).json({ 
        status: "error",
        message: "Unauthorized" 
      });
    }

    const token = authHeader.split(" ")[1];

    req.user = jwt.verify(token);
    next();
  } catch (error) {
    return res.status(401).json({ 
      status: "error",
      message: "Invalid token" 
    });
  }
};
