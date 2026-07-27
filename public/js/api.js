// Shared helpers used across every page.

async function api(path, options = {}) {
  const res = await fetch(`/api${path}`, {
    credentials: 'include',
    headers: { 'Content-Type': 'application/json' },
    ...options,
    body: options.body ? JSON.stringify(options.body) : undefined
  });
  let data = null;
  try { data = await res.json(); } catch (e) { /* no body */ }
  if (!res.ok) {
    const err = new Error(data?.message || data?.error || 'REQUEST_FAILED');
    err.code = data?.error;
    err.status = res.status;
    throw err;
  }
  return data;
}

function formatPrice(cents) {
  return (cents / 100).toFixed(2);
}

function showToast(message, isError = false) {
  const existing = document.querySelector('.toast');
  if (existing) existing.remove();
  const el = document.createElement('div');
  el.className = 'toast' + (isError ? ' err' : '');
  el.textContent = message;
  document.body.appendChild(el);
  setTimeout(() => el.remove(), 3200);
}

function signalClass(strength) {
  return `signal on-${Math.max(1, Math.min(5, strength || 1))}`;
}

function stockTag(stock) {
  if (stock <= 0) return { label: 'DEPLETED', cls: 'out' };
  if (stock <= 5) return { label: `LOW · ${stock} LEFT`, cls: 'low' };
  return { label: 'IN STOCK', cls: 'ok' };
}

// --- session state shared across pages ---
let CURRENT_USER = undefined; // undefined = not yet checked

async function getSession() {
  if (CURRENT_USER !== undefined) return CURRENT_USER;
  try {
    const data = await api('/auth/me');
    CURRENT_USER = data.user;
  } catch (e) {
    CURRENT_USER = null;
  }
  return CURRENT_USER;
}

async function refreshCartBadge() {
  const badgeEl = document.getElementById('cart-badge');
  if (!badgeEl) return;
  const user = await getSession();
  if (!user) { badgeEl.style.display = 'none'; return; }
  try {
    const cart = await api('/cart');
    const count = cart.items.reduce((s, i) => s + i.quantity, 0);
    if (count > 0) {
      badgeEl.textContent = count;
      badgeEl.style.display = 'grid';
    } else {
      badgeEl.style.display = 'none';
    }
  } catch (e) {
    badgeEl.style.display = 'none';
  }
}

async function renderNav() {
  const navAuth = document.getElementById('nav-auth');
  if (!navAuth) return;
  const user = await getSession();
  if (user) {
    navAuth.innerHTML = `
      <a href="/orders.html">Orders</a>
      ${user.role === 'admin' ? '<a href="/admin/index.html">Admin</a>' : ''}
      <a href="#" id="logout-link">Logout (${escapeHtml(user.name.split(' ')[0])})</a>
    `;
    document.getElementById('logout-link').addEventListener('click', async (e) => {
      e.preventDefault();
      await api('/auth/logout', { method: 'POST' });
      CURRENT_USER = null;
      window.location.href = '/index.html';
    });
  } else {
    navAuth.innerHTML = `<a href="/login.html">Login</a> <a href="/register.html">Register</a>`;
  }
  refreshCartBadge();
}

function escapeHtml(str) {
  const div = document.createElement('div');
  div.textContent = str;
  return div.innerHTML;
}

function requireLogin(redirectMsg) {
  getSession().then((user) => {
    if (!user) {
      sessionStorage.setItem('void_redirect_after_login', window.location.pathname);
      if (redirectMsg) sessionStorage.setItem('void_redirect_msg', redirectMsg);
      window.location.href = '/login.html';
    }
  });
}

document.addEventListener('DOMContentLoaded', renderNav);
