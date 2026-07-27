const express = require('express');
const db = require('../db/db');
const { requireAuth, requireAdmin } = require('../middleware/auth');

const router = express.Router();

// POST /api/orders/checkout  (auth required)
router.post('/checkout', requireAuth, (req, res) => {
  const { shipping_name, shipping_address } = req.body || {};
  if (!shipping_name || !shipping_address) {
    return res.status(400).json({ error: 'MISSING_SHIPPING', message: 'shipping name and address are required' });
  }

  const cartRows = db
    .prepare(
      `SELECT c.id as cart_item_id, c.quantity, p.id as product_id, p.name, p.price_cents, p.stock
       FROM cart_items c JOIN products p ON p.id = c.product_id
       WHERE c.user_id = ?`
    )
    .all(req.user.id);

  if (cartRows.length === 0) {
    return res.status(400).json({ error: 'EMPTY_CART' });
  }

  for (const row of cartRows) {
    if (row.quantity > row.stock) {
      return res.status(400).json({ error: 'OUT_OF_STOCK', message: `${row.name} does not have enough stock` });
    }
  }

  const total_cents = cartRows.reduce((sum, r) => sum + r.quantity * r.price_cents, 0);

  const placeOrder = db.transaction(() => {
    const orderInfo = db
      .prepare(
        'INSERT INTO orders (user_id, total_cents, status, shipping_name, shipping_address) VALUES (?, ?, ?, ?, ?)'
      )
      .run(req.user.id, total_cents, 'confirmed', shipping_name, shipping_address);

    const insertItem = db.prepare(
      'INSERT INTO order_items (order_id, product_id, product_name, quantity, price_cents) VALUES (?, ?, ?, ?, ?)'
    );
    const decrementStock = db.prepare('UPDATE products SET stock = stock - ? WHERE id = ?');

    for (const row of cartRows) {
      insertItem.run(orderInfo.lastInsertRowid, row.product_id, row.name, row.quantity, row.price_cents);
      decrementStock.run(row.quantity, row.product_id);
    }
    db.prepare('DELETE FROM cart_items WHERE user_id = ?').run(req.user.id);
    return orderInfo.lastInsertRowid;
  });

  const orderId = placeOrder();
  const order = db.prepare('SELECT * FROM orders WHERE id = ?').get(orderId);
  const items = db.prepare('SELECT * FROM order_items WHERE order_id = ?').all(orderId);
  res.status(201).json({ order: { ...order, items } });
});

// GET /api/orders  -> current user's own orders
router.get('/', requireAuth, (req, res) => {
  const orders = db.prepare('SELECT * FROM orders WHERE user_id = ? ORDER BY created_at DESC').all(req.user.id);
  const withItems = orders.map((o) => ({
    ...o,
    items: db.prepare('SELECT * FROM order_items WHERE order_id = ?').all(o.id)
  }));
  res.json({ orders: withItems });
});

// --- Admin ---
// GET /api/orders/admin/all
router.get('/admin/all', requireAdmin, (req, res) => {
  const orders = db
    .prepare(
      `SELECT o.*, u.email as user_email, u.name as user_name
       FROM orders o JOIN users u ON u.id = o.user_id
       ORDER BY o.created_at DESC`
    )
    .all();
  const withItems = orders.map((o) => ({
    ...o,
    items: db.prepare('SELECT * FROM order_items WHERE order_id = ?').all(o.id)
  }));
  res.json({ orders: withItems });
});

router.patch('/admin/:id/status', requireAdmin, (req, res) => {
  const { status } = req.body || {};
  const allowed = ['confirmed', 'processing', 'shipped', 'delivered', 'cancelled'];
  if (!allowed.includes(status)) return res.status(400).json({ error: 'INVALID_STATUS' });
  const info = db.prepare('UPDATE orders SET status = ? WHERE id = ?').run(status, req.params.id);
  if (info.changes === 0) return res.status(404).json({ error: 'NOT_FOUND' });
  res.json({ ok: true });
});

module.exports = router;
