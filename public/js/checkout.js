const summaryEl = document.getElementById('summary');
const form = document.getElementById('checkout-form');
const errorEl = document.getElementById('checkout-error');
const confirmBtn = document.getElementById('confirm-btn');

async function loadSummary() {
  const user = await getSession();
  if (!user) {
    requireLogin('Login to checkout');
    return;
  }
  try {
    const cart = await api('/cart');
    if (cart.items.length === 0) {
      summaryEl.innerHTML = `<div class="empty-state">Cart is empty. <a href="/index.html">Browse the arsenal</a>.</div>`;
      confirmBtn.disabled = true;
      return;
    }
    summaryEl.innerHTML =
      cart.items
        .map(
          (i) => `<div class="summary-line"><span>${escapeHtml(i.product.name)} × ${i.quantity}</span><span>$${formatPrice(i.product.price_cents * i.quantity)}</span></div>`
        )
        .join('') + `<div class="summary-line total"><span>Total</span><span>$${formatPrice(cart.total_cents)}</span></div>`;
  } catch (e) {
    summaryEl.innerHTML = `<div class="empty-state">Could not load cart.</div>`;
  }
}

form.addEventListener('submit', async (e) => {
  e.preventDefault();
  errorEl.textContent = '';
  confirmBtn.disabled = true;
  confirmBtn.textContent = 'Transmitting...';
  try {
    const { order } = await api('/orders/checkout', {
      method: 'POST',
      body: {
        shipping_name: document.getElementById('ship-name').value,
        shipping_address: document.getElementById('ship-address').value
      }
    });
    sessionStorage.setItem('void_last_order', JSON.stringify(order));
    window.location.href = '/orders.html?confirmed=1';
  } catch (err) {
    errorEl.textContent = err.message || 'Checkout failed';
    confirmBtn.disabled = false;
    confirmBtn.textContent = 'Confirm order';
  }
});

loadSummary();
