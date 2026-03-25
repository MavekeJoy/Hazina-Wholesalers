const express = require("express");
const router = express.Router();
const pool = require("../db");
const { verifyToken } = require("../middleware/auth");

router.use(verifyToken);

// GET /api/inventory — all products with category and supplier names
router.get("/", async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT 
        p.product_id    AS id,
        p.name,
        p.sku,
        p.quantity,
        p.min_stock,
        p.max_stock,
        p.price,
        p.status,
        p.last_restocked,
        p.reorder_level,
        c.category_name AS category,
        s.name          AS supplier,
        s.supplier_id
      FROM products p
      LEFT JOIN categories c ON p.category_id = c.category_id
      LEFT JOIN suppliers  s ON p.supplier_id  = s.supplier_id
      ORDER BY p.product_id DESC
    `);
    res.json(result.rows);
  } catch (err) {
    console.error("GET /inventory error:", err.message);
    res.status(500).json({ message: "Failed to fetch inventory" });
  }
});

// POST /api/inventory — add new product
router.post("/", async (req, res) => {
  const { name, sku, category_id, supplier_id, quantity, min_stock, max_stock, price, reorder_level } = req.body;

  if (!name || !sku || !price) {
    return res.status(400).json({ message: "name, sku and price are required" });
  }

  // Determine status based on quantity vs min_stock
  const status = quantity === 0 ? "Out of Stock"
    : quantity <= min_stock ? "Low Stock"
    : "In Stock";

  try {
    const result = await pool.query(
      `INSERT INTO products (name, sku, category_id, supplier_id, quantity, min_stock, max_stock, price, reorder_level, status, last_restocked)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10, NOW())
       RETURNING *`,
      [name, sku, category_id || null, supplier_id || null, quantity || 0, min_stock || 0, max_stock || 0, price, reorder_level || min_stock || 0, status]
    );
    res.status(201).json({ message: "Product added", product: result.rows[0] });
  } catch (err) {
    console.error("POST /inventory error:", err.message);
    if (err.code === "23505") {
      return res.status(409).json({ message: "A product with this SKU already exists." });
    }
    res.status(500).json({ message: "Failed to add product" });
  }
});

// PUT /api/inventory/:id — update product
router.put("/:id", async (req, res) => {
  const { id } = req.params;
  const { name, sku, category_id, supplier_id, quantity, min_stock, max_stock, price, reorder_level } = req.body;

  const status = quantity === 0 ? "Out of Stock"
    : quantity <= min_stock ? "Low Stock"
    : "In Stock";

  try {
    const result = await pool.query(
      `UPDATE products SET name=$1, sku=$2, category_id=$3, supplier_id=$4,
       quantity=$5, min_stock=$6, max_stock=$7, price=$8, reorder_level=$9, status=$10
       WHERE product_id=$11 RETURNING *`,
      [name, sku, category_id || null, supplier_id || null, quantity, min_stock, max_stock, price, reorder_level || min_stock, status, id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ message: "Product not found" });
    }

    res.json({ message: "Product updated", product: result.rows[0] });
  } catch (err) {
    console.error("PUT /inventory/:id error:", err.message);
    res.status(500).json({ message: "Failed to update product" });
  }
});

// DELETE /api/inventory/:id
router.delete("/:id", async (req, res) => {
  const { id } = req.params;
  try {
    await pool.query("DELETE FROM products WHERE product_id=$1", [id]);
    res.json({ message: "Product deleted" });
  } catch (err) {
    console.error("DELETE /inventory/:id error:", err.message);
    res.status(500).json({ message: "Failed to delete product" });
  }
});

// GET /api/inventory/categories — for the dropdown in the form
router.get("/categories", async (req, res) => {
  try {
    const result = await pool.query("SELECT * FROM categories ORDER BY category_name");
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ message: "Failed to fetch categories" });
  }
});

module.exports = router;