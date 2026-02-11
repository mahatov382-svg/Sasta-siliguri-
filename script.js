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
let cart = JSON.parse(localStorage.getItem("sasta_cart")) || {};

function saveCart() {
  localStorage.setItem("sasta_cart", JSON.stringify(cart));
}

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

// ================= ADD TO CART =================
function addToCart(id) {
  const product = products.find(p => p.id === id);
  if (!product || !product.InStock) return;

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

// ================= CART UI =================
function updateCartUI() {
  const bar = document.getElementById("cart-bar");
  const count = document.getElementById("cart-count");

  let totalQty = 0;
  Object.values(cart).forEach(item => {
    totalQty += item.qty;
  });

  if (totalQty > 0) {
    bar.style.display = "flex";
  } else {
    bar.style.display = "none";
  }

  count.innerText = totalQty;
}

// ================= CART MODAL =================
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
    div.innerHTML = `
      <strong>${item.product.Name}</strong><br>
      ${item.qty} × ₹${item.product.Price}
      <button onclick="removeFromCart('${id}')">❌</button>
      <hr>
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

// ================= WHATSAPP ORDER =================
function orderCartOnWhatsApp() {
  const customer = getCustomerDetails();
  if (!customer) return;

  let msg = "🧾 SASTA SILIGURI ORDER\n\n";
  let total = 0;

  Object.values(cart).forEach(item => {
    const t = item.qty * item.product.Price;
    total += t;
    msg += `${item.product.Name}\nQty: ${item.qty}\n₹${t}\n\n`;
  });

  msg += `TOTAL: ₹${total}\n\n`;
  msg += `Name: ${customer.name}\nPhone: ${customer.phone}\nAddress: ${customer.address}`;

  window.location.href =
    `https://api.whatsapp.com/send?phone=${phoneNumber}&text=${encodeURIComponent(msg)}`;
}

// ================= RENDER PRODUCTS =================
function renderProducts(list) {
  const container = document.getElementById("product-list");
  container.innerHTML = "";

  list.forEach(p => {
    const card = document.createElement("div");
    card.className = "product-card";

    const minQty = p.MinQty || 1;

    card.innerHTML = `
      <img src="${p.Image || "placeholder.jpg"}">
      <h3>${p.Name}</h3>
      <p>₹${p.Price}</p>

      <div>
        <button onclick="changeQty('${p.id}',-1,${minQty})">-</button>
        <input id="qty-${p.id}" value="${minQty}">
        <button onclick="changeQty('${p.id}',1,${minQty})">+</button>
      </div>

      <button onclick="addToCart('${p.id}')">Add to Cart</button>
    `;

    container.appendChild(card);
  });
}

// ================= QTY +/- =================
function changeQty(id, delta, minQty) {
  const input = document.getElementById("qty-" + id);
  let v = parseInt(input.value) || minQty || 1;
  v += delta;
  if (v < minQty) v = minQty;
  input.value = v;
}

// ================= FIREBASE LOAD =================
function subscribeProducts() {
  db.collection("products").orderBy("Name")
    .onSnapshot(snapshot => {
      products = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      renderProducts(products);
    });
}

// ================= ADMIN LOGIN =================
const ADMIN_PASSWORD = "1513";

function setupAdminLogin() {
  const panel = document.getElementById("admin-panel");
  const logo = document.querySelector(".logo");

  logo.addEventListener("click", () => {
    const pwd = prompt("Enter admin password:");
    if (pwd === ADMIN_PASSWORD) {
      panel.style.display = "block";
    }
  });
}

// ================= ADMIN BUTTONS =================
function setupAdminButtons() {
  document.getElementById("admin-add")
    .addEventListener("click", async () => {
      const name = document.getElementById("p-name").value.trim();
      const price = Number(document.getElementById("p-price").value);

      if (!name || !price) {
        alert("Name & Price required");
        return;
      }

      await db.collection("products").add({
        Name: name,
        Price: price,
        InStock: true
      });

      alert("Product added");
    });
}

// ================= INIT =================
document.addEventListener("DOMContentLoaded", () => {
  updateCartUI();
  subscribeProducts();
  setupAdminLogin();
  setupAdminButtons();
});
