const listEl = document.getElementById('orders-list');
const bannerEl = document.getElementById('confirm-banner');

if (new URLSearchParams(window.location.search).get('confirmed') === '1') {
  bannerEl.innerHTML = `<div class="confirm-banner">TRANSMISSION CONFIRMED — your order has been logged and is being prepared for dispatch.</div>`;
}

async function load() {
  const user = await getSession();
  if (!user) {
    requireLogin('Login to view your orders');
    return;
  }
  try {
    const { orders } = await api('/orders');
    render(orders);
  } catch (e) {
    listEl.innerHTML = `<div class="empty-state">Could not load orders.</div>`;
  }
}

function render(orders) {
  if (orders.length === 0) {
    listEl.innerHTML = `<div class="empty-state"><h3>No dispatch history</h3>You haven't placed any orders yet. <a href="/index.html">Browse the arsenal</a>.</div>`;
    return;
  }
  listEl.innerHTML = orders
    .map(
      (o) => `
    <div class="panel order-card">
      <div class="order-head">
        <div>
          <div class="eyebrow">Order #${o.id}</div>
          <div style="font-size:12px;color:var(--text-faint);margin-top:4px;">${new Date(o.created_at).toLocaleString()}</div>
        </div>
        <span class="order-status">${escapeHtml(o.status)}</span>
      </div>
      ${o.items.map((it) => `<div class="order-item-line"><span>${escapeHtml(it.product_name)} × ${it.quantity}</span><span>$${formatPrice(it.price_cents * it.quantity)}</span></div>`).join('')}
      <div class="summary-line total"><span>Total</span><span>$${formatPrice(o.total_cents)}</span></div>
    </div>
  `
    )
    .join('');
}

load();
