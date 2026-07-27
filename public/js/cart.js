const itemsEl = document.getElementById('cart-items');
const summaryEl = document.getElementById('summary');
const checkoutBtn = document.getElementById('checkout-btn');

async function loadCart() {
  const user = await getSession();
  if (!user) {
    requireLogin('Login to view your cart');
    return;
  }
  try {
    const cart = await api('/cart');
    render(cart);
  } catch (e) {
    itemsEl.innerHTML = `<div class="empty-state">Could not load cart.</div>`;
  }
}

function render(cart) {
  if (cart.items.length === 0) {
    itemsEl.innerHTML = `<div class="empty-state"><h3>Cart is empty</h3>No devices queued for transmission. <a href="/index.html">Browse the arsenal</a>.</div>`;
    summaryEl.innerHTML = `<div class="summary-line total"><span>Total</span><span>$0.00</span></div>`;
    checkoutBtn.disabled = true;
    return;
  }
  checkoutBtn.disabled = false;

  itemsEl.innerHTML = cart.items
    .map(
      (i) => `
    <div class="cart-row" data-id="${i.cart_item_id}">
      <div class="card-glyph">${escapeHtml(i.product.glyph)}</div>
      <div>
        <div class="card-name" style="font-size:14px;">${escapeHtml(i.product.name)}</div>
        <div class="card-cat">${escapeHtml(i.product.category)}</div>
      </div>
      <div class="qty-control">
        <button type="button" class="qty-dec">-</button>
        <span>${i.quantity}</span>
        <button type="button" class="qty-inc">+</button>
      </div>
      <div class="price">${formatPrice(i.product.price_cents * i.quantity)}</div>
      <button class="btn btn-sm btn-danger remove-btn" type="button">Remove</button>
    </div>
  `
    )
    .join('');

  summaryEl.innerHTML = `
    <div class="summary-line"><span>Items</span><span>${cart.items.reduce((s, i) => s + i.quantity, 0)}</span></div>
    <div class="summary-line total"><span>Total</span><span>$${formatPrice(cart.total_cents)}</span></div>
  `;

  itemsEl.querySelectorAll('.cart-row').forEach((row) => {
    const cartItemId = row.dataset.id;
    row.querySelector('.qty-inc').addEventListener('click', () => changeQty(row, cartItemId, 1));
    row.querySelector('.qty-dec').addEventListener('click', () => changeQty(row, cartItemId, -1));
    row.querySelector('.remove-btn').addEventListener('click', () => removeItem(cartItemId));
  });
}

async function changeQty(row, cartItemId, delta) {
  const span = row.querySelector('.qty-control span');
  const newQty = parseInt(span.textContent, 10) + delta;
  if (newQty < 1) return removeItem(cartItemId);
  try {
    const cart = await api(`/cart/items/${cartItemId}`, { method: 'PATCH', body: { quantity: newQty } });
    render(cart);
    refreshCartBadge();
  } catch (e) {
    showToast(e.message || 'Could not update quantity', true);
  }
}

async function removeItem(cartItemId) {
  try {
    const cart = await api(`/cart/items/${cartItemId}`, { method: 'DELETE' });
    render(cart);
    refreshCartBadge();
  } catch (e) {
    showToast('Could not remove item', true);
  }
}

checkoutBtn.addEventListener('click', () => {
  window.location.href = '/checkout.html';
});

loadCart();
