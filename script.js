/* ================= WHATSAPP NUMBER ================= */
const phoneNumber = "917602884208";

/* ================= FIREBASE ================= */
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

/* ================= GLOBAL ================= */
let products = [];
let cart = JSON.parse(localStorage.getItem("sasta_cart")) || {};

function saveCart() {
  localStorage.setItem("sasta_cart", JSON.stringify(cart));
}

/* ================= CUSTOMER ================= */
function getCustomerDetails() {
  const name = document.getElementById("cust-name").value.trim();
  const phone = document.getElementById("cust-phone").value.trim();
  const address = document.getElementById("cust-address").value.trim();

  if (!name || !phone || !address) {
    alert("Name, phone aur address bharna zaroori hai");
    return null;
  }
  return { name, phone, address };
}

/* ================= ADD TO CART ================= */
function addToCart(id) {
  const product = products.find(p => p.id === id);
  if (!product || product.InStock === false) return;

  const qtyInput = document.getElementById("qty-" + id);
  const qty = parseInt(qtyInput?.value) || product.MinQty || 1;

  if (cart[id]) {
    cart[id].qty += qty;
  } else {
    cart[id] = { product, qty };
  }

  saveCart();
  updateCartUI();
}

/* ================= CART UI ================= */
function updateCartUI() {
  const bar = document.getElementById("cart-bar");
  const count = document.getElementById("cart-count");

  let totalQty = 0;
  Object.values(cart).forEach(item => {
    totalQty += item.qty;
  });

  bar.style.display = totalQty > 0 ? "flex" : "none";
  count.innerText = totalQty;
}

/* ================= CART MODAL PREMIUM ================= */
function openCart() {
  renderCartItems();
  document.getElementById("cart-modal").style.display = "block";
}

function closeCart() {
  document.getElementById("cart-modal").style.display = "none";
}

function renderCartItems() {
  const box = document.getElementById("cart-items");
  const totalBox = document.getElementById("cart-total");

  box.innerHTML = "";
  let total = 0;

  Object.entries(cart).forEach(([id, item]) => {
    const line = item.qty * item.product.Price;
    total += line;

    const div = document.createElement("div");
    div.className = "cart-item";

    div.innerHTML = `
      <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:10px;">
        <div>
          <strong style="font-size:16px;">${item.product.Name}</strong><br>
          <span style="color:#555;">${item.qty} × ₹${item.product.Price}</span>
        </div>

        <button onclick="removeFromCart('${id}')"
          style="
            background:#ff4d4d;
            border:none;
            color:#fff;
            width:30px;
            height:30px;
            border-radius:50%;
            font-size:16px;
            cursor:pointer;">
          ×
        </button>
      </div>
      <hr style="opacity:0.2;">
    `;

    box.appendChild(div);
  });

  totalBox.innerText = total;
}

function removeFromCart(id) {
  delete cart[id];
  saveCart();
  updateCartUI();
  renderCartItems();
}

/* ================= WHATSAPP ORDER ================= */
function orderCartOnWhatsApp() {
  const customer = getCustomerDetails();
  if (!customer) return;

  let msg = "🧾 SASTA SILIGURI ORDER\n\n";
  let total = 0;

  Object.values(cart).forEach(item => {
    const t = item.qty * item.product.Price;
    total += t;
    msg += `📦 ${item.product.Name}\nQty: ${item.qty}\n₹${t}\n\n`;
  });

  msg += `TOTAL: ₹${total}\n\n`;
  msg += `Name: ${customer.name}\nPhone: ${customer.phone}\nAddress: ${customer.address}`;

  window.location.href =
    `https://api.whatsapp.com/send?phone=${phoneNumber}&text=${encodeURIComponent(msg)}`;
}

/* ================= QTY +/- FIXED ================= */
function changeQty(id, delta, minQty) {
  const input = document.getElementById("qty-" + id);
  if (!input) return;

  let value = parseInt(input.value) || minQty || 1;
  value += delta;

  if (value < minQty) value = minQty;

  input.value = value;
}

/* ================= RENDER PRODUCTS ================= */
function renderProducts(list) {
  const container = document.getElementById("product-list");
  container.innerHTML = "";

  list.forEach(p => {
    const minQty = p.MinQty || 1;
    const inStock = p.InStock !== false;

    const card = document.createElement("div");
    card.className = "product-card";

    card.innerHTML = `
      <img src="${p.Image || "placeholder.jpg"}">
      <h2>${p.Name}</h2>

      ${p.Mrp ? `
        <div class="price-row">
          <span class="label">Market price</span>
          <span class="mrp">₹${p.Mrp}</span>
        </div>
      ` : ""}

      <div class="price-row">
        <span class="label">Offer price</span>
        <span class="offer-price">₹${p.Price}</span>
      </div>

      <div class="min-order">
        <span>Minimum order:</span>
        <span>${minQty}</span>
      </div>

      <div class="tag">
        ${inStock ? "In stock ✅" : "Out of stock ❌"}
      </div>

      <div class="qty-row">
        <button class="qty-btn" onclick="changeQty('${p.id}',-1,${minQty})">−</button>
        <input id="qty-${p.id}" class="qty-input" value="${minQty}" type="number">
        <button class="qty-btn" onclick="changeQty('${p.id}',1,${minQty})">+</button>
      </div>

      <button 
        class="${inStock ? "btn-whatsapp" : "btn-disabled"}" 
        onclick="addToCart('${p.id}')">
        Add to Cart
      </button>
    `;

    container.appendChild(card);
  });
}

/* ================= FIREBASE LOAD ================= */
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

/* ================= ADMIN LOGIN FIX (LOGO TAP) ================= */
const ADMIN_PASSWORD = "1513";

function setupAdminLogin() {
  const panel = document.getElementById("admin-panel");
  const logo = document.querySelector(".logo");
  const loginWrapper = document.querySelector(".admin-login-wrapper");

  if (loginWrapper) loginWrapper.style.display = "none";

  if (logo) {
    logo.addEventListener("click", () => {
      const pwd = prompt("Enter admin password:");
      if (pwd === ADMIN_PASSWORD) {
       panel.style.display = "block";
       panel.style.opacity = "1";
       panel.style.visibility = "visible";
       panel.scrollIntoView({ behavior: "smooth" });
      alert("Admin panel unlocked");
      } else if (pwd !== null) {
        alert("Wrong password");
      }
    });
  }
}

/* ================= INIT ================= */
document.addEventListener("DOMContentLoaded", () => {
  updateCartUI();
  subscribeProducts();
  setupAdminLogin();
});
