
const grid = document.getElementById('productGrid');
const searchInput = document.getElementById('searchInput');
let activeFilter = 'all';

function money(n){ return '$' + Number(n).toFixed(2); }
function lowPrice(product){ return product.options.reduce((a,b)=>a.price < b.price ? a : b, product.options[0]); }

function render(){
  const search = (searchInput.value || '').toLowerCase().trim();
  const items = window.PRODUCTS.filter(p => {
    const matchesFilter = activeFilter === 'all' || p.category === activeFilter;
    const matchesSearch = p.name.toLowerCase().includes(search) || p.options.some(o => (o.code || '').toLowerCase().includes(search));
    return matchesFilter && matchesSearch;
  });
  grid.innerHTML = items.map(p => {
    const low = lowPrice(p);
    const multi = p.options.length > 1;
    return `<a class="product-card" href="product.html?id=${p.id}">
      <div class="product-image"><img src="assets/empty-vial.png" alt="${p.name}"></div>
      <h3>${p.name}</h3>
      <div class="sub">10 Vial Kit${multi ? ' • ' + p.options.length + ' options' : ''}</div>
      <div class="price">${multi ? 'from ' : ''}${money(low.price)}</div>
    </a>`;
  }).join('');
}

document.querySelectorAll('[data-filter]').forEach(btn => {
  btn.addEventListener('click', () => {
    activeFilter = btn.dataset.filter;
    document.querySelectorAll('[data-filter]').forEach(b => b.classList.toggle('active', b === btn));
    render();
  });
});

document.querySelectorAll('[data-filter-jump]').forEach(btn => {
  btn.addEventListener('click', () => {
    activeFilter = btn.dataset.filterJump;
    document.querySelectorAll('[data-filter]').forEach(b => b.classList.toggle('active', b.dataset.filter === activeFilter));
    render();
    document.getElementById('productGrid').scrollIntoView({behavior:'smooth', block:'start'});
  });
});

searchInput.addEventListener('input', render);
render();
