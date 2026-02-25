const express = require("express");
const cors = require("cors");


const propertiesRoutes = require("./routes/properties.routes");
const inquiriesRoutes = require("./routes/inquiries.routes");
const metaRoutes = require("./routes/meta.routes");
const authRoutes = require("./auth/auth.routes");
const ownersRoutes = require("./routes/owners.routes");

const app = express();

console.log("propertiesRoutes:", propertiesRoutes);
console.log("inquiriesRoutes:", inquiriesRoutes);
console.log("metaRoutes:", metaRoutes);

app.use(cors({
  origin: "http://localhost:3000",
  methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
  allowedHeaders: ["Content-Type", "Authorization"],
  credentials: true,
}));

app.use(express.json());
app.use("/uploads", express.static("uploads"));

app.get("/", (req, res) => {
  res.status(200).json({
    status: "ok",
    service: "villa-booking-backend",
    version: "1.0.0",
    time: new Date().toISOString(),
  });
});

app.use("/api/v1/properties", propertiesRoutes);
app.use("/api/v1/inquiries", inquiriesRoutes);
app.use("/api/v1/meta", metaRoutes);
app.use("/api/v1/auth", authRoutes);
app.use("/api/v1/owners", ownersRoutes);

app.get("/api/v1/health", (req, res) => {
  res.json({ status: "ok", time: new Date().toISOString() });
});

module.exports = app;
