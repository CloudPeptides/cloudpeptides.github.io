const WEB3FORMS_ACCESS_KEY = "ff21f4ac-91d7-44fe-98a6-289e5edbe199";

function getCart() {
  return JSON.parse(localStorage.getItem("cart") || "[]");
}

function saveCart(cart) {
  localStorage.setItem("cart", JSON.stringify(cart));
}

function updateCartCount() {
  const cart = getCart();
  const count = cart.reduce((sum, item) => sum + (item.quantity || 1), 0);

  document.querySelectorAll(".cart-icon").forEach(icon => {
    icon.innerHTML = `🛍️ ${count}`;
  });
}

function calculateTotals(cart) {
  const subtotal = cart.reduce((sum, item) => {
    const price = Number(String(item.price).replace(/[^0-9.]/g, ""));
    const quantity = item.quantity || 1;
    return sum + price * quantity;
  }, 0);

  const kitCount = cart.reduce((sum, item) => {
    return sum + (item.quantity || 1);
  }, 0);

  const shipping = kitCount >= 3 ? 0 : 15;
  const total = subtotal + shipping;

  return { subtotal, shipping, total, kitCount };
}

function renderCart() {
  const cartItems = document.getElementById("cartItems");
  const subtotalEl = document.getElementById("subtotal");
  const shippingEl = document.getElementById("shipping");
  const totalEl = document.getElementById("total");

  if (!cartItems) return;

  const cart = getCart();

  if (cart.length === 0) {
    cartItems.innerHTML = `
      <div class="panel" style="text-align:center;">
        <h2>Your cart is empty</h2>
        <p>Browse the shop to add products to your cart.</p>
        <a href="shop.html" class="btn">Shop Now</a>
      </div>
    `;

    if (subtotalEl) subtotalEl.textContent = "$0.00";
    if (shippingEl) shippingEl.textContent = "$0.00";
    if (totalEl) totalEl.textContent = "$0.00";

    return;
  }

  cartItems.innerHTML = cart.map((item, index) => `
    <div class="panel" style="margin-bottom:20px;">
      <h3>${item.product}</h3>
      <p>${item.mg}</p>
      <p>${item.price}</p>

      <p>
        Quantity:
        <button type="button" onclick="decreaseQty(${index})">−</button>
        ${item.quantity || 1}
        <button type="button" onclick="increaseQty(${index})">+</button>
      </p>

      <button type="button" onclick="removeItem(${index})" class="btn outline">
        Remove
      </button>
    </div>
  `).join("");

  const totals = calculateTotals(cart);

  subtotalEl.textContent = "$" + totals.subtotal.toFixed(2);
  shippingEl.textContent = totals.shipping === 0 ? "FREE" : "$15.00";
  totalEl.textContent = "$" + totals.total.toFixed(2);
}

function increaseQty(index) {
  const cart = getCart();
  cart[index].quantity = (cart[index].quantity || 1) + 1;
  saveCart(cart);
  updateCartCount();
  renderCart();
}

function decreaseQty(index) {
  const cart = getCart();

  if ((cart[index].quantity || 1) > 1) {
    cart[index].quantity--;
  }

  saveCart(cart);
  updateCartCount();
  renderCart();
}

function removeItem(index) {
  const cart = getCart();
  cart.splice(index, 1);
  saveCart(cart);
  updateCartCount();
  renderCart();
}

function formatOrder(cart) {
  return cart.map(item => {
    const quantity = item.quantity || 1;

    return `
Product: ${item.product}
Option: ${item.mg}
Quantity: ${quantity}
Price: ${item.price}
`;
  }).join("\n----------------------\n");
}

async function submitOrder(event) {
  event.preventDefault();

  const cart = getCart();
  const totals = calculateTotals(cart);

  if (totals.kitCount < 2) {
    alert("Minimum order is 2 kits. Add one more kit to continue.");
    return;
  }

  const name = document.getElementById("customerName").value.trim();
  const email = document.getElementById("customerEmail").value.trim();
  const contact = document.getElementById("customerContact").value.trim();
  const payment = document.getElementById("paymentMethod").value;
  const notes = document.getElementById("customerNotes").value.trim();

  if (!name || !email || !contact || !payment) {
    alert("Please complete all required checkout fields.");
    return;
  }

  const orderSummary = formatOrder(cart);

  const formData = new FormData();

  formData.append("access_key", WEB3FORMS_ACCESS_KEY);
  formData.append("subject", "New Cloud Peptides Order Request");
  formData.append("from_name", "Cloud Peptides Checkout");

  formData.append("Customer Name", name);
  formData.append("Customer Email", email);
  formData.append("Contact", contact);
  formData.append("Preferred Payment", payment);

  formData.append("Order Items", orderSummary);
  formData.append("Subtotal", "$" + totals.subtotal.toFixed(2));
  formData.append("Shipping", totals.shipping === 0 ? "FREE" : "$15.00");
  formData.append("Total", "$" + totals.total.toFixed(2));
  formData.append("Notes", notes || "None provided");

  formData.append("Research Disclaimer", "All products are intended strictly for laboratory research purposes only and are not for human consumption.");

  const button = document.getElementById("submitOrder");
  button.disabled = true;
  button.textContent = "Submitting...";

  try {
    const response = await fetch("https://api.web3forms.com/submit", {
      method: "POST",
      body: formData
    });

    const result = await response.json();

    if (result.success) {
      localStorage.removeItem("cart");
      updateCartCount();

      document.getElementById("checkoutForm").style.display = "none";
      document.getElementById("cartItems").style.display = "none";
      document.querySelector(".cart-total").style.display = "none";
      document.getElementById("successMessage").style.display = "block";
    } else {
      alert("There was an error submitting your order. Please try again.");
      console.log(result);
    }

  } catch (error) {
    alert("There was an error submitting your order. Please try again.");
    console.log(error);
  }

  button.disabled = false;
  button.textContent = "Place Order Request";
}

document.addEventListener("DOMContentLoaded", () => {
  updateCartCount();
  renderCart();

  const checkoutForm = document.getElementById("checkoutForm");

  if (checkoutForm) {
    checkoutForm.addEventListener("submit", submitOrder);
  }
});
