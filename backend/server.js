const express = require("express");
const cors = require("cors");
const pool = require("./db");

const app = express();

app.use(cors());
app.use(express.json());

// routes
const productRoutes = require("./routes/products");

app.use("/api", productRoutes);

app.listen(5000, () => {
  console.log("Hazina backend running on port 5000");
});