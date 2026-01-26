const authService = require("./auth.service");

exports.login = async (req, res) => {
    try {
        const { token, user } = await authService.login(req.body);
        res.json({ status: "success", token, user });
    } catch (error) {
        res.status(401).json({ 
            status: "error", 
            message: error.message });
    }
};

exports.register = async (req, res) => {
  try {
    const user = await authService.register(req.body);
    res.status(201).json({
      status: "success",
      data: user,
    });
  } catch (error) {
    res.status(400).json({
      status: "error",
      message: error.message,
    });
  }
};