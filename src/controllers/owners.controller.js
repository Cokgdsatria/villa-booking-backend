const prisma = require("../utils/prisma");

exports.createOwner = async (req, res) => {
  try {
    const { name, email, whatsapp, avatarUrl } = req.body;

    if (!name || !email) {
      return res.status(400).json({
        status: "error",
        message: "name dan email wajib diisi",
      });
    }

    const owner = await prisma.owner.create({
      data: {
        name,
        email,
        whatsapp,
        avatarUrl,
      },
    });

    res.status(201).json({
      status: "success",
      data: owner,
    });
  } catch (error) {
    console.error("Create owner error:", error);
    res.status(500).json({
      status: "error",
      message: error.message,
    });
  }
};