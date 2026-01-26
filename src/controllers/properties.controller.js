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

    const where = {};
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
        owner: true
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
        thumbnailUrl: prop.thumbnailUrl,
        photos: prop.photos,
        owner: {
          id: prop.owner.id,
          name: prop.owner.name,
          email: prop.owner.email,
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
      city,
      province,
      billingType,
      minPrice,
      maxPrice,
      page = 1,
      limit = 10,
      sort = "name",
      order = "desc",
    } = req.query;

    const andConditions = [];

    // CITY
    if (city) {
      andConditions.push({
        city: { contains: city },
      });
    }

    // PROVINCE
    if (province) {
      andConditions.push({
        province: { contains: province },
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
      ? { AND: andConditions }
      : {};

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
      ownerId,
    } = req.body;

    if (
      !name ||
      !type ||
      !province ||
      !city ||
      totalRoom == null ||
      bedroom == null ||
      bathroom == null ||
      priceMonthly == null ||
      priceYearly == null ||
      !ownerId
    ) {
      return res.status(400).json({
        status: "error",
        message: "Field wajib belum lengkap",
      });
    }

    const owner = await prisma.owner.findUnique({
      where: { id: ownerId },
    });

    if (!owner) {
      return res.status(404).json({
        status: "error",
        message: "Owner tidak ditemukan",
      });
    }

    const property = await prisma.property.create({
      data: {
        name,
        type: String(type).toUpperCase(),
        province,
        city,
        address,
        totalRoom: Number(totalRoom),
        bedroom: Number(bedroom),
        bathroom: Number(bathroom),
        description,
        priceMonthly: Number(priceMonthly),
        priceYearly: Number(priceYearly),
        ownerId,
      },
    });

    res.status(201).json({
      status: "success",
      data: property,
    });
  } catch (error) {
    console.error("createProperty error:", error);
    res.status(500).json({
      status: "error",
      message: "Failed to create property",
    });
  }
};

