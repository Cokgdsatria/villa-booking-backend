const  { z } = require ("zod");

const createInquirySchema = z.object({
  propertyId: z.string().min(1),
  name: z.string().min(1),
  email: z.string().email(),
  telephone: z.string().min(8),
  message: z.string().optional(),

  billingType: z.enum(["MONTHLY", "YEARLY"]),

  checkIn: z.coerce.date(),
  checkOut: z.coerce.date(),

  guests: z.coerce.number().int().min(1),
});

const updateInquiryStatusSchema = z.object({
  status: z.enum ([
    "PENDING",
    "RESPONDED",
    "CLOSED",
  ]),
});

const replyInquirySchema = z.object({
  message: z.string().min(1, "Pesan tidak boleh kosong"),
});

module.exports = {
    createInquirySchema,
    updateInquiryStatusSchema,
    replyInquirySchema,
};