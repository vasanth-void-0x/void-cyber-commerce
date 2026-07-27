const accessCheckEl = document.getElementById('access-check');
const shellEl = document.getElementById('admin-shell');

async function init() {
  const user = await getSession();
  if (!user) {
    accessCheckEl.innerHTML = `<div class="panel"><h3>Access denied</h3><p style="color:var(--text-dim); font-size:13px; margin-top:8px;">Console access requires authentication. <a href="/login.html">Log in</a>.</p></div>`;
    return;
  }
  if (user.role !== 'admin') {
    accessCheckEl.innerHTML = `<div class="panel"><h3>Access denied</h3><p style="color:var(--text-dim); font-size:13px; margin-top:8px;">This identity does not hold console clearance.</p></div>`;
    return;
  }
  shellEl.style.display = 'grid';
  setupTabs();
  loadStats();
  loadProducts();
  loadOrders();
  loadUsers();
}

function setupTabs() {
  document.querySelectorAll('.admin-tab').forEach((btn) => {
    btn.addEventListener('click', () => {
      document.querySelectorAll('.admin-tab').forEach((b) => b.classList.remove('active'));
      document.querySelectorAll('.tab-panel').forEach((p) => p.classList.remove('active'));
      btn.classList.add('active');
      document.getElementById(`tab-${btn.dataset.tab}`).classList.add('active');
    });
  });
}

// ---------------- Overview ----------------
async function loadStats() {
  const grid = document.getElementById('stat-grid');
  try {
    const s = await api('/admin/stats');
    grid.innerHTML = `
      <div class="panel stat-card"><div class="eyebrow">Revenue</div><div class="stat-value">$${formatPrice(s.revenue_cents)}</div></div>
      <div class="panel stat-card"><div class="eyebrow">Orders</div><div class="stat-value">${s.order_count}</div></div>
      <div class="panel stat-card"><div class="eyebrow">Users</div><div class="stat-value">${s.user_count}</div></div>
      <div class="panel stat-card"><div class="eyebrow">Low stock</div><div class="stat-value">${s.low_stock_count}</div></div>
    `;
  } catch (e) {
    grid.innerHTML = `<div class="empty-state">Could not load stats.</div>`;
  }
}

// ---------------- Products ----------------
let editingProductId = null;

async function loadProducts() {
  const table = document.getElementById('products-table');
  try {
    const { products } = await api('/products');
    table.innerHTML = `
      <tr><th>Device</th><th>Category</th><th>Price</th><th>Stock</th><th></th></tr>
      ${products
        .map(
          (p) => `
        <tr>
          <td>${escapeHtml(p.name)}</td>
          <td>${escapeHtml(p.category)}</td>
          <td>$${formatPrice(p.price_cents)}</td>
          <td>${p.stock}</td>
          <td>
            <button class="btn btn-sm" data-edit="${p.id}">Edit</button>
            <button class="btn btn-sm btn-danger" data-delete="${p.id}">Delete</button>
          </td>
        </tr>`
        )
        .join('')}
    `;
    table.querySelectorAll('[data-edit]').forEach((b) =>
      b.addEventListener('click', () => openProductForm(products.find((p) => p.id == b.dataset.edit)))
    );
    table.querySelectorAll('[data-delete]').forEach((b) =>
      b.addEventListener('click', () => deleteProduct(b.dataset.delete))
    );
  } catch (e) {
    table.innerHTML = `<tr><td>Could not load products.</td></tr>`;
  }
}

document.getElementById('new-product-btn').addEventListener('click', () => openProductForm(null));

function openProductForm(product) {
  editingProductId = product ? product.id : null;
  const panel = document.getElementById('product-form-panel');
  panel.style.display = 'block';
  const specsText = product ? JSON.stringify(product.specs || {}, null, 2) : '{\n  \n}';
  panel.innerHTML = `
    <div class="eyebrow" style="margin-bottom:14px;">${product ? 'Edit device' : 'New device'}</div>
    <form id="product-form">
      <div class="product-form-grid">
        <div class="field"><label>Name</label><input type="text" id="pf-name" required value="${product ? escapeHtml(product.name) : ''}"></div>
        <div class="field"><label>Slug</label><input type="text" id="pf-slug" ${product ? 'disabled' : 'required'} value="${product ? escapeHtml(product.slug) : ''}"></div>
        <div class="field"><label>Category</label><input type="text" id="pf-category" required value="${product ? escapeHtml(product.category) : ''}"></div>
        <div class="field"><label>Glyph (2-3 chars)</label><input type="text" id="pf-glyph" maxlength="4" value="${product ? escapeHtml(product.glyph) : 'V0'}"></div>
        <div class="field"><label>Price (USD)</label><input type="number" step="0.01" id="pf-price" required value="${product ? (product.price_cents / 100).toFixed(2) : ''}"></div>
        <div class="field"><label>Stock</label><input type="number" id="pf-stock" required value="${product ? product.stock : 0}"></div>
        <div class="field"><label>Signal strength (1-5)</label><input type="number" min="1" max="5" id="pf-signal" value="${product ? product.signal_strength : 3}"></div>
      </div>
      <div class="field"><label>Short description</label><input type="text" id="pf-short" required value="${product ? escapeHtml(product.short_desc) : ''}"></div>
      <div class="field"><label>Full description</label><textarea id="pf-desc" rows="3">${product ? escapeHtml(product.description) : ''}</textarea></div>
      <div class="field"><label>Specs (JSON)</label><textarea id="pf-specs" rows="4">${escapeHtml(specsText)}</textarea></div>
      <div class="form-error" id="pf-error"></div>
      <div style="display:flex; gap:10px;">
        <button class="btn btn-primary" type="submit">${product ? 'Save changes' : 'Create device'}</button>
        <button class="btn" type="button" id="pf-cancel">Cancel</button>
      </div>
    </form>
  `;
  document.getElementById('pf-cancel').addEventListener('click', () => {
    panel.style.display = 'none';
  });
  document.getElementById('product-form').addEventListener('submit', submitProductForm);
}

async function submitProductForm(e) {
  e.preventDefault();
  const errorEl = document.getElementById('pf-error');
  errorEl.textContent = '';
  let specs;
  try {
    specs = JSON.parse(document.getElementById('pf-specs').value || '{}');
  } catch (err) {
    errorEl.textContent = 'Specs must be valid JSON';
    return;
  }
  const payload = {
    name: document.getElementById('pf-name').value,
    category: document.getElementById('pf-category').value,
    glyph: document.getElementById('pf-glyph').value || 'V0',
    price_cents: Math.round(parseFloat(document.getElementById('pf-price').value) * 100),
    stock: parseInt(document.getElementById('pf-stock').value, 10),
    signal_strength: parseInt(document.getElementById('pf-signal').value, 10) || 3,
    short_desc: document.getElementById('pf-short').value,
    description: document.getElementById('pf-desc').value,
    specs
  };
  try {
    if (editingProductId) {
      await api(`/products/${editingProductId}`, { method: 'PUT', body: payload });
      showToast('Device updated');
    } else {
      payload.slug = document.getElementById('pf-slug').value;
      await api('/products', { method: 'POST', body: payload });
      showToast('Device created');
    }
    document.getElementById('product-form-panel').style.display = 'none';
    loadProducts();
    loadStats();
  } catch (err) {
    errorEl.textContent = err.message || 'Save failed';
  }
}

async function deleteProduct(id) {
  if (!confirm('Remove this device from the catalog?')) return;
  try {
    await api(`/products/${id}`, { method: 'DELETE' });
    showToast('Device removed');
    loadProducts();
    loadStats();
  } catch (e) {
    showToast('Could not delete device', true);
  }
}

// ---------------- Orders ----------------
const STATUSES = ['confirmed', 'processing', 'shipped', 'delivered', 'cancelled'];

async function loadOrders() {
  const table = document.getElementById('orders-table');
  try {
    const { orders } = await api('/orders/admin/all');
    table.innerHTML = `
      <tr><th>Order</th><th>Customer</th><th>Items</th><th>Total</th><th>Status</th></tr>
      ${orders
        .map(
          (o) => `
        <tr>
          <td>#${o.id}<br><span style="color:var(--text-faint); font-size:11px;">${new Date(o.created_at).toLocaleDateString()}</span></td>
          <td>${escapeHtml(o.user_name)}<br><span style="color:var(--text-faint); font-size:11px;">${escapeHtml(o.user_email)}</span></td>
          <td>${o.items.map((it) => `${escapeHtml(it.product_name)} ×${it.quantity}`).join('<br>')}</td>
          <td>$${formatPrice(o.total_cents)}</td>
          <td>
            <select data-order="${o.id}">
              ${STATUSES.map((s) => `<option value="${s}" ${s === o.status ? 'selected' : ''}>${s}</option>`).join('')}
            </select>
          </td>
        </tr>`
        )
        .join('')}
    `;
    table.querySelectorAll('select[data-order]').forEach((sel) => {
      sel.addEventListener('change', async () => {
        try {
          await api(`/orders/admin/${sel.dataset.order}/status`, { method: 'PATCH', body: { status: sel.value } });
          showToast(`Order #${sel.dataset.order} -> ${sel.value}`);
        } catch (e) {
          showToast('Could not update status', true);
        }
      });
    });
  } catch (e) {
    table.innerHTML = `<tr><td>Could not load orders.</td></tr>`;
  }
}

// ---------------- Users ----------------
async function loadUsers() {
  const table = document.getElementById('users-table');
  try {
    const { users } = await api('/admin/users');
    table.innerHTML = `
      <tr><th>Name</th><th>Email</th><th>Role</th><th>Joined</th></tr>
      ${users
        .map(
          (u) => `<tr><td>${escapeHtml(u.name)}</td><td>${escapeHtml(u.email)}</td><td>${escapeHtml(u.role)}</td><td>${new Date(u.created_at).toLocaleDateString()}</td></tr>`
        )
        .join('')}
    `;
  } catch (e) {
    table.innerHTML = `<tr><td>Could not load users.</td></tr>`;
  }
}

init();
