const prisma = require("../utils/prisma");
const { sendInquiryEmailToOwner } = require("../services/email.service");

exports.createInquiry = async (req, res) => {
  try {
    const {
      name,
      email,
      telephone,
      message,
      checkIn,
      checkOut,
      guests,
      billingType,
      propertyId
    } = req.body;

    const inquiry = await prisma.inquiry.create({
      data: {
        name,
        email,
        telephone,
        message,
        checkIn: new Date(checkIn),
        checkOut: new Date(checkOut),
        guests,
        billingType,
        property: {
          connect: { id: propertyId }
        },
      },
      include: {
        property: {
          include: {
            owner: true,
          },
        },
      }, 
    });

    await sendInquiryEmailToOwner({
      ownerEmail: inquiry.property.owner.email,
      propertyName: inquiry.property.name,
      inquiry,
    });

    res.status(201).json({
      status: "success",
      data: inquiry
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({
      status: "error",
      message: "Failed to create inquiry",
    });
  }
};

//GET /inquiries
exports.getInquiries = async (req, res) =>{
    try{
        const inquiries = await prisma.inquiry.findMany({
            orderBy: {
                createdAt: "desc",
            },
            include: {
                property: {
                    select: {
                        id: true,
                        name: true, 
                        city: true,
                        province: true,
                    },
                },
            },
        });

        res.status(200).json({
            status: "success",
            total: inquiries.length,
            data: inquiries,
        });
    }catch(error) {
        console.error(error);
        res.status(500).json({
            status: "error",
            message: "Failed to get Inquiries",
        });
    }
};

//GET /inquiries/:id
exports.getInquiryById = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;

    const owner = await prisma.owner.findUnique({
      where: { userId }
    });

    if(!owner) {
      return res.status(403).json({
        status: "error",
        message: "Owner not found",
      });
    }

    const inquiry = await prisma.inquiry.findFirst({
      where: {
        id,
        property: {
          ownerId: owner.id,
        },
      },
      include: {
        property: true,
        replies: {
          orderBy: { createdAt: "asc" },
        },
      },
    });

    if (!inquiry) {
      return res.status(404).json({
        status: "fail",
        message: "Inquiry not found",
      });
    }

    res.status(200).json({
      status: "success",
      data: inquiry,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({
      status: "error",
      message: "Failed to get inquiry",
    });
  }
};


//Update Inquiry Status
exports.updateInquiryStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    // 1️⃣ cek inquiry ada atau tidak
    const inquiry = await prisma.inquiry.findUnique({
      where: { id },
    });

    if (!inquiry) {
      return res.status(404).json({
        status: "error",
        message: "Inquiry not found",
      });
    }

    // 2️⃣ update status
    const updatedInquiry = await prisma.inquiry.update({
      where: { id },
      data: { status },
    });

    res.status(200).json({
      status: "success",
      data: updatedInquiry,
    });
  } catch (error) {
    console.error("updateInquiryStatus error:", error);
    res.status(500).json({
      status: "error",
      message: "Failed to update inquiry status",
    });
  }
};

exports.getInquiriesByOwner = async (req, res) => {
  try {
    const userId = req.user.id; //update
    const { status, page = 1, limit = 10 } = req.query;

    const where = {
      property: {
        owner: {
          userId, //update
        }
      },
    };

    if (status) {
      where.status = status;
    }

    const skip = (Number(page) - 1) * Number(limit);

    const [data, total] = await Promise.all ([
      prisma.inquiry.findMany({
        where,
        skip,
        take: Number(limit),
        orderBy: { createdAt: "desc" },
        include: {
          property: {
            select: {
              id: true,
              name: true,
              city: true,
              province: true,
            },
          },
        },
      }),
      prisma.inquiry.count({ where }),
    ]);

    res.status(200).json({
      status: "success",
      meta: {
        page: Number(page),
        limit: Number(limit),
        total,
        totalPages: Math.ceil(total / Number(limit)),
      },
      data,
    });
  } catch (error) {
    console.error("getInquiriesByOwner error:", error);
    res.status(500).json({
      status: "error",
      message: "Failed to get inquiries for owner",
    });
  }
};

exports.replyInquiry = async (req, res) => {
    try {
      const inquiryId = req.params.id;
      const { message } = req.body;
      // const userId = req.user.id; //dari jwt middleware

      if (!message) {
        return res.status(400).json({
          status: "error",
          message: "Message is required",
        });
      }

      const inquiry = await prisma.inquiry.findUnique({
        where: { id: inquiryId },
      });

      if (!inquiry) {
        return res.status(404).json({
          status: "error",
          message: "Inquiry not found",
        });
      }

      //simpan reply
      const reply = await prisma.inquiryReply.create({
        data: {
          message,
          inquiryId,
          senderRole: "OWNER",
        },
      });

      //update status inquiry
      await prisma.inquiry.update({
      where: { id: inquiryId },
      data: { status: "RESPONDED" },
      });

      res.json({
        status: "success",
        reply,
      });
    } catch (error) {
      console.error("Reply Inquiry Error:", error);
      res.status(500).json({
        status: "error",
        message: "Failed to reply inquiry",
      });
    }
};