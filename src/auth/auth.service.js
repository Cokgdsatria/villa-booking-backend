const bcrypt = require("bcrypt");
const jwt = require("../utils/jwt");
const prisma = require("../utils/prisma");

exports.register = async ({ name, email, password, role, createOwnerProfile }) => {
  const existing = await prisma.user.findUnique({
    where: { email },
  });

  if (existing) {
    throw new Error("Email already Registered");
  }

  const hashedPassword = await bcrypt.hash(password, 10);

  const result = await prisma.$transaction(async (tx) => {
    const user = await tx.user.create({
      data: {
        name,
        email,
        password: hashedPassword,
        role,
      },
    });

    if (role === "OWNER" && createOwnerProfile !== false) {
      await tx.owner.create({
        data: {
          userId: user.id,
          name: user.name,
        },
      });
    }

    return user; 
  });

  // 
  return {
    id: result.id,
    email: result.email,
    role: result.role,
  };
};

exports.login = async ({ email, password }) => {
    const user = await prisma.user.findUnique({ 
        where: { email } 
    });

    if (!user) throw new Error("Invalid credentials");

    const valid = await bcrypt.compare(password, user.password);
    if (!valid) throw new Error("Invalid credentials");

    // 1️⃣ Buat token JWT
    const token = jwt.sign({
        id: user.id,
        role: user.role,
        email: user.email,
    });

    const ownerProfile =
      user.role === "OWNER"
        ? await prisma.owner.findUnique({
            where: { userId: user.id },
            select: { id: true, name: true, whatsapp: true, avatarUrl: true },
          })
        : null;

    return {
        token,
        user: {
            id: user.id,
            name: user.name,
            email: user.email,
            role: user.role,
            owner: ownerProfile,
        },
    };
};
