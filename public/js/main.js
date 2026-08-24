const gridEl = document.getElementById('grid');
const searchInput = document.getElementById('search-input');
const categorySelect = document.getElementById('category-select');

let debounceTimer;

function renderProducts(products) {
  if (products.length === 0) {
    gridEl.innerHTML = `<div class="empty-state"><h3>No signal detected</h3>No devices match that query. Try a broader search.</div>`;
    return;
  }
  gridEl.innerHTML = products.map(cardHtml).join('');
}

function productImage(slug) {
  return `/images/products/${encodeURIComponent(slug)}.webp`;
}

function cardHtml(p) {
  const tag = stockTag(p.stock);
  return `
    <a class="card" href="/product.html?slug=${encodeURIComponent(p.slug)}">
      <div class="card-image"><img src="${productImage(p.slug)}" alt="${escapeHtml(p.name)}" width="720" height="720" loading="lazy" decoding="async"></div>
      <div class="card-cat">${escapeHtml(p.category)}</div>
      <div class="card-name">${escapeHtml(p.name)}</div>
      <div class="card-desc">${escapeHtml(p.short_desc)}</div>
      <div class="card-foot">
        <span class="price">${formatPrice(p.price_cents)}</span>
        <span class="${signalClass(p.signal_strength)}"><i></i><i></i><i></i><i></i><i></i></span>
      </div>
      <span class="stock-tag ${tag.cls}">${tag.label}</span>
    </a>
  `;
}

async function loadCategories() {
  try {
    const { categories } = await api('/products/categories');
    categorySelect.innerHTML =
      '<option value="">All categories</option>' +
      categories.map((c) => `<option value="${escapeHtml(c)}">${escapeHtml(c)}</option>`).join('');
  } catch (e) { /* non-fatal */ }
}

async function loadProducts() {
  gridEl.innerHTML = `<div class="empty-state">Scanning frequencies...</div>`;
  const params = new URLSearchParams();
  if (searchInput.value.trim()) params.set('q', searchInput.value.trim());
  if (categorySelect.value) params.set('category', categorySelect.value);
  try {
    const { products } = await api(`/products?${params.toString()}`);
    renderProducts(products);
  } catch (e) {
    gridEl.innerHTML = `<div class="empty-state"><h3>Transmission failed</h3>Could not reach the catalog service.</div>`;
  }
}

searchInput.addEventListener('input', () => {
  clearTimeout(debounceTimer);
  debounceTimer = setTimeout(loadProducts, 250);
});
categorySelect.addEventListener('change', loadProducts);

loadCategories();
loadProducts();
