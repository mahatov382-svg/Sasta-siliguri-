/**************** BASIC ****************/
const phone = "917602884208";
const ADMIN_PASS = "1513";

const logo = document.getElementById("logo");
const adminPanel = document.getElementById("admin-panel");
const productList = document.getElementById("product-list");

const cartBar = document.getElementById("cart-bar");
const cartCount = document.getElementById("cart-count");
const cartModal = document.getElementById("cart-modal");
const cartItems = document.getElementById("cart-items");
const cartTotal = document.getElementById("cart-total");

/**************** FIREBASE ****************/
firebase.initializeApp({
  apiKey: "AIzaSyA4SQeDddwhmSjTA_g9v2yuIYP-A7kR9ZE",
  authDomain: "sasta-siliguri.firebaseapp.com",
  projectId: "sasta-siliguri"
});

const db = firebase.firestore();

/**************** GLOBAL ****************/
let products = [];
let cart = {};
let adminTap = 0;
let editId = null;

/**************** ADMIN 3 TAP ****************/
logo.addEventListener("click", () => {
  adminTap++;
  setTimeout(() => adminTap = 0, 600);

  if (adminTap === 3) {
    const p = prompt("Enter admin password");
    if (p === ADMIN_PASS) {
      adminPanel.style.display = "block";
      adminPanel.scrollIntoView({ behavior: "smooth" });
    } else {
      alert("Wrong password");
    }
  }
});

/**************** LOAD PRODUCTS ****************/
db.collection("products").onSnapshot(snap => {
  products = snap.docs.map(d => ({ id: d.id, ...d.data() }));
  renderProducts(products);
});

/**************** RENDER PRODUCTS ****************/
function renderProducts(list) {
  productList.innerHTML = "";

  list.forEach(p => {
    productList.innerHTML += `
      <div class="product-card">
        <img src="${p.Image || 'https://via.placeholder.com/300'}">
        <h3>${p.Name}</h3>

        <div class="price">
          ${p.Mrp ? `<del>₹${p.Mrp}</del>` : ""}
          <span>₹${p.Price}</span>
        </div>

        <div class="stock">
          ${p.InStock ? "In stock ✅" : "Out of stock ❌"}
        </div>

        <div class="qty">
          <button onclick="changeQty('${p.id}',-1)">−</button>
          <span id="qty-${p.id}">1</span>
          <button onclick="changeQty('${p.id}',1)">+</button>
        </div>

        <button class="add" onclick="addToCart('${p.id}')">
          Add to Cart
        </button>
      </div>
    `;
  });
}

/**************** QTY ****************/
function changeQty(id, d) {
  const el = document.getElementById("qty-" + id);
  let v = parseInt(el.innerText) + d;
  if (v < 1) v = 1;
  el.innerText = v;
}

/**************** CART ****************/
function addToCart(id) {
  const qty = parseInt(document.getElementById("qty-" + id).innerText);
  cart[id] = (cart[id] || 0) + qty;
  updateCart();
}

function updateCart() {
  const totalQty = Object.values(cart).reduce((a,b)=>a+b,0);
  if (totalQty > 0) {
    cartBar.style.display = "flex";
    cartCount.innerText = totalQty;
  }
}

function openCart() {
  cartModal.style.display = "block";
  cartItems.innerHTML = "";
  let total = 0;

  for (let id in cart) {
    const p = products.find(x => x.id === id);
    const line = cart[id] * p.Price;
    total += line;

    cartItems.innerHTML += `
      <p>${p.Name} × ${cart[id]} = ₹${line}</p>
    `;
  }

  cartTotal.innerText = total;
}

function closeCart() {
  cartModal.style.display = "none";
}

/**************** WHATSAPP ORDER ****************/
function orderWhatsApp() {
  const name = document.getElementById("cust-name").value;
  const phoneNo = document.getElementById("cust-phone").value;
  const addr = document.getElementById("cust-address").value;

  if (!name || !phoneNo || !addr) {
    alert("Please fill name, phone & address");
    return;
  }

  let msg = "🧾 SASTA SILIGURI ORDER\n\n";
  let total = 0;

  for (let id in cart) {
    const p = products.find(x => x.id === id);
    const line = cart[id] * p.Price;
    total += line;
    msg += `${p.Name} × ${cart[id]} = ₹${line}\n`;
  }

  msg += `\nTOTAL: ₹${total}\n\n`;
  msg += `Name: ${name}\nPhone: ${phoneNo}\nAddress: ${addr}`;

  window.location.href =
    `https://wa.me/${phone}?text=${encodeURIComponent(msg)}`;
}

/**************** ADMIN ****************/
function saveProduct() {
  const d = {
    Name: pName.value,
    Price: +pPrice.value,
    Mrp: +pMrp.value,
    Image: pImage.value,
    InStock: pStock.checked
  };

  editId
    ? db.collection("products").doc(editId).update(d)
    : db.collection("products").add(d);
}

function newProduct() {
  editId = null;
}

function deleteProduct() {
  if (editId) db.collection("products").doc(editId).delete();
}
