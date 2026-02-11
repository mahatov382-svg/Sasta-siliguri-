// ========== WhatsApp number ==========
// 91 + number (without + sign)
const phoneNumber = "917602884208";

// ========== Firebase setup ==========

const firebaseConfig = {
  apiKey: "AIzaSyA4SQeDddwhmSjTA_g9v2yuIYP-A7kR9ZE",
  authDomain: "sasta-siliguri.firebaseapp.com",
  projectId: "sasta-siliguri",
  storageBucket: "sasta-siliguri.firebasestorage.app",
  messagingSenderId: "989707472922",
  appId: "1:989707472922:web:576cf7c9089fa1e65e81a3",
  measurementId: "G-0PSHKYBLTT"
};

firebase.initializeApp(firebaseConfig);
const db = firebase.firestore();

// ========== Global products list (from Firebase) ==========
let products = []; // { id, Name, Weight, Price, Mrp, MinQty, Unit, Image, InStock }

// ========== Helper: read customer details ==========

function getCustomerDetails() {
  const name = document.getElementById("cust-name").value.trim();
  const phone = document.getElementById("cust-phone").value.trim();
  const address = document.getElementById("cust-address").value.trim();

  if (!name || !phone || !address) {
    alert("Please fill your name, phone and address before ordering.");
    return null;
  }
  return { name, phone, address };
}

// ========== Qty +/- ==========

function changeQty(id, delta, minQty) {
  const input = document.getElementById("qty-" + id);
  if (!input) return;
  let value = parseInt(input.value, 10) || minQty || 1;
  value += delta;
  if (value < (minQty || 1)) value = minQty || 1;
  input.value = value;
}

// ========== WhatsApp order (FINAL BILL FORMAT) ==========

function orderProduct(id) {
  const product = products.find(p => p.id === id);
  if (!product) {
    alert("Product not found.");
    return;
  }

  if (!product.InStock) {
    alert("This item is currently out of stock.");
    return;
  }

  const customer = getCustomerDetails();
  if (!customer) return;

  const qtyInput = document.getElementById("qty-" + id);
  let qty = parseInt(qtyInput?.value, 10) || 1;

  const minQty = product.MinQty || 1;
  if (qty < minQty) {
    qty = minQty;
    if (qtyInput) qtyInput.value = qty;
  }

  const price = product.Price || 0;
  const mrp = product.Mrp || "-";
  const total = price * qty;
  const unit = product.Unit || "";
  const weight = product.Weight || "-";

  const billMessage =
`🧾 SASTA SILIGURI – DELIVERY BILL

📦 Product: ${product.Name}
⚖ Weight: ${weight}
🔢 Quantity: ${qty} ${unit}
💰 Price: ₹${price}
🏷 MRP: ₹${mrp}

-------------------------
✅ TOTAL AMOUNT: ₹${total}
-------------------------

👤 Customer Name: ${customer.name}

📞 Phone: ${customer.phone}
🏠 Address: ${customer.address}

🚚 Delivery: Same Day (10am – 8pm)

💸 Payment: Cash on Delivery.

_______________________🚚 Same Day Free Delivery

🙏 THANK YOU FOR SHOPPING SASTA SILIGURI`;

  const url = `https://api.whatsapp.com/send?phone=${phoneNumber}&text=${encodeURIComponent(billMessage)}`;
  window.location.href = url;
}

// ========== Render products (Market / Offer text) ==========

function renderProducts(list) {
  const container = document.getElementById("product-list");
  if (!container) return;

  container.innerHTML = "";

  list.forEach(p => {
    const card = document.createElement("div");
    card.className = "product-card";

    // Market / Offer price text
    const mrpHtml = (p.Mrp && p.Mrp > 0)
      ? `<span class="mrp-label">Market price</span> <span class="mrp">₹${p.Mrp}</span><br>`
      : "";

    const tagText = p.InStock ? "In stock✅" : "Out of stock ❌";
    const btnClass = p.InStock ? "btn-whatsapp" : "btn-disabled";
    const btnText = p.InStock ? "Order on WhatsApp" : "Out of stock";

    const minQty = p.MinQty || 1;
    const unit = p.Unit || "";
    const imgSrc = p.Image || "placeholder.jpg";

    card.innerHTML = `
      <img src="${imgSrc}" alt="${p.Name}">
      <h2>${p.Name}</h2>
      <p class="weight">${p.Weight || ""}</p>

    <div class="price-box">

  ${p.Mrp && p.Mrp > 0 ? `
  <div class="price-row market">
    <span class="label">Market price</span>
    <span class="value mrp">₹${p.Mrp}</span>
  </div>
  ` : ""}

  <div class="price-row offer">
    <span class="label">Offer price</span>
    <span class="value offer-price">₹${p.Price}</span>
  </div>

</div>
<p class="min-order">
  Minimum order: ${minQty} ${unit}
</p>

<p class="tag">${tagText}</p>

      <div class="qty-row">
        <button class="qty-btn" onclick="changeQty('${p.id}', -1, ${minQty})">-</button>
        <input id="qty-${p.id}" class="qty-input" type="number" min="${minQty}" value="${minQty}">
        <button class="qty-btn" onclick="changeQty('${p.id}', 1, ${minQty})">+</button>
      </div>

      <button class="btn ${btnClass}" onclick="orderProduct('${p.id}')">${btnText}</button>
    `;

    container.appendChild(card);
  });
}

// ========== Search ==========

function setupSearch() {
  const searchInput = document.getElementById("search-input");
  if (!searchInput) return;

  searchInput.addEventListener("input", () => {
    const q = searchInput.value.toLowerCase();
    const filtered = products.filter(p =>
      p.Name.toLowerCase().includes(q)
    );
    renderProducts(filtered);
  });
}

// ========== Firebase: subscribe to products collection ==========

function subscribeProducts() {
  db.collection("products")
    .orderBy("Name")
    .onSnapshot(snapshot => {
      products = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      renderProducts(products);
    }, err => {
      console.error("Firestore error:", err);
      alert("Error loading products from server. Check Firestore rules & config.");
    });
}

// ========== Admin login (simple password) ==========

const ADMIN_PASSWORD = "1513";

function setupAdminLogin() {
  const panel = document.getElementById("admin-panel");
  const logo = document.querySelector(".logo");
  const loginWrapper = document.querySelector(".admin-login-wrapper");
  const btn = document.getElementById("admin-login-btn");

  if (!panel || !logo) return;

  // ✅ Admin login button ko hide kar do (customer ko dikhega hi nahi)
  if (loginWrapper) loginWrapper.style.display = "none";
  if (btn) btn.style.display = "none";

  // Agar pehle unlock kiya tha to direct panel show
  const unlocked = localStorage.getItem("sasta_admin_unlocked") === "yes";
  if (unlocked) {
    panel.style.display = "block";
  }

  // ✅ Simple shortcut: logo pe tap -> password
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

// ========== Admin helpers (Firestore) ==========

async function readImageFileAsDataURL(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = e => resolve(e.target.result);
    reader.onerror = e => reject(e);
    reader.readAsDataURL(file);
  });
}

function getAdminFormValues() {
  const name = document.getElementById("p-name").value.trim();
  const weight = document.getElementById("p-weight").value.trim();
  const price = Number(document.getElementById("p-price").value);
  const mrp = Number(document.getElementById("p-mrp").value);
  const minQty = Number(document.getElementById("p-min").value) || 1;
  const unit = document.getElementById("p-unit").value.trim();
  const imageUrl = document.getElementById("p-image").value.trim();
  const fileInput = document.getElementById("p-file");
  const inStock = document.getElementById("p-stock").checked;

  return { name, weight, price, mrp, minQty, unit, imageUrl, fileInput, inStock };
}

async function findDocIdByName(name) {
  const snap = await db.collection("products")
    .where("Name", "==", name)
    .limit(1)
    .get();

  if (snap.empty) return null;
  return snap.docs[0].id;
}

// ========== Admin actions ==========

async function handleAddProduct() {
  try {
    const {
      name, weight, price, mrp, minQty,
      unit, imageUrl, fileInput, inStock
    } = getAdminFormValues();

    if (!name || !price) {
      alert("Name aur Price required hai.");
      return;
    }

    let image = imageUrl;
    if (fileInput.files && fileInput.files[0]) {
      image = await readImageFileAsDataURL(fileInput.files[0]);
    }

    await db.collection("products").add({
      Name: name,
      Weight: weight,
      Price: price,
      Mrp: mrp,
      MinQty: minQty || 1,
      Unit: unit,
      Image: image || "",
      InStock: inStock
    });

    alert("Product added (Firebase).");
  } catch (err) {
    console.error(err);
    alert("Error adding product. Console check karo.");
  }
}

async function handleSaveProduct() {
  try {
    const {
      name, weight, price, mrp, minQty,
      unit, imageUrl, fileInput, inStock
    } = getAdminFormValues();

    if (!name) {
      alert("Save / update ke liye Product name likho.");
      return;
    }

    const docId = await findDocIdByName(name);
    if (!docId) {
      alert("Is name ka product nahi mila.");
      return;
    }

    let image = imageUrl;
    if (fileInput.files && fileInput.files[0]) {
      image = await readImageFileAsDataURL(fileInput.files[0]);
    }

    const updateData = {
      Name: name,
      Weight: weight,
      Price: price || 0,
      Mrp: mrp || 0,
      MinQty: minQty || 1,
      Unit: unit,
      InStock: inStock
    };

    if (image) updateData.Image = image;

    await db.collection("products").doc(docId).update(updateData);
    alert("Product updated.");
  } catch (err) {
    console.error(err);
    alert("Error updating product.");
  }
}

async function handleDeleteProduct() {
  try {
    const name = document.getElementById("p-name").value.trim();
    if (!name) {
      alert("Delete ke liye Product name likho.");
      return;
    }

    const sure = confirm(`Delete "${name}" ?`);
    if (!sure) return;

    const docId = await findDocIdByName(name);
    if (!docId) {
      alert("Is name ka product nahi mila.");
      return;
    }

    await db.collection("products").doc(docId).delete();
    alert("Product deleted.");
  } catch (err) {
    console.error(err);
    alert("Error deleting product.");
  }
}

// ========== Setup admin buttons ==========

function setupAdminButtons() {
  const btnAdd = document.getElementById("admin-add");
  const btnSave = document.getElementById("admin-save");
  const btnDelete = document.getElementById("admin-delete");

  if (btnAdd) btnAdd.addEventListener("click", handleAddProduct);
  if (btnSave) btnSave.addEventListener("click", handleSaveProduct);
  if (btnDelete) btnDelete.addEventListener("click", handleDeleteProduct);
}

// ========== Init on page load ==========

document.addEventListener("DOMContentLoaded", () => {
  subscribeProducts();
  setupSearch();
  setupAdminLogin();
  setupAdminButtons();
});  const container = document.getElementById("product-list");
  if (!container) return;

  container.innerHTML = "";

  list.forEach(p => {
    const card = document.createElement("div");
    card.className = "product-card";

    // Market / Offer price text
    const mrpHtml = (p.Mrp && p.Mrp > 0)
      ? `<span class="mrp-label">Market price</span> <span class="mrp">₹${p.Mrp}</span><br>`
      : "";

    const tagText = p.InStock ? "In stock✅" : "Out of stock ❌";
    const btnClass = p.InStock ? "btn-whatsapp" : "btn-disabled";
    const btnText = p.InStock ? "Order on WhatsApp" : "Out of stock";

    const minQty = p.MinQty || 1;
    const unit = p.Unit || "";
    const imgSrc = p.Image || "placeholder.jpg";

    card.innerHTML = `
      <img src="${imgSrc}" alt="${p.Name}">
      <h2>${p.Name}</h2>
      <p class="weight">${p.Weight || ""}</p>

    <div class="price-box">

  ${p.Mrp && p.Mrp > 0 ? `
  <div class="price-row market">
    <span class="label">Market price</span>
    <span class="value mrp">₹${p.Mrp}</span>
  </div>
  ` : ""}

  <div class="price-row offer">
    <span class="label">Offer price</span>
    <span class="value offer-price">₹${p.Price}</span>
  </div>

</div>
<p class="min-order">
  Minimum order: ${minQty} ${unit}
</p>

<p class="tag">${tagText}</p>

      <div class="qty-row">
        <button class="qty-btn" onclick="changeQty('${p.id}', -1, ${minQty})">-</button>
        <input id="qty-${p.id}" class="qty-input" type="number" min="${minQty}" value="${minQty}">
        <button class="qty-btn" onclick="changeQty('${p.id}', 1, ${minQty})">+</button>
      </div>

      <button class="btn ${btnClass}" onclick="orderProduct('${p.id}')">${btnText}</button>
    `;

    container.appendChild(card);
  });
}

// ========== Search ==========

function setupSearch() {
  const searchInput = document.getElementById("search-input");
  if (!searchInput) return;

  searchInput.addEventListener("input", () => {
    const q = searchInput.value.toLowerCase();
    const filtered = products.filter(p =>
      p.Name.toLowerCase().includes(q)
    );
    renderProducts(filtered);
  });
}

// ========== Firebase: subscribe to products collection ==========

function subscribeProducts() {
  db.collection("products")
    .orderBy("Name")
    .onSnapshot(snapshot => {
      products = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      renderProducts(products);
    }, err => {
      console.error("Firestore error:", err);
      alert("Error loading products from server. Check Firestore rules & config.");
    });
}

// ========== Admin login (simple password) ==========

const ADMIN_PASSWORD = "1513";

function setupAdminLogin() {
  const panel = document.getElementById("admin-panel");
  const logo = document.querySelector(".logo");
  const loginWrapper = document.querySelector(".admin-login-wrapper");
  const btn = document.getElementById("admin-login-btn");

  if (!panel || !logo) return;

  // ✅ Admin login button ko hide kar do (customer ko dikhega hi nahi)
  if (loginWrapper) loginWrapper.style.display = "none";
  if (btn) btn.style.display = "none";

  // Agar pehle unlock kiya tha to direct panel show
  const unlocked = localStorage.getItem("sasta_admin_unlocked") === "yes";
  if (unlocked) {
    panel.style.display = "block";
  }

  // ✅ Simple shortcut: logo pe tap -> password
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

// ========== Admin helpers (Firestore) ==========

async function readImageFileAsDataURL(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = e => resolve(e.target.result);
    reader.onerror = e => reject(e);
    reader.readAsDataURL(file);
  });
}

function getAdminFormValues() {
  const name = document.getElementById("p-name").value.trim();
  const weight = document.getElementById("p-weight").value.trim();
  const price = Number(document.getElementById("p-price").value);
  const mrp = Number(document.getElementById("p-mrp").value);
  const minQty = Number(document.getElementById("p-min").value) || 1;
  const unit = document.getElementById("p-unit").value.trim();
  const imageUrl = document.getElementById("p-image").value.trim();
  const fileInput = document.getElementById("p-file");
  const inStock = document.getElementById("p-stock").checked;

  return { name, weight, price, mrp, minQty, unit, imageUrl, fileInput, inStock };
}

async function findDocIdByName(name) {
  const snap = await db.collection("products")
    .where("Name", "==", name)
    .limit(1)
    .get();

  if (snap.empty) return null;
  return snap.docs[0].id;
}

// ========== Admin actions ==========

async function handleAddProduct() {
  try {
    const {
      name, weight, price, mrp, minQty,
      unit, imageUrl, fileInput, inStock
    } = getAdminFormValues();

    if (!name || !price) {
      alert("Name aur Price required hai.");
      return;
    }

    let image = imageUrl;
    if (fileInput.files && fileInput.files[0]) {
      image = await readImageFileAsDataURL(fileInput.files[0]);
    }

    await db.collection("products").add({
      Name: name,
      Weight: weight,
      Price: price,
      Mrp: mrp,
      MinQty: minQty || 1,
      Unit: unit,
      Image: image || "",
      InStock: inStock
    });

    alert("Product added (Firebase).");
  } catch (err) {
    console.error(err);
    alert("Error adding product. Console check karo.");
  }
}

// ========== CART ==========
let cart = JSON.parse(localStorage.getItem("sasta_cart")) || {};
// cart = { productId: { product, qty } }

function saveCart() {
  localStorage.setItem("sasta_cart", JSON.stringify(cart));
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

  updateCartUI();
}
saveCart();

// ========== CART UI ==========
function updateCartUI() {
  const bar = document.getElementById("cart-bar");
  const countEl = document.getElementById("cart-count");

  let totalQty = 0;
  Object.values(cart).forEach(i => totalQty += i.qty);

  if (totalQty > 0) {
    bar.style.display = "flex";
    countEl.innerText = totalQty;
  } else {
    bar.style.display = "none";
  }
}
saveCart();


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

  totalBox.innerText = total;
}

// ========== CART → WHATSAPP ==========


function orderCartOnWhatsApp() {
  const customer = getCustomerDetails();
  if (!customer) return;

  let msg = "🧾 SASTA SILIGURI - ORDER\n\n";
  let grandTotal = 0;

  Object.values(cart).forEach(item => {
    const t = item.qty * item.product.Price;
    grandTotal += t;
    msg += `📦 ${item.product.Name}\nQty: ${item.qty}\nPrice: ₹${t}\n\n`;
  });

  msg += `TOTAL: ₹${grandTotal}\n\n`;
  msg += `👤 ${customer.name}\n📞 ${customer.phone}\n🏠 ${customer.address}`;

  window.location.href =
    `https://api.whatsapp.com/send?phone=${phoneNumber}&text=${encodeURIComponent(msg)}`;
}

  

async function handleDeleteProduct() {
  try {
    const name = document.getElementById("p-name").value.trim();
    if (!name) {
      alert("Delete ke liye Product name likho.");
      return;
    }

    const sure = confirm(`Delete "${name}" ?`);
    if (!sure) return;

    const docId = await findDocIdByName(name);
    if (!docId) {
      alert("Is name ka product nahi mila.");
      return;
    }

    await db.collection("products").doc(docId).delete();
    alert("Product deleted.");
  } catch (err) {
    console.error(err);
    alert("Error deleting product.");
  }
}

// ========== Setup admin buttons ==========

function setupAdminButtons() {
  const btnAdd = document.getElementById("admin-add");
  const btnSave = document.getElementById("admin-save");
  const btnDelete = document.getElementById("admin-delete");

  if (btnAdd) btnAdd.addEventListener("click", handleAddProduct);
  if (btnSave) btnSave.addEventListener("click", handleSaveProduct);
  if (btnDelete) btnDelete.addEventListener("click", handleDeleteProduct);
}

// ========== Init on page load ==========

document.addEventListener("DOMContentLoaded", () => {
  updateCartUI();
renderCartItems();
  subscribeProducts();
  setupSearch();
  setupAdminLogin();
  setupAdminButtons();
});


// ========== CART FIX FUNCTIONS (FINAL) ==========

function changeCartQty(id, delta) {
  if (!cart[id]) return;

  cart[id].qty += delta;

  if (cart[id].qty < 1) {
    delete cart[id];
  }

  saveCart();
  updateCartUI();
  renderCartItems();
}

function removeFromCart(id) {
  if (!cart[id]) return;

  delete cart[id];

  saveCart();
  updateCartUI();
  renderCartItems();
}
