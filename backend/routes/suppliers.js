const express = require("express");
const router = express.Router();
const pool = require("../db");
const { verifyToken } = require("../middleware/auth");

router.use(verifyToken);

// GET /api/suppliers
router.get("/", async (req, res) => {
  try {
    const result = await pool.query(
      "SELECT * FROM suppliers ORDER BY supplier_id DESC"
    );
    res.json(result.rows);
  } catch (err) {
    console.error("GET /suppliers error:", err.message);
    res.status(500).json({ message: "Failed to fetch suppliers" });
  }
});

// POST /api/suppliers
router.post("/", async (req, res) => {
  const { name, category, phone, email, address, min_order_quantity } = req.body;

  if (!name || !email || !phone || !category) {
    return res.status(400).json({ message: "name, email, phone and category are required" });
  }

  try {
    const result = await pool.query(
      `INSERT INTO suppliers (name, category, phone, email, address, min_order_quantity, rating, status)
       VALUES ($1, $2, $3, $4, $5, $6, 4.0, 'Active')
       RETURNING *`,
      [name, category, phone, email, address || null, min_order_quantity || null]
    );
    res.status(201).json({ message: "Supplier added", supplier: result.rows[0] });
  } catch (err) {
    console.error("POST /suppliers error:", err.message);
    res.status(500).json({ message: "Failed to add supplier" });
  }
});

// PUT /api/suppliers/:id
router.put("/:id", async (req, res) => {
  const { id } = req.params;
  const { name, category, phone, email, address, min_order_quantity } = req.body;

  try {
    const result = await pool.query(
      `UPDATE suppliers SET name=$1, category=$2, phone=$3, email=$4, address=$5, min_order_quantity=$6
       WHERE supplier_id=$7 RETURNING *`,
      [name, category, phone, email, address, min_order_quantity, id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ message: "Supplier not found" });
    }

    res.json({ message: "Supplier updated", supplier: result.rows[0] });
  } catch (err) {
    console.error("PUT /suppliers/:id error:", err.message);
    res.status(500).json({ message: "Failed to update supplier" });
  }
});

// DELETE /api/suppliers/:id
router.delete("/:id", async (req, res) => {
  const { id } = req.params;
  try {
    await pool.query("DELETE FROM suppliers WHERE supplier_id=$1", [id]);
    res.json({ message: "Supplier deleted" });
  } catch (err) {
    console.error("DELETE /suppliers/:id error:", err.message);
    res.status(500).json({ message: "Failed to delete supplier" });
  }
});

module.exports = router;