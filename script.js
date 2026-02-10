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
let cart = {};
let logoTapCount = 0;
const ADMIN_PASSWORD = "1513";

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

// ================= QTY =================
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

  const qty = parseInt(document.getElementById("qty-" + id).value) || 1;

  if (cart[id]) cart[id].qty += qty;
  else cart[id] = { product, qty };

  updateCartUI();
}

// ================= CART UI =================
function updateCartUI() {
  const cartBar = document.getElementById("cart-bar");
  const cartCount = document.getElementById("cart-count");
  const cartItems = document.getElementById("cart-items");
  const cartTotal = document.getElementById("cart-total");

  let count = 0, total = 0;
  cartItems.innerHTML = "";

  Object.values(cart).forEach(item => {
    count += item.qty;
    total += item.qty * item.product.Price;
    const div = document.createElement("div");
    div.innerHTML = `<b>${item.product.Name}</b> × ${item.qty}`;
    cartItems.appendChild(div);
  });

  cartCount.innerText = count;
  cartTotal.innerText = total;
  cartBar.style.display = count ? "flex" : "none";
}

// ================= CART BUTTONS =================
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

  let msg = "🧾 SASTA SILIGURI ORDER\n\n";
  let total = 0;

  Object.values(cart).forEach(i => {
    total += i.qty * i.product.Price;
    msg += `${i.product.Name} × ${i.qty}\n`;
  });

  msg += `\nTOTAL ₹${total}\n${customer.name}\n${customer.phone}\n${customer.address}`;

  window.location.href =
    `https://api.whatsapp.com/send?phone=${phoneNumber}&text=${encodeURIComponent(msg)}`;
};

// ================= RENDER PRODUCTS =================
function renderProducts(list) {
  const box = document.getElementById("product-list");
  box.innerHTML = "";

  list.forEach(p => {
    const d = document.createElement("div");
    d.className = "product-card";
    d.innerHTML = `
      <img src="${p.Image || "placeholder.jpg"}">
      <h2>${p.Name}</h2>
      <p>Offer ₹${p.Price}</p>
      <div class="qty-row">
        <button onclick="changeQty('${p.id}',-1,${p.MinQty||1})">-</button>
        <input id="qty-${p.id}" value="${p.MinQty||1}">
        <button onclick="changeQty('${p.id}',1,${p.MinQty||1})">+</button>
      </div>
      <button onclick="addToCart('${p.id}')">Add to Cart</button>
    `;
    box.appendChild(d);
  });
}

// ================= SEARCH =================
document.getElementById("search-input").addEventListener("input", e => {
  const q = e.target.value.toLowerCase();
  renderProducts(products.filter(p => p.Name.toLowerCase().includes(q)));
});

// ================= FIREBASE =================
db.collection("products").onSnapshot(snap => {
  products = snap.docs.map(d => ({ id: d.id, ...d.data() }));
  renderProducts(products);
});

// ================= ADMIN LOGIN (3 TAP) =================
function setupAdminLogin() {
  const panel = document.getElementById("admin-panel");
  const logo = document.querySelector(".logo");

  panel.style.display = "none";

  logo.addEventListener("click", () => {
    logoTapCount++;

    if (logoTapCount === 3) {
      logoTapCount = 0;
      const pwd = prompt("Admin password:");
      if (pwd === ADMIN_PASSWORD) {
        panel.style.display = "block";
      } else {
        alert("Galat password");
      }
    }
  });
}

// ================= ADMIN ACTIONS =================
async function handleAddProduct() {
  await db.collection("products").add({
    Name: p("p-name"),
    Price: +p("p-price"),
    Mrp: +p("p-mrp"),
    MinQty: +p("p-min") || 1,
    Unit: p("p-unit"),
    Image: p("p-image"),
    InStock: document.getElementById("p-stock").checked
  });
  alert("Product added");
}

async function handleSaveProduct() {
  const name = p("p-name");
  const snap = await db.collection("products").where("Name","==",name).limit(1).get();
  if (snap.empty) return alert("Product nahi mila");
  await db.collection("products").doc(snap.docs[0].id).update({
    Price:+p("p-price"), Mrp:+p("p-mrp")
  });
  alert("Updated");
}

async function handleDeleteProduct() {
  const name = p("p-name");
  const snap = await db.collection("products").where("Name","==",name).limit(1).get();
  if (snap.empty) return alert("Product nahi mila");
  await db.collection("products").doc(snap.docs[0].id).delete();
  alert("Deleted");
}

function p(id){ return document.getElementById(id).value.trim(); }

// ================= INIT =================
document.addEventListener("DOMContentLoaded", () => {
  setupAdminLogin();
  document.getElementById("admin-add").onclick = handleAddProduct;
  document.getElementById("admin-save").onclick = handleSaveProduct;
  document.getElementById("admin-delete").onclick = handleDeleteProduct;
});
