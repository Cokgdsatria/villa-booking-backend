const express = require("express");
const router = express.Router();

const controller = require("../controllers/inquiries.controller");
const { validateBody } = require("../middlewares/validate");
const authMiddleware = require("../middlewares/auth.middleware");
const roleMiddleware = require("../middlewares/role.middleware");

const {
  createInquirySchema,
  updateInquiryStatusSchema,
} = require("../validations/inquiry.validation");

// Create inquiry (public)
router.post(
  "/",
  validateBody(createInquirySchema),
  controller.createInquiry
);

router.get(
  "/owner",
  authMiddleware,
  roleMiddleware("OWNER"),
  controller.getInquiriesByOwner
);

// Get inquiries (protected / admin / owner later)
router.get(
  "/",
  authMiddleware,
  roleMiddleware("ADMIN"),
  controller.getInquiries
);

// Get inquiry by id (protected)
router.get(
  "/:id",
  authMiddleware,
  roleMiddleware("OWNER", "ADMIN"),
  controller.getInquiryById
);

// Update inquiry status (OWNER / ADMIN only)
router.patch(
  "/:id/status",
  authMiddleware,
  roleMiddleware("OWNER", "ADMIN"),
  validateBody(updateInquiryStatusSchema),
  controller.updateInquiryStatus
);

module.exports = router;
