# ThreatMart

> Signal-intercept commerce for authorized security research.

[![Live Demo](https://img.shields.io/badge/LIVE_DEMO-OPEN_THREATMART-8B5CF6?style=for-the-badge&logo=render&logoColor=white)](https://void-cyber-store.onrender.com/)
[![Node.js](https://img.shields.io/badge/Node.js-Express-14B8A6?style=flat-square&logo=node.js&logoColor=white)](https://nodejs.org/)
[![SQLite](https://img.shields.io/badge/Database-SQLite-334155?style=flat-square&logo=sqlite&logoColor=white)](https://www.sqlite.org/)

ThreatMart is a full-stack cybersecurity and IoT hardware marketplace with a premium dark interface, responsive product discovery, secure account flows, persistent cart, checkout, order history, and an admin operations console.

## Live demo

**[Launch ThreatMart →](https://void-cyber-store.onrender.com/)**

> The free hosting instance may take a few seconds to wake up on the first visit.

## Screenshots

### Storefront

![ThreatMart modern storefront](docs/screenshots/storefront.jpg)

### Crystal brand identity

<p align="center">
  <img src="docs/screenshots/brand.png" alt="ThreatMart crystal V brand identity" width="560" />
</p>

## Highlights

- Modern cyber-commerce UI with crystal-purple branding, responsive layouts, micro-interactions, and scroll reveals
- Searchable catalog with category filters, stock signals, realistic product imagery, and product detail pages
- Secure registration and login with bcrypt password hashing and JWT authentication in an HTTP-only cookie
- Persistent shopping cart, stock-aware checkout, and customer order history
- Admin dashboard with store metrics, product management, inventory controls, users, orders, and fulfillment status
- SQLite-backed API built with Node.js and Express

## Tech stack

| Layer | Technology |
|---|---|
| Frontend | HTML5, CSS3, Vanilla JavaScript |
| Backend | Node.js, Express |
| Database | SQLite with `better-sqlite3` |
| Authentication | bcryptjs, JWT, HTTP-only cookies |
| Deployment | Render |

## Run locally

```bash
git clone https://github.com/vasanth-void-0x/void-cyber-commerce.git
cd void-cyber-commerce
npm install
npm start
```

Open `http://localhost:3000` in your browser.

For development with automatic restart:

```bash
npm run dev
```

## Project structure

```text
void-cyber-commerce/
├── public/             # Storefront, account, cart and admin UI
├── server.js           # Express app and API routes
├── db.js               # SQLite schema, seed data and queries
├── package.json        # Scripts and dependencies
└── docs/screenshots/   # README previews
```

## Responsible use

ThreatMart is a portfolio and educational project. The catalog is presented for authorized security research, defensive testing, and lab use only.

---

Built by [Vasanth](https://github.com/vasanth-void-0x).
