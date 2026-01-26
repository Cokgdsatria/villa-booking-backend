const { z } = require("zod");

const searchPropertySchema = z.object({
  city: z.string().min(1).optional(),
  province: z.string().min(1).optional(),

  billingType: z.enum(["MONTHLY", "YEARLY"]).optional(),

  minPrice: z.coerce.number().positive().optional(),
  maxPrice: z.coerce.number().positive().optional(),

  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(50).default(10),

  sort: z.enum(["name", "priceMonthly", "priceYearly"]).default("name"),
  order: z.enum(["asc", "desc"]).default("desc"),
});

module.exports = { searchPropertySchema };
