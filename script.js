/**************** BASIC ****************/
const phone = "917602884208";
const ADMIN_PASS = "1513";

/**************** ELEMENTS ****************/
const logo = document.getElementById("logo");
const adminPanel = document.getElementById("admin-panel");
const productList = document.getElementById("product-list");

const cartBar = document.getElementById("cart-bar");
const cartCount = document.getElementById("cart-count");
const cartModal = document.getElementById("cart-modal");
const cartItems = document.getElementById("cart-items");
const cartTotal = document.getElementById("cart-total");

/**************** ADMIN INPUTS ****************/
const pName = document.getElementById("p-name");
const pPrice = document.getElementById("p-price");
const pMrp = document.getElementById("p-mrp");
const pMin = document.getElementById("p-min");
const pUnit = document.getElementById("p-unit");
const pImage = document.getElementById("p-image");
const pFile = document.getElementById("p-file");
const pStock = document.getElementById("p-stock");

/**************** FIREBASE ****************/
firebase.initializeApp({
  apiKey: "AIzaSyA4SQeDddwhmSjTA_g9v2yuIYP-A7kR9ZE",
  authDomain: "sasta-siliguri.firebaseapp.com",
  projectId: "sasta-siliguri",
  storageBucket: "sasta-siliguri.appspot.com"
});

const db = firebase.firestore();
const storage = firebase.storage();

/**************** GLOBAL ****************/
let products = [];
let cart = {};
let editId = null;
let adminTap = 0;

/**************** ADMIN 3 TAP ****************/
logo.addEventListener("click", () => {
  adminTap++;
  setTimeout(() => (adminTap = 0), 700);

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

/**************** SEARCH ****************/
function searchProduct(q) {
  const v = q.toLowerCase();
  const f = products.filter(p =>
    p.Name.toLowerCase().includes(v)
  );
  renderProducts(f);
}

/**************** RENDER PRODUCTS ****************/
function renderProducts(list) {
  productList.innerHTML = "";

  list.forEach(p => {
    const min = p.MinQty || 1;

    productList.innerHTML += `
      <div class="product">
        <img src="${p.Image || "https://via.placeholder.com/300"}">

        <h3>${p.Name}</h3>

        ${p.Mrp ? `<del>₹${p.Mrp}</del>` : ""}
        <b style="font-size:18px;">₹${p.Price}</b>

        <p>Minimum order: ${min} ${p.Unit || ""}</p>
        <p>${p.InStock ? "In stock ✅" : "Out of stock ❌"}</p>

        <div class="qty">
          <button onclick="changeQty('${p.id}',-1,${min})">−</button>
          <span id="qty-${p.id}">${min}</span>
          <button onclick="changeQty('${p.id}',1,${min})">+</button>
        </div>

        <button class="add" onclick="addToCart('${p.id}')">
          Add to Cart
        </button>
      </div>
    `;
  });
}

/**************** QTY ****************/
function changeQty(id, d, min) {
  const el = document.getElementById("qty-" + id);
  let v = parseInt(el.innerText) + d;
  if (v < min) v = min;
  el.innerText = v;
}

/**************** CART ****************/
function addToCart(id) {
  const qty = parseInt(document.getElementById("qty-" + id).innerText);
  cart[id] = (cart[id] || 0) + qty;
  updateCart();
}

function updateCart() {
  const total = Object.values(cart).reduce((a, b) => a + b, 0);
  if (total > 0) {
    cartBar.style.display = "flex";
    cartCount.innerText = total;
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

/**************** IMAGE UPLOAD ****************/
async function uploadImage(file) {
  const ref = storage.ref("products/" + Date.now() + "_" + file.name);
  await ref.put(file);
  return await ref.getDownloadURL();
}

/**************** ADMIN SAVE ****************/
async function saveProduct() {
  if (!pName.value || !pPrice.value) {
    alert("Name & Price required");
    return;
  }

  let imageUrl = pImage.value;

  if (pFile.files.length > 0) {
    imageUrl = await uploadImage(pFile.files[0]);
  }

  const data = {
    Name: pName.value,
    Price: +pPrice.value,
    Mrp: +pMrp.value || 0,
    MinQty: +pMin.value || 1,
    Unit: pUnit.value || "",
    Image: imageUrl,
    InStock: pStock.checked
  };

  if (editId) {
    await db.collection("products").doc(editId).update(data);
    alert("Product updated");
  } else {
    await db.collection("products").add(data);
    alert("Product added");
  }

  clearAdmin();
}

function newProduct() {
  editId = null;
  clearAdmin();
}

function deleteProduct() {
  if (!editId) {
    alert("Select product first");
    return;
  }
  db.collection("products").doc(editId).delete();
  clearAdmin();
}

function clearAdmin() {
  pName.value = "";
  pPrice.value = "";
  pMrp.value = "";
  pMin.value = "";
  pUnit.value = "";
  pImage.value = "";
  pFile.value = "";
  pStock.checked = true;
  editId = null;
}
