// ================= WHATSAPP NUMBER =================
const phoneNumber = "917602884208";

// ================= FIREBASE =================
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

// ================= GLOBAL =================
let products = [];
let cart = {}; // { productId: { product, qty } }

// ================= CUSTOMER =================
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

// ================= QTY +/- =================
function changeQty(id, delta, minQty) {
  const input = document.getElementById("qty-" + id);
  if (!input) return;
  let v = parseInt(input.value) || minQty || 1;
  v += delta;
  if (v < minQty) v = minQty;
  input.value = v;
}

// ================= ADD TO CART =================
function addToCart(id) {
  const product = products.find(p => p.id === id);
  if (!product || !product.InStock) return;

  const qty = parseInt(document.getElementById("qty-" + id).value) || product.MinQty || 1;

  if (cart[id]) {
    cart[id].qty += qty;
  } else {
    cart[id] = { product, qty };
  }

  updateCartUI();
}

// ================= CART UI =================
function updateCartUI() {
  const cartBar = document.getElementById("cart-bar");
  const cartCount = document.getElementById("cart-count");
  const cartItems = document.getElementById("cart-items");
  const cartTotal = document.getElementById("cart-total");

  let count = 0;
  let total = 0;
  cartItems.innerHTML = "";

  Object.values(cart).forEach(item => {
    count += item.qty;
    total += item.qty * item.product.Price;

    const div = document.createElement("div");
    div.className = "cart-item";
    div.innerHTML = `
      <strong>${item.product.Name}</strong><br>
      Qty: ${item.qty} × ₹${item.product.Price}
    `;
    cartItems.appendChild(div);
  });

  cartCount.innerText = count;
  cartTotal.innerText = total;
  cartBar.style.display = count > 0 ? "flex" : "none";
}

// ================= CART OPEN / CLOSE =================
document.getElementById("open-cart").onclick = () => {
  document.getElementById("cart-modal").style.display = "block";
};
document.getElementById("close-cart").onclick = () => {
  document.getElementById("cart-modal").style.display = "none";
};

// ================= CART → WHATSAPP =================
document.getElementById("cart-whatsapp").onclick = () => {
  const customer = getCustomerDetails();
  if (!customer) return;

  let msg = `🧾 SASTA SILIGURI – ORDER\n\n`;
  let grandTotal = 0;

  Object.values(cart).forEach(item => {
    const t = item.qty * item.product.Price;
    grandTotal += t;
    msg += `📦 ${item.product.Name}\nQty: ${item.qty}\nPrice: ₹${t}\n\n`;
  });

  msg += `------------------\n`;
  msg += `TOTAL: ₹${grandTotal}\n\n`;
  msg += `👤 ${customer.name}\n📞 ${customer.phone}\n🏠 ${customer.address}\n\n`;
  msg += `🚚 Same Day Delivery\n💸 Cash on Delivery`;

  window.location.href =
    `https://api.whatsapp.com/send?phone=${phoneNumber}&text=${encodeURIComponent(msg)}`;
};

// ================= RENDER PRODUCTS =================
function renderProducts(list) {
  const container = document.getElementById("product-list");
  container.innerHTML = "";

  list.forEach(p => {
    const card = document.createElement("div");
    card.className = "product-card";

    card.innerHTML = `
      <img src="${p.Image || "placeholder.jpg"}">
      <h2>${p.Name}</h2>
      <p class="weight">${p.Weight || ""}</p>

      <div class="price-box">
        ${p.Mrp ? `<div class="price-row market"><span>Market price</span><span class="mrp">₹${p.Mrp}</span></div>` : ""}
        <div class="price-row offer"><span>Offer price</span><span class="offer-price">₹${p.Price}</span></div>
      </div>

      <p class="min-order">Minimum order: ${p.MinQty || 1} ${p.Unit || ""}</p>
      <p class="tag">${p.InStock ? "In stock ✅" : "Out of stock ❌"}</p>

      <div class="qty-row">
        <button class="qty-btn" onclick="changeQty('${p.id}',-1,${p.MinQty||1})">-</button>
        <input id="qty-${p.id}" class="qty-input" value="${p.MinQty||1}">
        <button class="qty-btn" onclick="changeQty('${p.id}',1,${p.MinQty||1})">+</button>
      </div>

      <button class="btn btn-whatsapp" onclick="addToCart('${p.id}')">
        Add to Cart
      </button>
    `;

    container.appendChild(card);
  });
}

// ================= SEARCH =================
document.getElementById("search-input").addEventListener("input", e => {
  const q = e.target.value.toLowerCase();
  renderProducts(products.filter(p => p.Name.toLowerCase().includes(q)));
});

// ================= FIREBASE SUBSCRIBE =================
db.collection("products").orderBy("Name").onSnapshot(snap => {
  products = snap.docs.map(d => ({ id: d.id, ...d.data() }));
  renderProducts(products);
});

// ================= ADMIN LOGIN =================
const ADMIN_PASSWORD = "1513";

function setupAdminLogin() {
  const panel = document.getElementById("admin-panel");
  const logo = document.querySelector(".logo");
  const loginWrapper = document.querySelector(".admin-login-wrapper");
  const btn = document.getElementById("admin-login-btn");

  if (!panel || !logo) return;

  // customer se hide
  if (loginWrapper) loginWrapper.style.display = "none";
  if (btn) btn.style.display = "none";

  // already unlocked
  if (localStorage.getItem("sasta_admin_unlocked") === "yes") {
    panel.style.display = "block";
  }

  // logo tap = login
  logo.addEventListener("click", () => {
    const pwd = prompt("Enter admin password:");
    if (pwd === ADMIN_PASSWORD) {
      panel.style.display = "block";
      localStorage.setItem("sasta_admin_unlocked", "yes");
    } else if (pwd !== null) {
      alert("Wrong password");
    }
  });
}

// ================= ADMIN BUTTONS =================

function setupAdminButtons() {
  const btnAdd = document.getElementById("admin-add");
  const btnSave = document.getElementById("admin-save");
  const btnDelete = document.getElementById("admin-delete");

  if (btnAdd) btnAdd.onclick = handleAddProduct;
  if (btnSave) btnSave.onclick = handleSaveProduct;
  if (btnDelete) btnDelete.onclick = handleDeleteProduct;
}

// ================= PAGE LOAD =================

document.addEventListener("DOMContentLoaded", () => {
  subscribeProducts();
  setupSearch();
  setupAdminLogin();
  setupAdminButtons();
});

      
