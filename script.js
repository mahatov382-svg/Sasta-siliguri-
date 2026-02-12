/* ================= BASIC CONFIG ================= */
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
const storage = firebase.storage();

/* ================= GLOBAL ================= */
let products = [];
let cart = JSON.parse(localStorage.getItem("sasta_cart")) || {};
let selectedProductId = null;

/* ================= CART STORAGE ================= */
function saveCart() {
  localStorage.setItem("sasta_cart", JSON.stringify(cart));
}

/* ================= CUSTOMER ================= */
function getCustomerDetails() {
  const name = document.getElementById("cust-name").value.trim();
  const phone = document.getElementById("cust-phone").value.trim();
  const address = document.getElementById("cust-address").value.trim();

  if (!name || !phone || !address) {
    alert("Name, Phone, Address required");
    return null;
  }
  return { name, phone, address };
}

/* ================= ADD TO CART ================= */
function addToCart(id) {
  const product = products.find(p => p.id === id);
  if (!product || product.InStock === false) return;

  const qtyInput = document.getElementById("qty-" + id);
  const qty = parseInt(qtyInput.value) || product.MinQty || 1;

  if (cart[id]) cart[id].qty += qty;
  else cart[id] = { product, qty };

  saveCart();
  updateCartUI();
}

/* ================= CART BAR ================= */
function updateCartUI() {
  const bar = document.getElementById("cart-bar");
  const count = document.getElementById("cart-count");

  let totalQty = 0;
  Object.values(cart).forEach(i => totalQty += i.qty);

  bar.style.display = totalQty > 0 ? "flex" : "none";
  count.innerText = totalQty;
}

/* ================= CART MODAL ================= */
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

    box.innerHTML += `
      <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:10px;">
        <div>
          <b>${item.product.Name}</b><br>
          ${item.qty} × ₹${item.product.Price}
        </div>
        <button onclick="removeFromCart('${id}')" style="background:red;color:#fff;border:none;border-radius:50%;width:28px;height:28px;">×</button>
      </div>
      <hr>
    `;
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
    msg += `${item.product.Name} - ${item.qty} × ₹${item.product.Price} = ₹${t}\n`;
  });

  msg += `\nTOTAL: ₹${total}\n\n`;
  msg += `Name: ${customer.name}\nPhone: ${customer.phone}\nAddress: ${customer.address}`;

  window.location.href =
    `https://api.whatsapp.com/send?phone=${phoneNumber}&text=${encodeURIComponent(msg)}`;
}

/* ================= QTY +/- ================= */
function changeQty(id, delta, minQty) {
  const input = document.getElementById("qty-" + id);
  let value = parseInt(input.value) || minQty;
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

    container.innerHTML += `
      <div class="product-card">
        <img src="${p.Image || "placeholder.jpg"}">
        <h2>${p.Name}</h2>

        ${p.Mrp ? `<div>MRP: <del>₹${p.Mrp}</del></div>` : ""}
        <div><b>₹${p.Price}</b></div>

        <div>Min: ${minQty}</div>
        <div>${inStock ? "In stock ✅" : "Out ❌"}</div>

        <div class="qty-row">
          <button onclick="changeQty('${p.id}',-1,${minQty})">−</button>
          <input id="qty-${p.id}" value="${minQty}" type="number">
          <button onclick="changeQty('${p.id}',1,${minQty})">+</button>
        </div>

        <button onclick="addToCart('${p.id}')" ${!inStock ? "disabled" : ""}>
          Add to Cart
        </button>
      </div>
    `;
  });
}

/* ================= FIREBASE LOAD ================= */
function subscribeProducts() {
  db.collection("products").onSnapshot(snapshot => {
    products = snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));
    renderProducts(products);
  });
}

/* ================= ADMIN ================= */
const ADMIN_PASSWORD = "1513";

function setupAdminLogin() {
  const panel = document.getElementById("admin-panel");
  const btn = document.getElementById("admin-login-btn");
  if (!panel || !btn) return;

  btn.onclick = () => {
    const pwd = prompt("Admin password");
    if (pwd === ADMIN_PASSWORD) {
      panel.style.display = "block";
      panel.scrollIntoView({ behavior: "smooth" });
    } else alert("Wrong password");
  };
}

async function uploadImage(file) {
  const ref = storage.ref("products/" + Date.now() + "_" + file.name);
  await ref.put(file);
  return await ref.getDownloadURL();
}

async function saveOrUpdateProduct() {
  const name = pName.value.trim();
  const price = Number(pPrice.value);
  if (!name || !price) return alert("Name & Price required");

  let imageUrl = pImage.value;
  if (pFile.files[0]) imageUrl = await uploadImage(pFile.files[0]);

  const data = {
    Name: name,
    Weight: pWeight.value,
    Price: price,
    Mrp: Number(pMrp.value),
    MinQty: Number(pMin.value) || 1,
    Unit: pUnit.value,
    InStock: pStock.checked,
    Image: imageUrl
  };

  selectedProductId
    ? await db.collection("products").doc(selectedProductId).update(data)
    : await db.collection("products").add(data);

  clearAdminForm();
}

async function deleteProduct() {
  if (!selectedProductId) return alert("Select product first");
  await db.collection("products").doc(selectedProductId).delete();
  clearAdminForm();
}

function clearAdminForm() {
  selectedProductId = null;
  document.querySelectorAll("#admin-panel input").forEach(i => i.value = "");
  pStock.checked = true;
}

/* ================= INIT ================= */
document.addEventListener("DOMContentLoaded", () => {
  setupAdminLogin();
  subscribeProducts();
  updateCartUI();

  adminSave.onclick = saveOrUpdateProduct;
  adminAdd.onclick = () => { selectedProductId = null; saveOrUpdateProduct(); };
  adminDelete.onclick = deleteProduct;
});
