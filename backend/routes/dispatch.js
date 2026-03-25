const express = require("express");
const router = express.Router();
const pool = require("../db");
const { verifyToken } = require("../middleware/auth");

router.use(verifyToken);

// GET /api/dispatch — all dispatches
router.get("/", async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT
        d.dispatch_id        AS id,
        d.quantity_dispatched,
        d.biometric_status,
        d.dispatch_date,
        d.customer_name,
        d.customer_phone,
        d.delivery_address,
        d.status,
        d.priority,
        d.estimated_delivery,
        d.actual_delivery,
        d.amount,
        d.distance,
        d.order_id,
        p.product_id,
        p.name               AS product_name,
        p.sku,
        u.user_id            AS officer_id,
        u.name               AS officer_name,
        u.phone              AS officer_phone
      FROM dispatch d
      LEFT JOIN products p ON d.product_id = p.product_id
      LEFT JOIN users    u ON d.delivery_officer_id = u.user_id
      ORDER BY d.dispatch_date DESC
    `);
    res.json(result.rows);
  } catch (err) {
    console.error("GET /dispatch error:", err.message);
    res.status(500).json({ message: "Failed to fetch dispatches" });
  }
});

// GET /api/dispatch/officers — delivery staff for dropdown
router.get("/officers", async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT u.user_id AS id, u.name, u.phone, u.email
      FROM users u
      JOIN roles r ON u.role_id = r.role_id
      WHERE r.role_name = 'Delivery Staff' AND u.status = 'Active'
      ORDER BY u.name
    `);
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ message: "Failed to fetch delivery officers" });
  }
});

// GET /api/dispatch/confirmed-orders — confirmed orders available for dispatch
router.get("/confirmed-orders", async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT
        o.order_id      AS id,
        o.order_number,
        o.customer,
        o.phone,
        o.delivery_address,
        o.total,
        o.status
      FROM orders o
      WHERE o.status = 'Confirmed'
      ORDER BY o.order_date DESC
    `);
    res.json(result.rows);
  } catch (err) {
    console.error("GET /dispatch/confirmed-orders error:", err.message);
    res.status(500).json({ message: "Failed to fetch confirmed orders" });
  }
});

// POST /api/dispatch — create new dispatch
router.post("/", async (req, res) => {
  const {
    order_id, product_id, quantity_dispatched, delivery_officer_id,
    customer_name, customer_phone, delivery_address,
    priority, estimated_delivery, amount, distance,
  } = req.body;

  if (!customer_name) {
    return res.status(400).json({ message: "Customer name is required" });
  }

  try {
    const result = await pool.query(
      `INSERT INTO dispatch (
        product_id, quantity_dispatched, delivery_officer_id,
        customer_name, customer_phone, delivery_address,
        status, priority, estimated_delivery, amount,
        distance, order_id, biometric_status, dispatch_date
      ) VALUES ($1,$2,$3,$4,$5,$6,'Pending',$7,$8,$9,$10,$11,false,NOW())
      RETURNING *`,
      [
        product_id || null,
        quantity_dispatched || 1,
        delivery_officer_id || null,
        customer_name,
        customer_phone || null,
        delivery_address || null,
        priority || "Normal",
        estimated_delivery || null,
        amount || null,
        distance || null,
        order_id || null,
      ]
    );

    // If linked to an order, update its status to Shipped
    if (order_id) {
      await pool.query(
        "UPDATE orders SET status='Shipped' WHERE order_id=$1",
        [order_id]
      );
    }

    res.status(201).json({ message: "Dispatch created", dispatch: result.rows[0] });
  } catch (err) {
    console.error("POST /dispatch error:", err.message);
    res.status(500).json({ message: "Failed to create dispatch" });
  }
});

// PATCH /api/dispatch/:id/status
router.patch("/:id/status", async (req, res) => {
  const { id } = req.params;
  const { status } = req.body;

  const validStatuses = ["Pending", "Assigned", "In Transit", "Delivered", "Failed"];
  if (!validStatuses.includes(status)) {
    return res.status(400).json({ message: "Invalid status" });
  }

  try {
    const actualDelivery = status === "Delivered" ? new Date() : null;

    const dispatchResult = await pool.query(
      `UPDATE dispatch
       SET status=$1, actual_delivery=COALESCE($2, actual_delivery)
       WHERE dispatch_id=$3 RETURNING *`,
      [status, actualDelivery, id]
    );

    if (dispatchResult.rows.length === 0) {
      return res.status(404).json({ message: "Dispatch not found" });
    }

    // If delivered, also update the linked order to Delivered
    const dispatch = dispatchResult.rows[0];
    if (status === "Delivered" && dispatch.order_id) {
      await pool.query(
        "UPDATE orders SET status='Delivered' WHERE order_id=$1",
        [dispatch.order_id]
      );
    }

    res.json({ message: "Status updated", dispatch });
  } catch (err) {
    console.error("PATCH /dispatch/:id/status error:", err.message);
    res.status(500).json({ message: "Failed to update status" });
  }
});

// PATCH /api/dispatch/:id/biometric
router.patch("/:id/biometric", async (req, res) => {
  const { id } = req.params;
  try {
    const result = await pool.query(
      "UPDATE dispatch SET biometric_status=true WHERE dispatch_id=$1 RETURNING *",
      [id]
    );
    if (result.rows.length === 0) {
      return res.status(404).json({ message: "Dispatch not found" });
    }
    res.json({ message: "Biometric verified", dispatch: result.rows[0] });
  } catch (err) {
    res.status(500).json({ message: "Failed to update biometric status" });
  }
});

// PATCH /api/dispatch/:id/assign
router.patch("/:id/assign", async (req, res) => {
  const { id } = req.params;
  const { delivery_officer_id } = req.body;
  try {
    const result = await pool.query(
      `UPDATE dispatch SET delivery_officer_id=$1, status='Assigned'
       WHERE dispatch_id=$2 RETURNING *`,
      [delivery_officer_id, id]
    );
    if (result.rows.length === 0) {
      return res.status(404).json({ message: "Dispatch not found" });
    }
    res.json({ message: "Officer assigned", dispatch: result.rows[0] });
  } catch (err) {
    res.status(500).json({ message: "Failed to assign officer" });
  }
});

module.exports = router;