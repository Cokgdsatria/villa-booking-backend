// Meta Controller
// Fungsi: health check / info API

exports.getMeta = async (req, res) => {
  try {
    res.status(200).json({
      status: "ok",
      service: "villa-booking-backend",
      version: "1.0.0",
      time: new Date().toISOString(),
    });
  } catch (error) {
    res.status(500).json({
      status: "error",
      message: "Failed to get meta info",
    });
  }
};
