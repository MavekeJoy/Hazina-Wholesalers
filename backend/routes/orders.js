const express = require("express");
const router = express.Router();
const pool = require("../db");
const { verifyToken } = require("../middleware/auth");

// ── PUBLIC ROUTES (no token needed — retail buyers) ──────────────

// POST /api/orders — buyer places an order
router.post("/", async (req, res) => {
  const { customer, email, phone, delivery_address, products, payment_method } = req.body;

  if (!customer || !products || products.length === 0) {
    return res.status(400).json({ message: "Customer name and at least one product are required" });
  }

  const client = await pool.connect();
  try {
    await client.query("BEGIN");

    const countResult = await client.query("SELECT COUNT(*) FROM orders");
    const count = parseInt(countResult.rows[0].count) + 1;
    const order_number = `ORD-${String(count).padStart(3, "0")}`;

    const subtotal = products.reduce((sum, p) => sum + p.quantity * p.price, 0);
    const fee = subtotal > 2000 ? 0 : 200;
    const total = subtotal + fee;

    const orderResult = await client.query(
      `INSERT INTO orders (order_number, customer, email, phone, delivery_address,
        subtotal, delivery_fee, total, status, payment_method, payment_status)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,'Pending',$9,'Pending') RETURNING *`,
      [order_number, customer, email || null, phone || null,
       delivery_address || null, subtotal, fee, total, payment_method || null]
    );

    const order = orderResult.rows[0];

    // Use null for product_id — buyer cart items are not linked to inventory
    for (const item of products) {
      await client.query(
        `INSERT INTO order_items (order_id, product_id, name, quantity, price)
         VALUES ($1, NULL, $2, $3, $4)`,
        [order.order_id, item.name, item.quantity, item.price]
      );
    }

    await client.query("COMMIT");
    res.status(201).json({ message: "Order created", order: { ...order, products } });
  } catch (err) {
    await client.query("ROLLBACK");
    console.error("POST /orders error:", err.message);
    res.status(500).json({ message: "Failed to create order" });
  } finally {
    client.release();
  }
});

// ── PROTECTED ROUTES (staff/admin only) ──────────────────────────

router.use(verifyToken);

// GET /api/orders/pending-count — for dashboard badge
router.get("/pending-count", async (req, res) => {
  try {
    const result = await pool.query(
      "SELECT COUNT(*) FROM orders WHERE status = 'Pending'"
    );
    res.json({ count: parseInt(result.rows[0].count) });
  } catch (err) {
    res.status(500).json({ message: "Failed to fetch count" });
  }
});

// GET /api/orders
router.get("/", async (req, res) => {
  try {
    const ordersResult = await pool.query(`
      SELECT o.order_id AS id, o.order_number, o.customer, o.email,
        o.phone, o.delivery_address, o.subtotal, o.delivery_fee,
        o.total, o.status, o.payment_method, o.payment_status, o.order_date
      FROM orders o ORDER BY o.order_date DESC
    `);

    const orders = await Promise.all(
      ordersResult.rows.map(async (order) => {
        const itemsResult = await pool.query(
          "SELECT item_id, product_id, name, quantity, price FROM order_items WHERE order_id=$1",
          [order.id]
        );
        return { ...order, products: itemsResult.rows };
      })
    );

    res.json(orders);
  } catch (err) {
    console.error("GET /orders error:", err.message);
    res.status(500).json({ message: "Failed to fetch orders" });
  }
});

// PATCH /api/orders/:id/status
router.patch("/:id/status", async (req, res) => {
  const { id } = req.params;
  const { status } = req.body;
  const validStatuses = ["Pending", "Confirmed", "Shipped", "Delivered", "Cancelled"];
  if (!validStatuses.includes(status)) {
    return res.status(400).json({ message: "Invalid status" });
  }
  try {
    const result = await pool.query(
      "UPDATE orders SET status=$1 WHERE order_id=$2 RETURNING *",
      [status, id]
    );
    if (result.rows.length === 0) return res.status(404).json({ message: "Order not found" });
    res.json({ message: "Status updated", order: result.rows[0] });
  } catch (err) {
    res.status(500).json({ message: "Failed to update status" });
  }
});

// PATCH /api/orders/:id/payment
router.patch("/:id/payment", async (req, res) => {
  const { id } = req.params;
  try {
    const result = await pool.query(
      "UPDATE orders SET payment_status='Paid' WHERE order_id=$1 RETURNING *",
      [id]
    );
    if (result.rows.length === 0) return res.status(404).json({ message: "Order not found" });
    res.json({ message: "Payment marked as paid", order: result.rows[0] });
  } catch (err) {
    res.status(500).json({ message: "Failed to update payment" });
  }
});

module.exports = router;