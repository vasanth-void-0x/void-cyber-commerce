# VOID // Cyberstore

A full-stack e-commerce site for a cybersecurity / IoT pentest hardware store.
Theme: "intercepted alien signal console" — dark violet/teal, hex-cut panels, terminal-style labels.

**Stack:** Node.js + Express + SQLite (better-sqlite3), vanilla JS frontend (no build step), JWT auth in an httpOnly cookie.

## Features

- Product catalog with category filter + search
- User registration / login (bcrypt + JWT httpOnly cookie)
- Cart (add / update qty / remove), persisted per user in the DB
- Checkout flow -> creates an order, decrements stock
- Order history for logged-in users
- Admin console (`/admin/index.html`) — protected, admin role only:
  - Revenue / order / user / low-stock overview
  - Product CRUD
  - Order list + status updates (confirmed -> processing -> shipped -> delivered / cancelled)
  - User list

## Run locally

```bash
cd cyberstore
npm install
cp .env.example .env      # then edit JWT_SECRET, ADMIN_EMAIL, ADMIN_PASSWORD
npm start
```

Visit `http://localhost:3000`. The DB (`db/voidstore.sqlite`) and the admin account are created automatically
on first boot, using `ADMIN_EMAIL` / `ADMIN_PASSWORD` from `.env`. **Change these before deploying anywhere public.**

To reseed products (e.g. after editing the seed list in `db/init.js`):
```bash
npm run seed
```
(safe to re-run — it skips existing rows).

## Project structure

```
server.js              Express app entry
db/
  db.js                sqlite connection
  init.js               schema + seed data (products, admin user)
middleware/auth.js      JWT verify, requireAuth / requireAdmin
routes/
  auth.js               register / login / logout / me
  products.js            public catalog + admin CRUD
  cart.js                per-user cart
  orders.js              checkout, order history, admin order management
  admin.js                stats + user list
public/
  index.html, product.html, cart.html, checkout.html,
  orders.html, login.html, register.html
  admin/index.html        admin console (tabs: overview, products, orders, users)
  css/style.css           theme
  js/*.js                 page logic
```

## Deploying

This is a single Node process with a local SQLite file, so it fits any host that gives you a
persistent disk (SQLite needs the file to survive restarts):

- **Render / Railway / Fly.io** — easiest path. Add a persistent volume mounted at `db/`,
  set `JWT_SECRET`, `ADMIN_EMAIL`, `ADMIN_PASSWORD` as environment variables, start command `npm start`.
- **A VPS (e.g. DigitalOcean droplet)** — `git clone`, `npm install --production`, run behind
  `pm2` or `systemd`, reverse-proxy through nginx with TLS (certbot).
- **Vercel/Netlify serverless** — not a good fit as-is, since SQLite needs a writable persistent
  disk and these platforms are ephemeral/serverless. You'd need to swap `better-sqlite3` for a
  hosted Postgres (e.g. Neon/Supabase) first.

Before going live:
1. Set a long random `JWT_SECRET`.
2. Change `ADMIN_EMAIL` / `ADMIN_PASSWORD`, then log in as admin and change the password (there's
   no in-app password-change flow yet — do it by re-registering an admin row or adding one).
3. Set `NODE_ENV=production` so auth cookies are marked `secure` (requires HTTPS).
4. Put it behind HTTPS (nginx + certbot, or your host's built-in TLS).

## Notes / extension points

- Checkout is a mock "confirm order" flow (no real payment gateway). To take real payments,
  swap the `/api/orders/checkout` handler to create a Stripe Checkout Session first, then create
  the order from a webhook on payment success.
- All catalog items are real, legitimate security-research/pentest hardware categories
  (Flipper Zero, HackRF, Proxmark3, YubiKey, etc.) — edit `db/init.js` to change the catalog.
- Admin promotion: there's no UI for it yet. To make a second admin, update the `role` column
  for that user's row directly in `db/voidstore.sqlite`, or add a POST /api/admin/users/:id/role route.
