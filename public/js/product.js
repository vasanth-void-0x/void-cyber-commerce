const wrap = document.getElementById('detail-wrap');
const params = new URLSearchParams(window.location.search);
const slug = params.get('slug');

let currentProduct = null;
let qty = 1;

async function load() {
  if (!slug) {
    wrap.innerHTML = `<div class="empty-state"><h3>No device specified</h3></div>`;
    return;
  }
  try {
    const { product } = await api(`/products/${encodeURIComponent(slug)}`);
    currentProduct = product;
    document.getElementById('crumb-name').textContent = product.name;
    document.title = `VOID // ${product.name}`;
    render(product);
  } catch (e) {
    wrap.innerHTML = `<div class="empty-state"><h3>Signal lost</h3>That device could not be located in the catalog.</div>`;
  }
}

function render(p) {
  const tag = stockTag(p.stock);
  const specRows = Object.entries(p.specs || {})
    .map(([k, v]) => `<tr><td>${escapeHtml(k.replace(/_/g, ' '))}</td><td>${escapeHtml(String(v))}</td></tr>`)
    .join('');

  wrap.innerHTML = `
    <div class="detail-grid">
      <div>
        <div class="detail-glyph">${escapeHtml(p.glyph)}</div>
      </div>
      <div>
        <div class="card-cat">${escapeHtml(p.category)}</div>
        <h1 class="detail-title">${escapeHtml(p.name)}</h1>
        <span class="${signalClass(p.signal_strength)}"><i></i><i></i><i></i><i></i><i></i></span>
        <p style="color:var(--text-dim); margin-top:14px; max-width:520px;">${escapeHtml(p.description)}</p>
        <div class="detail-price">${formatPrice(p.price_cents)}</div>
        <span class="stock-tag ${tag.cls}">${tag.label}</span>

        <div class="add-row">
          <div class="qty-control">
            <button id="qty-dec" type="button">-</button>
            <span id="qty-val">1</span>
            <button id="qty-inc" type="button">+</button>
          </div>
          <button class="btn btn-primary" id="add-btn" ${p.stock <= 0 ? 'disabled' : ''}>
            ${p.stock <= 0 ? 'Depleted' : 'Add to cart'}
          </button>
        </div>

        <table class="spec-table">${specRows}</table>
      </div>
    </div>
  `;

  document.getElementById('qty-dec').addEventListener('click', () => {
    qty = Math.max(1, qty - 1);
    document.getElementById('qty-val').textContent = qty;
  });
  document.getElementById('qty-inc').addEventListener('click', () => {
    qty = Math.min(p.stock, qty + 1);
    document.getElementById('qty-val').textContent = qty;
  });
  document.getElementById('add-btn').addEventListener('click', addToCart);
}

async function addToCart() {
  const user = await getSession();
  if (!user) {
    sessionStorage.setItem('void_redirect_after_login', window.location.pathname + window.location.search);
    window.location.href = '/login.html';
    return;
  }
  try {
    await api('/cart/items', { method: 'POST', body: { product_id: currentProduct.id, quantity: qty } });
    showToast(`${currentProduct.name} added to cart`);
    refreshCartBadge();
  } catch (e) {
    showToast(e.message || 'Could not add to cart', true);
  }
}

load();
