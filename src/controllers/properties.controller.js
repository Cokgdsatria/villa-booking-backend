const prisma = require("../utils/prisma");

exports.getList = async (req, res) => {
  try {
    const {
      location,
      type,
      totalRoom,
      page = 1,
      limit = 9,
      sort = "popular"
    } = req.query;

    const where = { status: { not: "INACTIVE" } };
    if (location) {
      where.OR = [
        { province: { contains: location, mode: "insensitive" } },
        { city: { contains: location, mode: "insensitive" } }
      ];
    }
    if (type) where.type = type;
    if (totalRoom) where.totalRoom = Number(totalRoom);

    let orderBy = { popularScore: "desc" };
    if (sort === "price_asc") orderBy = { priceMonthly: "asc" };
    if (sort === "price_desc") orderBy = { priceMonthly: "desc" };
    if (sort === "newest") orderBy = { createdAt: "desc" };

    const skip = (Number(page) - 1) * Number(limit);

    const [data, totalItems] = await Promise.all([
      prisma.property.findMany({
        where,
        orderBy,
        skip,
        take: Number(limit),
        select: {
          id: true,
          name: true,
          province: true,
          city: true,
          type: true,
          totalRoom: true,
          bedroom: true,
          bathroom: true,
          priceMonthly: true,
          priceYearly: true,
          thumbnailUrl: true,
          popularScore: true
        }
      }),
      prisma.property.count({ where })
    ]);

    res.json({
      data: data.map(p => ({
        ...p,
        location: `${p.province}, ${p.city}`
      })),
      meta: {
        page: Number(page),
        limit: Number(limit),
        totalItems,
        totalPages: Math.ceil(totalItems / Number(limit))
      }
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "INTERNAL_SERVER_ERROR" });
  }
};

exports.getDetail = async (req, res) => {
  try {
    const { id } = req.params;

    const prop = await prisma.property.findUnique({
      where: { id },
      include: {
        photos: { orderBy: { order: "asc" } },
        owner: {
          include: {
            user: { select: { email: true } },
          },
        }
      }
    });

    if (!prop) return res.status(404).json({ error: "PROPERTY_NOT_FOUND" });

    res.json({
      data: {
        id: prop.id,
        name: prop.name,
        location: {
          province: prop.province,
          city: prop.city,
          address: prop.address
        },
        type: prop.type,
        totalRoom: prop.totalRoom,
        bedroom: prop.bedroom,
        bathroom: prop.bathroom,
        description: prop.description,
        priceMonthly: prop.priceMonthly,
        priceYearly: prop.priceYearly,
        priceNight: prop.priceNight,
        thumbnailUrl: prop.thumbnailUrl,
        photos: prop.photos,
        owner: {
          id: prop.owner.id,
          name: prop.owner.name,
          email: prop.owner.user.email,
          whatsapp: prop.owner.whatsapp,
          avatarUrl: prop.owner.avatarUrl
        }
      }
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "INTERNAL_SERVER_ERROR" });
  }
};

//Search Properties
exports.searchProperties = async (req, res) => {
  try {
    const {
      location,
      city,
      province,
      type,
      totalRoom,
      billingType,
      minPrice,
      maxPrice,
      page = 1,
      limit = 10,
      sort = "name",
      order = "desc",
    } = req.query;

    const andConditions = [];

    if (location) {
      andConditions.push({
        OR: [
          { province: { contains: location, mode: "insensitive" } },
          { city: { contains: location, mode: "insensitive" } },
        ],
      });
    }

    // CITY
    if (city) {
      andConditions.push({
        city: { contains: city, mode: "insensitive" },
      });
    }

    // PROVINCE
    if (province) {
      andConditions.push({
        province: { contains: province, mode: "insensitive" },
      });
    }

    if (type) {
      andConditions.push({
        type: { contains: type, mode: "insensitive" },
      });
    }

    if (totalRoom != null) {
      andConditions.push({
        totalRoom: Number(totalRoom),
      });
    }

    // PRICE FILTER (berdasarkan UI logic)
    if (billingType === "MONTHLY" && (minPrice || maxPrice)) {
      const price = {};
      if (minPrice) price.gte = Number(minPrice);
      if (maxPrice) price.lte = Number(maxPrice);
      andConditions.push({ priceMonthly: price });
    }

    if (billingType === "YEARLY" && (minPrice || maxPrice)) {
      const price = {};
      if (minPrice) price.gte = Number(minPrice);
      if (maxPrice) price.lte = Number(maxPrice);
      andConditions.push({ priceYearly: price });
    }

    const where = andConditions.length > 0
      ? { AND: [...andConditions, { status: { not: "INACTIVE" } }] }
      : { status: { not: "INACTIVE" } };

    // PAGINATION
    const pageNum = Math.max(1, Number(page));
    const limitNum = Math.max(1, Number(limit));
    const skip = (pageNum - 1) * limitNum;

    // SORTING (WAJIB whitelist)
    const allowedSortFields = ["name", "priceMonthly", "priceYearly"];
    const sortField = allowedSortFields.includes(sort) ? sort : "name";
    const sortOrder = order === "asc" ? "asc" : "desc";

    const orderBy = {
      [sortField]: sortOrder,
    };

    const [properties, total] = await Promise.all([
      prisma.property.findMany({
        where,
        skip,
        take: limitNum,
        orderBy,
      }),
      prisma.property.count({ where }),
    ]);

    res.status(200).json({
      status: "success",
      meta: {
        total,
        page: pageNum,
        limit: limitNum,
        totalPages: Math.ceil(total / limitNum),
      },
      data: properties,
    });
  } catch (error) {
    console.error("searchProperties error:", error);
    res.status(500).json({
      status: "error",
      message: "Failed to search properties",
    });
  }
};

exports.createProperty = async (req, res) => {
  try {
    if (!req.user) {
      return res.status(401).json({
        status: "error",
        message: "Unauthorized",
      });
    }

    // 🔐 USER ID dari JWT
    const userId = req.user.id;

    const {
      name,
      type,
      province,
      city,
      address,
      totalRoom,
      bedroom,
      bathroom,
      description,
      priceMonthly,
      priceYearly,
      priceNight,
    } = req.body;

    const thumbnailUrl = req.file
      ? `/uploads/${req.file.filename}`
      : null;

    // VALIDASI
    if (
      !name ||
      !type ||
      !province ||
      !city ||
      totalRoom == null ||
      bedroom == null ||
      bathroom == null ||
      !description ||
      priceMonthly == null ||
      priceYearly == null ||
      priceNight == null
    ) {
      return res.status(400).json({
        status: "error",
        message: "Field wajib belum lengkap",
      });
    }

    // 🔎 CARI OWNER BERDASARKAN USER ID
    const owner = await prisma.owner.findUnique({
      where: { userId }, 
    });

    if (!owner) {
      return res.status(404).json({
        status: "error",
        message: "Owner tidak ditemukan",
      });
    }

    // ✅ CREATE PROPERTY DENGAN owner.id
    const property = await prisma.property.create({
      data: {
        name,
        type,
        status: "AVAILABLE",
        province,
        city,
        address,
        totalRoom: Number(totalRoom),
        bedroom: Number(bedroom),
        bathroom: Number(bathroom),
        description,
        priceMonthly: Number(priceMonthly),
        priceYearly: Number(priceYearly),
        priceNight: Number(priceNight),
        thumbnailUrl,
        ownerId: owner.id, 
      },
    });

    return res.status(201).json({
      status: "success",
      data: property,
    });
  } catch (error) {
    console.error("createProperty error:", error);
    const raw = String(error?.message || "");
    if (raw.toLowerCase().includes("pricenight") || raw.toLowerCase().includes("billingtype")) {
      return res.status(500).json({
        status: "error",
        message:
          "Database belum ter-update. Jalankan migrasi Prisma (npx prisma migrate dev) agar schema terbaru aktif.",
      });
    }
    return res.status(500).json({
      status: "error",
      message: "Failed to create property",
    });
  }
};

exports.getOwnerProperties = async (req, res) => {
  try {
    const userId = req.user.id;
    
    const owner = await prisma.owner.findUnique({
      where: { userId },
    });

    if (!owner) {
      return res.status(404).json({
        status: "error",
        message: "Owner tidak ditemukan",
      });
    }

    const properties = await prisma.property.findMany({
      where: { ownerId: owner.id, status: { not: "INACTIVE" } },
      orderBy: { createdAt: "desc" },
      select: {
        id: true,
        name: true,
        province: true,
        city: true,
        type: true,
        totalRoom: true,
        bedroom: true,
        bathroom: true,
        priceMonthly: true,
        priceYearly: true,
        priceNight: true,
        thumbnailUrl: true,
        status: true,
        createdAt: true,
      },
    });
    
    return res.status(200).json({
      status: "success",
      data: properties,
    });
  } catch (error) {
    console.error("getOwnerProperties error:", error);
    return res.status(500).json({
      status: "error",
      message: "Failed to fetch owner properties",
    });
  }
};

exports.uploadPhotos = async (req, res) => {
  try {
    const { id } = req.params; // property ID
    const userId = req.user.id;

    //mencari Owner
    const owner = await prisma.owner.findUnique({
      where: {userId},
    });

    if (!owner) {
      return res.status(404).json({
        where: { userId },
      });
    }

    const property = await prisma.property.findFirst({
      where: {
        id, 
        ownerId: owner.id,
      },
    });

    if (!property) {
      return res.status(404).json({
        message: "Property tidak ditemukan",
      });
    }
    
    //simpan semua file
    const photosData = req.files.map((file, index) => ({
      url: `/uploads/${file.filename}`,
      order: index,
      propertyId: property.id, 
    }));

    await prisma.propertyPhoto.createMany({
      data: photosData,
    });

    return res.json({
      status: "success",
      message: "Photos uploaded successfully",
      data: photosData,
    });
  } catch (error){
    console.error(error);
    return res.status(500).json({
      status: "error",
      message: "Upload failed",
    });
  }
}

exports.updateProperty = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;

    const owner = await prisma.owner.findUnique({
      where: { userId },
    });

    if (!owner) {
      return res.status(400).json({ error: "OWNER_NOT_FOUND" });
    }

    const property = await prisma.property.findFirst({
      where: {
        id,
        ownerId: owner.id,
      },
    });

    if (!property) {
      return res.status(404).json({ error: "PROPERTY_NOT_FOUND" });
    }

    const update = await prisma.property.update({
      where: { id },
      data: req.body,
    });

    res.json({
      status: "success",
      data: update,
    });

  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "INTERNAL_SERVER_ERROR" });
  }
};

exports.deleteProperty = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;

    const owner = await prisma.owner.findUnique({
      where: { userId },
    });

    if(!owner) {
      return res.status(404).json({
        status: "error",
        message: "Owner tidak ditemukan",
      });
    }

    const property = await prisma.property.findFirst({
      where: {
        id, 
        ownerId: owner.id,
      }
    });

    if (!property) {
      return res.status(404).json({
        status: "error",
        message: "Property tidak ditemukan atau bukan milik Anda",
      });
    }

    const inquiryCount = await prisma.inquiry.count({
      where: { propertyId: id },
    });

    if (inquiryCount > 0) {
      await prisma.property.update({
        where: { id },
        data: { status: "INACTIVE" },
      });

      return res.json({
        status: "success",
        action: "INACTIVATED",
        message:
          "Property memiliki inquiry sehingga tidak bisa dihapus permanen. Property dinonaktifkan.",
      });
    }

    await prisma.property.delete({ where: { id } });

    return res.json({
      status: "success",
      action: "DELETED",
      message: "Property berhasil dihapus",
    });
  } catch (error) {
    console.error("deleteProperty error:", error);
    if (error && error.code === "P2003") {
      try {
        const { id } = req.params;

        await prisma.property.update({
          where: { id },
          data: { status: "INACTIVE" },
        });

        return res.json({
          status: "success",
          action: "INACTIVATED",
          message:
            "Property memiliki relasi data (mis. inquiry) sehingga tidak bisa dihapus permanen. Property dinonaktifkan.",
        });
      } catch (fallbackError) {
        console.error("deleteProperty fallback error:", fallbackError);
      }
    }
    res.status(500).json({
      status: "error",
      message: "Failed to delete property",
    });
  }
};

exports.getOwnerDashboardStats = async (req,res) => {
  try {
    const owner = await prisma.owner.findUnique({
      where: { userId: req.user.id}
    });

    if (!owner) {
      return res.status(404).json({ message: "Owner not found" });
    }

    //Ambil semua property milih owner
    const properties = await prisma.property.findMany({
      where: { ownerId: owner.id },
      include: {
        bookings: true,
        inquiries: true,
        reviews: true,
      },
    });

    let totalRevenue = 0;
    let totalBookings = 0;
    let totalInquiries = 0;
    let totalRating = 0;
    let ratingCount = 0;

    properties.forEach((property) => {
      totalBookings += property.bookings.length;
      totalInquiries += property.inquiries.length;

      property.bookings.forEach((booking) => {
        totalRevenue += booking.totalPrice;
      });

      property.reviews.forEach((review) => {
        totalRating += review.rating;
        ratingCount++;
      });
    });

    const avgRating = 
      ratingCount === 0 ? 0 : totalRating / ratingCount;

      res.json({
        totalRevenue,
        totalBookings,
        totalInquiries,
        avgRating,
      });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Internal server error"});
  }
};
