const express = require("express");
const router = express.Router();
const pool = require("../db");
const { verifyToken } = require("../middleware/auth");

router.use(verifyToken);

// GET /api/reports — all aggregated data for the reports page
router.get("/", async (req, res) => {
  try {
    // 1. Revenue over time (last 6 months from orders)
    const revenueResult = await pool.query(`
      SELECT
        TO_CHAR(DATE_TRUNC('month', order_date), 'Mon YYYY') AS month,
        DATE_TRUNC('month', order_date) AS month_date,
        SUM(total) AS revenue,
        COUNT(*) AS order_count
      FROM orders
      WHERE status != 'Cancelled'
        AND order_date >= NOW() - INTERVAL '6 months'
      GROUP BY DATE_TRUNC('month', order_date)
      ORDER BY month_date ASC
    `);

    // 2. Top selling products (from order_items)
    const topProductsResult = await pool.query(`
      SELECT
        oi.name,
        SUM(oi.quantity) AS total_units,
        SUM(oi.quantity * oi.price) AS total_revenue
      FROM order_items oi
      JOIN orders o ON oi.order_id = o.order_id
      WHERE o.status != 'Cancelled'
      GROUP BY oi.name
      ORDER BY total_revenue DESC
      LIMIT 10
    `);

    // 3. Order status breakdown
    const orderStatusResult = await pool.query(`
      SELECT status, COUNT(*) AS count
      FROM orders
      GROUP BY status
      ORDER BY count DESC
    `);

    // 4. Inventory levels & stock alerts
    const inventoryResult = await pool.query(`
      SELECT
        p.name, p.sku, p.quantity, p.min_stock, p.max_stock,
        p.price, p.status,
        c.category_name AS category,
        s.name AS supplier
      FROM products p
      LEFT JOIN categories c ON p.category_id = c.category_id
      LEFT JOIN suppliers  s ON p.supplier_id  = s.supplier_id
      ORDER BY p.quantity ASC
    `);

    // 5. Supplier spending (from purchases)
    const supplierSpendResult = await pool.query(`
      SELECT
        supplier_name,
        COUNT(*) AS order_count,
        SUM(total) AS total_spent,
        SUM(CASE WHEN status = 'Received' THEN total ELSE 0 END) AS received_value
      FROM purchases
      WHERE status != 'Cancelled'
      GROUP BY supplier_name
      ORDER BY total_spent DESC
    `);

    // 6. Delivery performance
    const deliveryResult = await pool.query(`
      SELECT
        status,
        COUNT(*) AS count,
        AVG(
          CASE WHEN actual_delivery IS NOT NULL AND dispatch_date IS NOT NULL
          THEN EXTRACT(EPOCH FROM (actual_delivery - dispatch_date)) / 3600
          ELSE NULL END
        ) AS avg_hours
      FROM dispatch
      GROUP BY status
    `);

    // 7. Summary KPIs
    const kpiResult = await pool.query(`
      SELECT
        (SELECT COUNT(*) FROM orders WHERE status != 'Cancelled') AS total_orders,
        (SELECT COALESCE(SUM(total),0) FROM orders WHERE status != 'Cancelled') AS total_revenue,
        (SELECT COUNT(*) FROM orders WHERE status = 'Pending') AS pending_orders,
        (SELECT COUNT(*) FROM products WHERE status = 'Out of Stock') AS out_of_stock,
        (SELECT COUNT(*) FROM products WHERE status = 'Low Stock') AS low_stock,
        (SELECT COALESCE(SUM(total),0) FROM purchases WHERE status != 'Cancelled') AS total_spent,
        (SELECT COUNT(*) FROM dispatch WHERE status = 'Delivered') AS deliveries_completed,
        (SELECT COUNT(*) FROM dispatch) AS total_dispatches
    `);

    res.json({
      revenue:        revenueResult.rows,
      topProducts:    topProductsResult.rows,
      orderStatus:    orderStatusResult.rows,
      inventory:      inventoryResult.rows,
      supplierSpend:  supplierSpendResult.rows,
      delivery:       deliveryResult.rows,
      kpis:           kpiResult.rows[0],
    });

  } catch (err) {
    console.error("GET /reports error:", err.message);
    res.status(500).json({ message: "Failed to fetch report data" });
  }
});

// GET /api/reports/audit-logs — real audit logs
router.get("/audit-logs", async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT
        al.log_id AS id,
        al.user_id,
        al.user_name,
        al.action,
        al.module,
        al.description,
        al.ip_address,
        al.status,
        al.severity,
        al.details,
        al.created_at AS timestamp
      FROM audit_logs al
      ORDER BY al.created_at DESC
      LIMIT 200
    `);
    res.json(result.rows);
  } catch (err) {
    console.error("GET /reports/audit-logs error:", err.message);
    res.status(500).json({ message: "Failed to fetch audit logs" });
  }
});

module.exports = router;