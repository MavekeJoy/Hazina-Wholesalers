const express = require("express");
const router = express.Router();
const pool = require("../db");
const { verifyToken } = require("../middleware/auth");

router.use(verifyToken);

// GET /api/purchases — all purchases with their items
router.get("/", async (req, res) => {
  try {
    const purchasesResult = await pool.query(`
      SELECT
        p.purchase_id     AS id,
        p.purchase_number,
        p.supplier_id,
        p.supplier_name,
        p.supplier_email,
        p.supplier_phone,
        p.invoice_number,
        p.subtotal,
        p.tax,
        p.total,
        p.status,
        p.payment_status,
        p.payment_method,
        p.expected_delivery,
        p.actual_delivery,
        p.purchase_date
      FROM purchases p
      ORDER BY p.purchase_date DESC
    `);

    // Fetch items for each purchase
    const purchases = await Promise.all(
      purchasesResult.rows.map(async (purchase) => {
        const itemsResult = await pool.query(
          `SELECT item_id, product_id, name, quantity, unit_price
           FROM purchase_items WHERE purchase_id = $1`,
          [purchase.id]
        );
        return { ...purchase, products: itemsResult.rows };
      })
    );

    res.json(purchases);
  } catch (err) {
    console.error("GET /purchases error:", err.message);
    res.status(500).json({ message: "Failed to fetch purchases" });
  }
});

// POST /api/purchases — create new purchase order
router.post("/", async (req, res) => {
  const {
    supplier_id, supplier_name, supplier_email, supplier_phone,
    invoice_number, products, payment_method, expected_delivery,
  } = req.body;

  if (!supplier_name || !products || products.length === 0) {
    return res.status(400).json({ message: "Supplier name and at least one product are required" });
  }

  const client = await pool.connect();
  try {
    await client.query("BEGIN");

    // Generate purchase number
    const countResult = await client.query("SELECT COUNT(*) FROM purchases");
    const count = parseInt(countResult.rows[0].count) + 1;
    const purchase_number = `PUR-${String(count).padStart(3, "0")}`;

    // Calculate totals
    const subtotal = products.reduce((sum, p) => sum + p.quantity * p.unit_price, 0);
    const tax = Math.round(subtotal * 0.16 * 100) / 100;
    const total = subtotal + tax;

    // Insert purchase
    const purchaseResult = await client.query(
      `INSERT INTO purchases (
        purchase_number, supplier_id, supplier_name, supplier_email,
        supplier_phone, invoice_number, subtotal, tax, total,
        status, payment_status, payment_method, expected_delivery
      ) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,'Pending','Pending',$10,$11)
      RETURNING *`,
      [
        purchase_number, supplier_id || null, supplier_name,
        supplier_email || null, supplier_phone || null,
        invoice_number || null, subtotal, tax, total,
        payment_method || "Bank Transfer",
        expected_delivery || null,
      ]
    );

    const purchase = purchaseResult.rows[0];

    // Insert purchase items
    for (const item of products) {
      await client.query(
        `INSERT INTO purchase_items (purchase_id, product_id, name, quantity, unit_price)
         VALUES ($1, $2, $3, $4, $5)`,
        [purchase.purchase_id, item.product_id || null, item.name, item.quantity, item.unit_price]
      );
    }

    await client.query("COMMIT");
    res.status(201).json({ message: "Purchase order created", purchase: { ...purchase, products } });
  } catch (err) {
    await client.query("ROLLBACK");
    console.error("POST /purchases error:", err.message);
    res.status(500).json({ message: "Failed to create purchase order" });
  } finally {
    client.release();
  }
});

// PATCH /api/purchases/:id/status
router.patch("/:id/status", async (req, res) => {
  const { id } = req.params;
  const { status } = req.body;

  const validStatuses = ["Pending", "Confirmed", "Received", "Cancelled"];
  if (!validStatuses.includes(status)) {
    return res.status(400).json({ message: "Invalid status" });
  }

  try {
    const actualDelivery = status === "Received" ? new Date() : null;
    const result = await pool.query(
      `UPDATE purchases
       SET status=$1, actual_delivery=COALESCE($2, actual_delivery)
       WHERE purchase_id=$3 RETURNING *`,
      [status, actualDelivery, id]
    );
    if (result.rows.length === 0) {
      return res.status(404).json({ message: "Purchase not found" });
    }
    res.json({ message: "Status updated", purchase: result.rows[0] });
  } catch (err) {
    console.error("PATCH /purchases/:id/status error:", err.message);
    res.status(500).json({ message: "Failed to update status" });
  }
});

// PATCH /api/purchases/:id/payment — mark as paid
router.patch("/:id/payment", async (req, res) => {
  const { id } = req.params;
  try {
    const result = await pool.query(
      "UPDATE purchases SET payment_status='Paid' WHERE purchase_id=$1 RETURNING *",
      [id]
    );
    if (result.rows.length === 0) {
      return res.status(404).json({ message: "Purchase not found" });
    }
    res.json({ message: "Payment marked as paid", purchase: result.rows[0] });
  } catch (err) {
    console.error("PATCH /purchases/:id/payment error:", err.message);
    res.status(500).json({ message: "Failed to update payment" });
  }
});

module.exports = router;