// ========== WhatsApp number ==========
const phoneNumber = "917602884208";

// ========== Firebase setup ==========
const firebaseConfig = {
  apiKey: "AIzaSyA4SQeDddwhmSjTA_g9v2yuIYP-A7kR9ZE",
  authDomain: "sasta-siliguri.firebaseapp.com",
  projectId: "sasta-siliguri",
  storageBucket: "sasta-siliguri.firebasestorage.app",
  messagingSenderId: "989707472922",
  appId: "1:989707472922:web:576cf7c9089fa1e65e81a3"
};

firebase.initializeApp(firebaseConfig);
const db = firebase.firestore();

// ========== GLOBAL ==========
let products = [];
let cart = JSON.parse(localStorage.getItem("sasta_cart")) || {};

// ========== SAVE CART ==========
function saveCart() {
  localStorage.setItem("sasta_cart", JSON.stringify(cart));
}

// ========== UPDATE CART UI ==========
function updateCartUI() {
  const bar = document.getElementById("cart-bar");
  const count = document.getElementById("cart-count");

  let totalQty = 0;
  Object.values(cart).forEach(i => totalQty += i.qty);

  if (totalQty > 0) {
    bar.style.display = "flex";
    count.innerText = totalQty;
  } else {
    bar.style.display = "none";
  }
}

// ========== ADD TO CART ==========
function addToCart(id) {
  const product = products.find(p => p.id === id);
  if (!product || !product.InStock) return;

  const qtyInput = document.getElementById("qty-" + id);
  const qty = parseInt(qtyInput?.value, 10) || product.MinQty || 1;

  if (cart[id]) {
    cart[id].qty += qty;
  } else {
    cart[id] = { product, qty };
  }

  saveCart();
  updateCartUI();
}

// ========== CHANGE CART QTY ==========
function changeCartQty(id, delta) {
  if (!cart[id]) return;

  cart[id].qty += delta;
  if (cart[id].qty <= 0) delete cart[id];

  saveCart();
  renderCartItems();
  updateCartUI();
}

// ========== REMOVE ITEM ==========
function removeFromCart(id) {
  delete cart[id];
  saveCart();
  renderCartItems();
  updateCartUI();
}

// ========== OPEN / CLOSE CART ==========
function openCart() {
  document.getElementById("cart-modal").style.display = "block";
  renderCartItems();
}

function closeCart() {
  document.getElementById("cart-modal").style.display = "none";
}

// ========== RENDER CART ==========
function renderCartItems() {
  const itemsBox = document.getElementById("cart-items");
  const totalBox = document.getElementById("cart-total");

  itemsBox.innerHTML = "";
  let total = 0;

  Object.values(cart).forEach(item => {
    const lineTotal = item.qty * item.product.Price;
    total += lineTotal;

    const div = document.createElement("div");
    div.className = "cart-item";

    div.innerHTML = `
      <strong>${item.product.Name}</strong><br>
      <button onclick="changeCartQty('${item.product.id}', -1)">−</button>
      <span> ${item.qty} </span>
      <button onclick="changeCartQty('${item.product.id}', 1)">+</button>
      × ₹${item.product.Price}
      <button onclick="removeFromCart('${item.product.id}')">❌</button>
    `;

    itemsBox.appendChild(div);
  });

  totalBox.innerText = total;
}

// ========== CART → WHATSAPP ==========
function orderCartOnWhatsApp() {
  const name = document.getElementById("cust-name").value.trim();
  const phone = document.getElementById("cust-phone").value.trim();
  const address = document.getElementById("cust-address").value.trim();

  if (!name || !phone || !address) {
    alert("Fill name, phone and address.");
    return;
  }

  let msg = "🧾 SASTA SILIGURI ORDER\n\n";
  let grandTotal = 0;

  Object.values(cart).forEach(item => {
    const t = item.qty * item.product.Price;
    grandTotal += t;
    msg += `📦 ${item.product.Name}\nQty: ${item.qty}\n₹${t}\n\n`;
  });

  msg += `TOTAL: ₹${grandTotal}\n\n`;
  msg += `👤 ${name}\n📞 ${phone}\n🏠 ${address}`;

  window.location.href =
    `https://api.whatsapp.com/send?phone=${phoneNumber}&text=${encodeURIComponent(msg)}`;
}

// ========== RENDER PRODUCTS ==========
function renderProducts(list) {
  const container = document.getElementById("product-list");
  container.innerHTML = "";

  list.forEach(p => {
    const card = document.createElement("div");
    card.className = "product-card";

    card.innerHTML = `
      <img src="${p.Image || 'placeholder.jpg'}">
      <h2>${p.Name}</h2>
      <p>₹${p.Price}</p>

      <div>
        <button onclick="changeQty('${p.id}', -1, ${p.MinQty || 1})">-</button>
        <input id="qty-${p.id}" type="number" value="${p.MinQty || 1}">
        <button onclick="changeQty('${p.id}', 1, ${p.MinQty || 1})">+</button>
      </div>

      <button onclick="addToCart('${p.id}')">Add to Cart</button>
    `;

    container.appendChild(card);
  });
}

// ========== QTY +/- ==========
function changeQty(id, delta, minQty) {
  const input = document.getElementById("qty-" + id);
  let value = parseInt(input.value) || minQty || 1;
  value += delta;
  if (value < minQty) value = minQty;
  input.value = value;
}

// ========== FIREBASE ==========
function subscribeProducts() {
  db.collection("products")
    .orderBy("Name")
    .onSnapshot(snapshot => {
      products = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      renderProducts(products);
    });
}

// ========== ADMIN LOGIN ==========
const ADMIN_PASSWORD = "1513";

function setupAdminLogin() {
  const panel = document.getElementById("admin-panel");
  const logo = document.querySelector(".logo");

  logo.addEventListener("click", () => {
    const pwd = prompt("Enter admin password:");
    if (pwd === ADMIN_PASSWORD) {
      panel.style.display = "block";
    } else {
      alert("Wrong password");
    }
  });
}

// ========== INIT ==========
document.addEventListener("DOMContentLoaded", () => {
  subscribeProducts();
  setupAdminLogin();
  updateCartUI();
});
