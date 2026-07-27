const express = require('express');
const db = require('../db/db');
const { requireAdmin } = require('../middleware/auth');

const router = express.Router();
router.use(requireAdmin);

router.get('/stats', (req, res) => {
  const revenue = db.prepare("SELECT COALESCE(SUM(total_cents),0) as total FROM orders WHERE status != 'cancelled'").get().total;
  const orderCount = db.prepare('SELECT COUNT(*) as c FROM orders').get().c;
  const userCount = db.prepare("SELECT COUNT(*) as c FROM users WHERE role = 'user'").get().c;
  const lowStock = db.prepare('SELECT COUNT(*) as c FROM products WHERE stock <= 5').get().c;
  res.json({ revenue_cents: revenue, order_count: orderCount, user_count: userCount, low_stock_count: lowStock });
});

router.get('/users', (req, res) => {
  const users = db.prepare('SELECT id, email, name, role, created_at FROM users ORDER BY created_at DESC').all();
  res.json({ users });
});

module.exports = router;
