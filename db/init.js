require('dotenv').config();
const bcrypt = require('bcryptjs');
const db = require('./db');

db.exec(`
CREATE TABLE IF NOT EXISTS users (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  email TEXT UNIQUE NOT NULL,
  password_hash TEXT NOT NULL,
  name TEXT NOT NULL,
  role TEXT NOT NULL DEFAULT 'user',
  created_at TEXT DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS products (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  slug TEXT UNIQUE NOT NULL,
  name TEXT NOT NULL,
  category TEXT NOT NULL,
  price_cents INTEGER NOT NULL,
  stock INTEGER NOT NULL DEFAULT 0,
  short_desc TEXT,
  description TEXT,
  specs_json TEXT,
  signal_strength INTEGER DEFAULT 3,
  glyph TEXT DEFAULT 'V',
  created_at TEXT DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS cart_items (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  product_id INTEGER NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  quantity INTEGER NOT NULL DEFAULT 1,
  UNIQUE(user_id, product_id)
);

CREATE TABLE IF NOT EXISTS orders (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  total_cents INTEGER NOT NULL,
  status TEXT NOT NULL DEFAULT 'confirmed',
  shipping_name TEXT,
  shipping_address TEXT,
  created_at TEXT DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS order_items (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  order_id INTEGER NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
  product_id INTEGER NOT NULL,
  product_name TEXT NOT NULL,
  quantity INTEGER NOT NULL,
  price_cents INTEGER NOT NULL
);
`);

// --- Seed admin ---
const adminEmail = process.env.ADMIN_EMAIL || 'admin@voidstore.io';
const adminPassword = process.env.ADMIN_PASSWORD || 'ChangeMe123!';
const existingAdmin = db.prepare('SELECT id FROM users WHERE email = ?').get(adminEmail);
if (!existingAdmin) {
  const hash = bcrypt.hashSync(adminPassword, 10);
  db.prepare('INSERT INTO users (email, password_hash, name, role) VALUES (?, ?, ?, ?)')
    .run(adminEmail, hash, 'Root Admin', 'admin');
  console.log(`[seed] admin created -> ${adminEmail} / ${adminPassword}`);
} else {
  console.log('[seed] admin already exists, skipping');
}

// --- Seed products (real-world pentest / IoT security hardware categories) ---
const products = [
  {
    slug: 'flipper-zero',
    name: 'Flipper Zero',
    category: 'Multi-tool',
    price_cents: 16900,
    stock: 24,
    short_desc: 'Portable multi-protocol pentest companion — RFID, sub-GHz, NFC, IR, GPIO.',
    description: 'A pocket-sized multi-tool for exploring RFID, sub-GHz radio, NFC, infrared and hardware GPIO. Ships with a dolphin-themed firmware and an open SDK for custom apps.',
    specs: { display: '1.4" monochrome', radio: 'Sub-1GHz + NFC/RFID + IR', battery: '2000mAh', connectivity: 'USB-C, BLE' },
    signal_strength: 5,
    glyph: 'F0'
  },
  {
    slug: 'wifi-pineapple-mk7',
    name: 'WiFi Pineapple Mark VII',
    category: 'Wireless Auditing',
    price_cents: 19999,
    stock: 12,
    short_desc: 'Dual-band wireless auditing platform for rogue AP and client testing.',
    description: 'Industry-standard rogue access point platform used for authorized wireless penetration testing engagements. Dual-band radios with a full campaign management web UI.',
    specs: { bands: '2.4GHz + 5GHz', interfaces: '2x radio + Ethernet', power: 'USB-C PD', os: 'Custom Linux' },
    signal_strength: 5,
    glyph: 'W7'
  },
  {
    slug: 'hackrf-one',
    name: 'HackRF One SDR',
    category: 'Radio / SDR',
    price_cents: 32900,
    stock: 9,
    short_desc: 'Open-source software defined radio, 1MHz–6GHz, half-duplex TX/RX.',
    description: 'A widely-used open-hardware SDR platform for signal analysis, protocol reverse engineering and RF research from 1 MHz to 6 GHz.',
    specs: { range: '1MHz - 6GHz', sample_rate: '20 Msps', interface: 'USB 2.0', duplex: 'Half-duplex' },
    signal_strength: 4,
    glyph: 'HR'
  },
  {
    slug: 'proxmark3-rdv4',
    name: 'Proxmark3 RDV4',
    category: 'RFID / NFC',
    price_cents: 34900,
    stock: 7,
    short_desc: 'The reference tool for RFID/NFC research, cloning and protocol analysis.',
    description: 'The gold-standard RFID/NFC research platform, capable of low- and high-frequency card analysis, simulation and cloning for authorized access-control audits.',
    specs: { freq: 'LF 125kHz + HF 13.56MHz', battery: 'Optional add-on', storage: 'microSD' },
    signal_strength: 5,
    glyph: 'PX'
  },
  {
    slug: 'usb-rubber-ducky',
    name: 'USB Rubber Ducky',
    category: 'Payload Delivery',
    price_cents: 8999,
    stock: 40,
    short_desc: 'Keystroke-injection platform disguised as a USB drive.',
    description: 'A HID-emulating USB payload platform used to demonstrate keystroke-injection attack vectors in physical/USB security awareness engagements.',
    specs: { language: 'DuckyScript 3.0', storage: '128MB', form: 'USB-A' },
    signal_strength: 3,
    glyph: 'RD'
  },
  {
    slug: 'lan-turtle',
    name: 'LAN Turtle',
    category: 'Network Implant',
    price_cents: 6999,
    stock: 18,
    short_desc: 'Covert Ethernet-based systems administration & network access tool.',
    description: 'A stealthy USB-Ethernet adapter that provides remote access, network intelligence gathering and MITM capabilities for authorized internal network assessments.',
    specs: { interface: 'USB-A to RJ45', os: 'OpenWrt Linux', access: 'SSH / Cloud C2' },
    signal_strength: 3,
    glyph: 'LT'
  },
  {
    slug: 'bash-bunny-mk2',
    name: 'Bash Bunny Mark II',
    category: 'Payload Delivery',
    price_cents: 12900,
    stock: 15,
    short_desc: 'Multi-vector USB attack platform for physical pentest engagements.',
    description: 'A quad-core USB attack platform that emulates trusted devices to automate multi-vector payload delivery during authorized physical security assessments.',
    specs: { cores: 'Quad-core ARM', storage: '8GB', switch_positions: 3 },
    signal_strength: 4,
    glyph: 'BB'
  },
  {
    slug: 'omg-cable',
    name: 'O.MG Elite Cable',
    category: 'Payload Delivery',
    price_cents: 17900,
    stock: 10,
    short_desc: 'Covert implant cable with Wi-Fi payload delivery and keylogging demo mode.',
    description: 'A lightning/USB-C cable with an embedded implant for remote payload delivery and keystroke capture demonstrations in red-team physical security engagements.',
    specs: { connectivity: 'Self-hosted WiFi AP', geofencing: 'Yes', form: 'USB-C / Lightning' },
    signal_strength: 4,
    glyph: 'OG'
  },
  {
    slug: 'alfa-awus036ach',
    name: 'Alfa AWUS036ACH',
    category: 'Wireless Auditing',
    price_cents: 5499,
    stock: 30,
    short_desc: 'High-gain dual-band USB wireless adapter with monitor mode + injection.',
    description: 'A dual-band long-range USB WiFi adapter widely used for wireless auditing labs, supporting monitor mode and packet injection out of the box on common toolkits.',
    specs: { chipset: 'RTL8812AU', bands: '2.4/5GHz', antenna: 'Dual 5dBi' },
    signal_strength: 3,
    glyph: 'AW'
  },
  {
    slug: 'pentest-pi-kit',
    name: 'Raspberry Pi 4 Pentest Kit',
    category: 'Field Kit',
    price_cents: 14900,
    stock: 20,
    short_desc: 'Pre-configured drop-box kit for internal network assessments.',
    description: 'A Raspberry Pi 4 pre-loaded with common open-source assessment tooling, packaged as a discreet drop-box for authorized on-site internal network testing.',
    specs: { board: 'Raspberry Pi 4 (4GB)', storage: '64GB microSD', power: '5V/3A USB-C' },
    signal_strength: 4,
    glyph: 'PI'
  },
  {
    slug: 'yubikey-5c',
    name: 'YubiKey 5C NFC',
    category: 'Defensive / Auth',
    price_cents: 5500,
    stock: 50,
    short_desc: 'Hardware security key for phishing-resistant multi-factor auth.',
    description: 'A hardware authentication key supporting FIDO2/WebAuthn, used both offensively in lab demos and defensively to harden real account access with phishing-resistant MFA.',
    specs: { protocols: 'FIDO2, U2F, OTP, PIV', connector: 'USB-C + NFC' },
    signal_strength: 2,
    glyph: 'YK'
  },
  {
    slug: 'faraday-pouch',
    name: 'Faraday Signal Isolation Pouch',
    category: 'Field Kit',
    price_cents: 2499,
    stock: 60,
    short_desc: 'RF-shielded pouch for isolating devices during forensic acquisition.',
    description: 'A signal-blocking pouch used to isolate mobile devices from cellular/WiFi/Bluetooth networks during digital forensics and incident response evidence handling.',
    specs: { shielding: '>80dB attenuation', size: 'Fits most phones/tablets' },
    signal_strength: 1,
    glyph: 'FP'
  }
];

const insertProduct = db.prepare(`
  INSERT OR IGNORE INTO products (slug, name, category, price_cents, stock, short_desc, description, specs_json, signal_strength, glyph)
  VALUES (@slug, @name, @category, @price_cents, @stock, @short_desc, @description, @specs_json, @signal_strength, @glyph)
`);

const insertMany = db.transaction((rows) => {
  for (const p of rows) {
    insertProduct.run({ ...p, specs_json: JSON.stringify(p.specs) });
  }
});

insertMany(products);
console.log(`[seed] ${products.length} products ensured in catalog`);
