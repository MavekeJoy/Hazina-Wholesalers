const express = require("express");
const router = express.Router();
const pool = require("../db");

// Add new product
router.post("/add-product", async (req, res) => {
  try {
    const { name, category_id, supplier_id, quantity_available, reorder_level } = req.body;

    const newProduct = await pool.query(
      "INSERT INTO products (name, category_id, supplier_id, quantity_available, reorder_level) VALUES ($1,$2,$3,$4,$5) RETURNING *",
      [name, category_id, supplier_id, quantity_available, reorder_level]
    );

    res.json(newProduct.rows[0]);
  } catch (err) {
    console.error(err.message);
  }
});

// get all products
router.get("/products", async (req, res) => {
  try {
    const allProducts = await pool.query("SELECT * FROM products");
    res.json(allProducts.rows);
  } catch (err) {
    console.error(err.message);
  }
});

module.exports = router;