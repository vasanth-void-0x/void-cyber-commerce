const express = require('express');
const bcrypt = require('bcryptjs');
const db = require('../db/db');
const { signToken, requireAuth } = require('../middleware/auth');

const router = express.Router();

const isProd = process.env.NODE_ENV === 'production';
const cookieOpts = {
  httpOnly: true,
  sameSite: 'lax',
  secure: isProd,
  maxAge: 7 * 24 * 60 * 60 * 1000
};

router.post('/register', (req, res) => {
  const { email, password, name } = req.body || {};
  if (!email || !password || !name) {
    return res.status(400).json({ error: 'MISSING_FIELDS', message: 'email, password and name are required' });
  }
  if (password.length < 8) {
    return res.status(400).json({ error: 'WEAK_PASSWORD', message: 'password must be at least 8 characters' });
  }
  const existing = db.prepare('SELECT id FROM users WHERE email = ?').get(email.toLowerCase());
  if (existing) {
    return res.status(409).json({ error: 'EMAIL_TAKEN', message: 'an account with this email already exists' });
  }
  const hash = bcrypt.hashSync(password, 10);
  const info = db
    .prepare('INSERT INTO users (email, password_hash, name, role) VALUES (?, ?, ?, ?)')
    .run(email.toLowerCase(), hash, name, 'user');
  const user = { id: info.lastInsertRowid, email: email.toLowerCase(), name, role: 'user' };
  const token = signToken(user);
  res.cookie('token', token, cookieOpts);
  res.status(201).json({ user });
});

router.post('/login', (req, res) => {
  const { email, password } = req.body || {};
  if (!email || !password) return res.status(400).json({ error: 'MISSING_FIELDS' });
  const user = db.prepare('SELECT * FROM users WHERE email = ?').get(email.toLowerCase());
  if (!user || !bcrypt.compareSync(password, user.password_hash)) {
    return res.status(401).json({ error: 'INVALID_CREDENTIALS', message: 'email or password is incorrect' });
  }
  const token = signToken(user);
  res.cookie('token', token, cookieOpts);
  res.json({ user: { id: user.id, email: user.email, name: user.name, role: user.role } });
});

router.post('/logout', (req, res) => {
  res.clearCookie('token');
  res.json({ ok: true });
});

router.get('/me', requireAuth, (req, res) => {
  res.json({ user: req.user });
});

module.exports = router;
