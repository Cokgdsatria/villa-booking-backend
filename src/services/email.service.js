const nodemailer = require("nodemailer");
const { property } = require("../utils/prisma");

const transporter = nodemailer.createTransport({
    host: process.env.MAIL_HOST,
    port: process.env.MAIL_PORT,
    secure: false,
    auth: {
        user: process.env.MAIL_USER,
        pass: process.env.MAIL_PASS
    },
});

exports.sendInquiryEmailToOwner = async ({
    ownerEmail,
    propertyName,
    inquiry,
}) => {
    const html = `
        <h2>New Booking Inquiry</h2>
        <p><strong>Property:</strong> ${propertyName}</p>
        <p><strong>Name:</strong> ${inquiry.name}</p>
        <p><strong>Email:</strong> ${inquiry.email}</p>
        <p><strong>Phone:</strong> ${inquiry.telephone}</p>
        <p><strong>Check-in:</strong> ${inquiry.checkIn}</p>
        <p><strong>Check-out:</strong> ${inquiry.checkOut}</p>
        <p><strong>Guests:</strong> ${inquiry.guests}</p>
        <p><strong>Billing:</strong> ${inquiry.billingType}</p>
        <p><strong>Message:</strong><br/>${inquiry.message || "-"}</p>
    `;

    await transporter.sendMail({
        from: process.env.MAIL_FROM,
        to: ownerEmail,
        subject: `New Inquiry - ${propertyName}`,
        html,
    });
};