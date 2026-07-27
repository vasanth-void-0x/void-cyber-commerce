const express = require('express');
const db = require('../db/db');
const { requireAuth } = require('../middleware/auth');

const router = express.Router();
router.use(requireAuth);

function getCart(userId) {
  const rows = db
    .prepare(
      `SELECT c.id as cart_item_id, c.quantity, p.*
       FROM cart_items c JOIN products p ON p.id = c.product_id
       WHERE c.user_id = ?`
    )
    .all(userId);
  const items = rows.map((r) => ({
    cart_item_id: r.cart_item_id,
    quantity: r.quantity,
    product: {
      id: r.id,
      slug: r.slug,
      name: r.name,
      category: r.category,
      price_cents: r.price_cents,
      stock: r.stock,
      glyph: r.glyph
    }
  }));
  const total_cents = items.reduce((sum, i) => sum + i.quantity * i.product.price_cents, 0);
  return { items, total_cents };
}

router.get('/', (req, res) => {
  res.json(getCart(req.user.id));
});

router.post('/items', (req, res) => {
  const { product_id, quantity } = req.body || {};
  const qty = Math.max(1, parseInt(quantity, 10) || 1);
  const product = db.prepare('SELECT * FROM products WHERE id = ?').get(product_id);
  if (!product) return res.status(404).json({ error: 'PRODUCT_NOT_FOUND' });
  if (product.stock < qty) return res.status(400).json({ error: 'OUT_OF_STOCK', message: 'not enough stock available' });

  const existing = db
    .prepare('SELECT * FROM cart_items WHERE user_id = ? AND product_id = ?')
    .get(req.user.id, product_id);
  if (existing) {
    db.prepare('UPDATE cart_items SET quantity = ? WHERE id = ?').run(existing.quantity + qty, existing.id);
  } else {
    db.prepare('INSERT INTO cart_items (user_id, product_id, quantity) VALUES (?, ?, ?)').run(
      req.user.id,
      product_id,
      qty
    );
  }
  res.status(201).json(getCart(req.user.id));
});

router.patch('/items/:cartItemId', (req, res) => {
  const { quantity } = req.body || {};
  const qty = parseInt(quantity, 10);
  if (!qty || qty < 1) return res.status(400).json({ error: 'INVALID_QUANTITY' });
  const item = db
    .prepare('SELECT * FROM cart_items WHERE id = ? AND user_id = ?')
    .get(req.params.cartItemId, req.user.id);
  if (!item) return res.status(404).json({ error: 'NOT_FOUND' });
  db.prepare('UPDATE cart_items SET quantity = ? WHERE id = ?').run(qty, item.id);
  res.json(getCart(req.user.id));
});

router.delete('/items/:cartItemId', (req, res) => {
  db.prepare('DELETE FROM cart_items WHERE id = ? AND user_id = ?').run(req.params.cartItemId, req.user.id);
  res.json(getCart(req.user.id));
});

router.delete('/', (req, res) => {
  db.prepare('DELETE FROM cart_items WHERE user_id = ?').run(req.user.id);
  res.json(getCart(req.user.id));
});

module.exports = router;
