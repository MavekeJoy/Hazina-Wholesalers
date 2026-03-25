require("dotenv").config();
const express = require("express");
const cors = require("cors");

const app = express();

app.use(cors({
  origin: process.env.CLIENT_URL || "http://localhost:5173",
  credentials: true,
}));
app.use(express.json());

const productRoutes   = require("./routes/products");
const userRoutes      = require("./routes/users");
const supplierRoutes  = require("./routes/suppliers");
const inventoryRoutes = require("./routes/inventory");
const dispatchRoutes  = require("./routes/dispatch");
const ordersRoutes    = require("./routes/orders");
const purchasesRoutes = require("./routes/purchases");
const reportsRoutes   = require("./routes/reports");

app.use("/api", productRoutes);
app.use("/api/users", userRoutes);
app.use("/api/suppliers", supplierRoutes);
app.use("/api/inventory", inventoryRoutes);
app.use("/api/dispatch", dispatchRoutes);
app.use("/api/orders", ordersRoutes);
app.use("/api/purchases", purchasesRoutes);
app.use("/api/reports", reportsRoutes);

app.get("/api/health", (req, res) => {
  res.json({ status: "ok", message: "Hazina API is running 🚀" });
});

app.use((req, res) => {
  res.status(404).json({ message: "Route not found" });
});

app.use((err, req, res, next) => {
  console.error("Unhandled error:", err);
  res.status(500).json({ message: "Internal server error" });
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`🚀 Hazina API running on http://localhost:${PORT}`);
});