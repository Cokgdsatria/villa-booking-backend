const jwt = require("../utils/jwt");

module.exports = (req, res, next) => {
  try {
    const token = req.headers.authorization?.split(" ")[1];
    if (!token) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    req.user = jwt.verify(token);
    next();
  } catch (error) {
    return res.status(401).json({ message: "Invalid token" });
  }
};
