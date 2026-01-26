const bcrypt = require("bcrypt");
const jwt = require("../utils/jwt");
const prisma = require("../utils/prisma");

exports.register = async ({ name, email, password, role }) => {
    const existing = await prisma.user.findUnique({
        where: {email},
    });

    if (existing) {
        throw new Error("Email already Registered");
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const user = await prisma.user.create({
        data: {
            name,
            email,
            password: hashedPassword,
            role,
        },
    });

    return {
        id: user.id,
        email: user.email,
        role: user.role,
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

    return {
        token,
        user: {
            id: user.id,
            email: user.email,
            role: user.role,
        },
    };
};