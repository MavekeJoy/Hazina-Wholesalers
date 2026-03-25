const pool = require("../db");

/**
 * Log an action to the audit_logs table
 * Call this from any route after a significant action
 *
 * @param {object} options
 * @param {number|null} options.userId    - DB user_id (from users table)
 * @param {string}      options.userName  - Display name
 * @param {string}      options.action    - Short action label e.g. "Created Order"
 * @param {string}      options.module    - Module name e.g. "Orders"
 * @param {string}      options.description - Full description
 * @param {string}      options.ipAddress - Request IP
 * @param {string}      options.status    - "Success" or "Failed"
 * @param {string}      options.severity  - "Low", "Medium", "High"
 * @param {object}      options.details   - Any extra JSON details
 */
async function logAction({
  userId = null,
  userName = "System",
  action,
  module,
  description,
  ipAddress = "Unknown",
  status = "Success",
  severity = "Low",
  details = {},
}) {
  try {
    await pool.query(
      `INSERT INTO audit_logs
        (user_id, user_name, action, module, description, ip_address, status, severity, details, created_at)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,NOW())`,
      [userId, userName, action, module, description, ipAddress, status, severity, JSON.stringify(details)]
    );
  } catch (err) {
    // Never let audit logging crash the main request
    console.error("Audit log error:", err.message);
  }
}

module.exports = logAction;