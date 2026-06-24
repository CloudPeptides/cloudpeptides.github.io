
function money(n){ return '$' + Number(n).toFixed(2); }
const params = new URLSearchParams(window.location.search);
const id = params.get('id');
const product = window.PRODUCTS.find(p => p.id === id) || window.PRODUCTS[0];

document.title = product.name + ' | Cloud Peptides';
document.getElementById('productName').textContent = product.name;
const select = document.getElementById('optionSelect');
const price = document.getElementById('price');
const codeLine = document.getElementById('codeLine');

select.innerHTML = product.options.map((o, i) => `<option value="${i}">${o.spec} • ${o.count} vial kit • ${money(o.price)}</option>`).join('');

function update(){
  const o = product.options[Number(select.value)];
  price.textContent = money(o.price);
  codeLine.textContent = o.code ? `Code: ${o.code} • ${product.category}` : product.category;
}
select.addEventListener('change', update);
update();
