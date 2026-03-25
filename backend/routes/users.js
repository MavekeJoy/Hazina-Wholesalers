const express = require("express");
const router = express.Router();
const pool = require("../db");
const admin = require("../firebaseAdmin");
const { verifyToken } = require("../middleware/auth");
const logAction = require("../utils/auditLogger");

router.use(verifyToken);

// Helper to get user info from token
const getUserInfo = async (req) => {
  try {
    const result = await pool.query(
      "SELECT user_id, name FROM users WHERE firebase_uid=$1",
      [req.user.uid]
    );
    return result.rows[0] || { user_id: null, name: req.user.email };
  } catch {
    return { user_id: null, name: req.user.email };
  }
};

// GET /api/users
router.get("/", async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT u.user_id AS id, u.name, u.email, u.phone, u.status,
        u.firebase_uid, r.role_name AS role, u.role_id
      FROM users u
      LEFT JOIN roles r ON u.role_id = r.role_id
      ORDER BY u.user_id DESC
    `);
    res.json(result.rows);
  } catch (err) {
    console.error("GET /users error:", err.message);
    res.status(500).json({ message: "Failed to fetch users" });
  }
});

// POST /api/users
router.post("/", async (req, res) => {
  const { name, email, role, phone, password } = req.body;
  if (!name || !email || !role || !password) {
    return res.status(400).json({ message: "name, email, role and password are required" });
  }

  const actor = await getUserInfo(req);
  const ip = req.ip || req.headers["x-forwarded-for"] || "Unknown";

  try {
    const roleResult = await pool.query(
      "SELECT role_id FROM roles WHERE role_name = $1", [role]
    );
    if (roleResult.rows.length === 0) {
      return res.status(400).json({ message: `Role "${role}" not found` });
    }
    const role_id = roleResult.rows[0].role_id;

    const firebaseUser = await admin.auth().createUser({
      email, password, displayName: name,
    });

    const result = await pool.query(
      `INSERT INTO users (name, email, phone, role_id, status, firebase_uid)
       VALUES ($1,$2,$3,$4,'Active',$5)
       RETURNING user_id AS id, name, email, phone, status, firebase_uid`,
      [name, email, phone || null, role_id, firebaseUser.uid]
    );

    await logAction({
      userId: actor.user_id, userName: actor.name,
      action: "Created User", module: "User Management",
      description: `Created user ${name} (${email}) with role ${role}`,
      ipAddress: ip, severity: "High",
      details: { newUser: email, role },
    });

    res.status(201).json({ message: "User created", user: { ...result.rows[0], role } });
  } catch (err) {
    console.error("POST /users error:", err);
    if (err.code === "auth/email-already-exists") {
      return res.status(409).json({ message: "A user with this email already exists." });
    }
    res.status(500).json({ message: "Failed to create user: " + err.message });
  }
});

// PUT /api/users/:id
router.put("/:id", async (req, res) => {
  const { id } = req.params;
  const { name, role, phone } = req.body;
  const actor = await getUserInfo(req);
  const ip = req.ip || "Unknown";

  try {
    const roleResult = await pool.query(
      "SELECT role_id FROM roles WHERE role_name=$1", [role]
    );
    if (roleResult.rows.length === 0) {
      return res.status(400).json({ message: `Role "${role}" not found` });
    }
    const role_id = roleResult.rows[0].role_id;

    const result = await pool.query(
      `UPDATE users SET name=$1, role_id=$2, phone=$3
       WHERE user_id=$4 RETURNING user_id AS id, name, email, phone, status`,
      [name, role_id, phone || null, id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ message: "User not found" });
    }

    await logAction({
      userId: actor.user_id, userName: actor.name,
      action: "Updated User", module: "User Management",
      description: `Updated user ${name} — role changed to ${role}`,
      ipAddress: ip, severity: "Medium",
      details: { userId: id, newRole: role },
    });

    res.json({ message: "User updated", user: { ...result.rows[0], role } });
  } catch (err) {
    console.error("PUT /users/:id error:", err.message);
    res.status(500).json({ message: "Failed to update user" });
  }
});

// PATCH /api/users/:id/disable
router.patch("/:id/disable", async (req, res) => {
  const { id } = req.params;
  const actor = await getUserInfo(req);
  const ip = req.ip || "Unknown";

  try {
    const userResult = await pool.query(
      "SELECT firebase_uid, name FROM users WHERE user_id=$1", [id]
    );
    if (userResult.rows.length === 0) {
      return res.status(404).json({ message: "User not found" });
    }

    const { firebase_uid, name } = userResult.rows[0];
    await admin.auth().updateUser(firebase_uid, { disabled: true });
    await pool.query("UPDATE users SET status='Inactive' WHERE user_id=$1", [id]);

    await logAction({
      userId: actor.user_id, userName: actor.name,
      action: "Disabled User", module: "User Management",
      description: `Disabled user account: ${name}`,
      ipAddress: ip, severity: "High",
      details: { disabledUserId: id, disabledUserName: name },
    });

    res.json({ message: "User disabled" });
  } catch (err) {
    console.error("PATCH /disable error:", err.message);
    res.status(500).json({ message: "Failed to disable user" });
  }
});

// PATCH /api/users/:id/enable
router.patch("/:id/enable", async (req, res) => {
  const { id } = req.params;
  const actor = await getUserInfo(req);
  const ip = req.ip || "Unknown";

  try {
    const userResult = await pool.query(
      "SELECT firebase_uid, name FROM users WHERE user_id=$1", [id]
    );
    if (userResult.rows.length === 0) {
      return res.status(404).json({ message: "User not found" });
    }

    const { firebase_uid, name } = userResult.rows[0];
    await admin.auth().updateUser(firebase_uid, { disabled: false });
    await pool.query("UPDATE users SET status='Active' WHERE user_id=$1", [id]);

    await logAction({
      userId: actor.user_id, userName: actor.name,
      action: "Enabled User", module: "User Management",
      description: `Re-enabled user account: ${name}`,
      ipAddress: ip, severity: "Medium",
      details: { enabledUserId: id, enabledUserName: name },
    });

    res.json({ message: "User enabled" });
  } catch (err) {
    console.error("PATCH /enable error:", err.message);
    res.status(500).json({ message: "Failed to enable user" });
  }
});

module.exports = router;