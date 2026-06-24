function getCart() {
  return JSON.parse(localStorage.getItem('cart') || '[]');
}

function saveCart(cart) {
  localStorage.setItem('cart', JSON.stringify(cart));
}

function updateCartCount() {
  const count = getCart().length;

  document.querySelectorAll('.cart-icon').forEach(icon => {
    icon.innerHTML = `🛍️ ${count}`;
  });
}

updateCartCount();
