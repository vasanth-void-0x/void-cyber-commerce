const express = require('express');
const db = require('../db/db');
const { requireAdmin } = require('../middleware/auth');

const router = express.Router();

function serialize(p) {
  return { ...p, specs: p.specs_json ? JSON.parse(p.specs_json) : {} };
}

// GET /api/products?category=&q=
router.get('/', (req, res) => {
  const { category, q } = req.query;
  let sql = 'SELECT * FROM products WHERE 1=1';
  const params = [];
  if (category) {
    sql += ' AND category = ?';
    params.push(category);
  }
  if (q) {
    sql += ' AND (name LIKE ? OR short_desc LIKE ?)';
    params.push(`%${q}%`, `%${q}%`);
  }
  sql += ' ORDER BY created_at DESC';
  const rows = db.prepare(sql).all(...params);
  res.json({ products: rows.map(serialize) });
});

router.get('/categories', (req, res) => {
  const rows = db.prepare('SELECT DISTINCT category FROM products ORDER BY category').all();
  res.json({ categories: rows.map((r) => r.category) });
});

router.get('/:slug', (req, res) => {
  const row = db.prepare('SELECT * FROM products WHERE slug = ?').get(req.params.slug);
  if (!row) return res.status(404).json({ error: 'NOT_FOUND' });
  res.json({ product: serialize(row) });
});

// --- Admin CRUD ---
router.post('/', requireAdmin, (req, res) => {
  const { slug, name, category, price_cents, stock, short_desc, description, specs, signal_strength, glyph } = req.body || {};
  if (!slug || !name || !category || price_cents == null) {
    return res.status(400).json({ error: 'MISSING_FIELDS' });
  }
  try {
    const info = db
      .prepare(
        `INSERT INTO products (slug, name, category, price_cents, stock, short_desc, description, specs_json, signal_strength, glyph)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
      )
      .run(
        slug,
        name,
        category,
        price_cents,
        stock || 0,
        short_desc || '',
        description || '',
        JSON.stringify(specs || {}),
        signal_strength || 3,
        glyph || 'V'
      );
    const row = db.prepare('SELECT * FROM products WHERE id = ?').get(info.lastInsertRowid);
    res.status(201).json({ product: serialize(row) });
  } catch (e) {
    if (String(e).includes('UNIQUE')) return res.status(409).json({ error: 'SLUG_TAKEN' });
    res.status(500).json({ error: 'SERVER_ERROR' });
  }
});

router.put('/:id', requireAdmin, (req, res) => {
  const existing = db.prepare('SELECT * FROM products WHERE id = ?').get(req.params.id);
  if (!existing) return res.status(404).json({ error: 'NOT_FOUND' });
  const merged = {
    name: req.body.name ?? existing.name,
    category: req.body.category ?? existing.category,
    price_cents: req.body.price_cents ?? existing.price_cents,
    stock: req.body.stock ?? existing.stock,
    short_desc: req.body.short_desc ?? existing.short_desc,
    description: req.body.description ?? existing.description,
    specs_json: req.body.specs ? JSON.stringify(req.body.specs) : existing.specs_json,
    signal_strength: req.body.signal_strength ?? existing.signal_strength,
    glyph: req.body.glyph ?? existing.glyph
  };
  db.prepare(
    `UPDATE products SET name=?, category=?, price_cents=?, stock=?, short_desc=?, description=?, specs_json=?, signal_strength=?, glyph=? WHERE id=?`
  ).run(
    merged.name,
    merged.category,
    merged.price_cents,
    merged.stock,
    merged.short_desc,
    merged.description,
    merged.specs_json,
    merged.signal_strength,
    merged.glyph,
    req.params.id
  );
  const row = db.prepare('SELECT * FROM products WHERE id = ?').get(req.params.id);
  res.json({ product: serialize(row) });
});

router.delete('/:id', requireAdmin, (req, res) => {
  const info = db.prepare('DELETE FROM products WHERE id = ?').run(req.params.id);
  if (info.changes === 0) return res.status(404).json({ error: 'NOT_FOUND' });
  res.json({ ok: true });
});

module.exports = router;
