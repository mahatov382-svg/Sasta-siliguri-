/******************** BASIC CONFIG ********************/
const WA_NUMBER = "917602884208";
const ADMIN_PASS = "1513";

/******************** FIREBASE ********************/
firebase.initializeApp({
  apiKey: "AIzaSyA4SQeDddwhmSjTA_g9v2yuIYP-A7kR9ZE",
  authDomain: "sasta-siliguri.firebaseapp.com",
  projectId: "sasta-siliguri",
  storageBucket: "sasta-siliguri.appspot.com"
});

const db = firebase.firestore();
const storage = firebase.storage();

/******************** GLOBAL ********************/
let products = [];
let cart = JSON.parse(localStorage.getItem("sasta_cart")) || [];
let editId = null;
let tap = 0;

/******************** DOM ********************/
const productList = document.getElementById("product-list");
const adminPanel = document.getElementById("admin-panel");
const logo = document.querySelector(".logo");
const searchInput = document.getElementById("search-input");

/******************** ADMIN – 3 TAP ********************/
logo.onclick = () => {
  tap++;
  setTimeout(() => (tap = 0), 600);

  if (tap === 3) {
    const pass = prompt("Enter Admin Password");
    if (pass === ADMIN_PASS) {
      document.body.classList.add("admin-on");
      adminPanel.style.display = "block";
      adminPanel.scrollIntoView({ behavior: "smooth" });
    } else {
      alert("Wrong Password");
    }
  }
};

/******************** LOAD PRODUCTS (REALTIME) ********************/
db.collection("products").onSnapshot(snapshot => {
  products = snapshot.docs.map(d => ({ id: d.id, ...d.data() }));
  render(products);
});

/******************** SEARCH ********************/
searchInput.addEventListener("input", e => {
  const q = e.target.value.toLowerCase().trim();
  render(
    q
      ? products.filter(p => (p.Name || "").toLowerCase().includes(q))
      : products
  );
});

/******************** RENDER PRODUCTS ********************/
function render(list) {
  productList.innerHTML = list.map(p => `
    <div class="product" onclick="loadToAdmin('${p.id}')">

      <img src="${p.Image || 'https://via.placeholder.com/300'}" loading="lazy">

      <h3>${p.Name || "Item"}</h3>

      <!-- PRICE BLOCK WITH LABELS -->
      <div class="price-row">
        <div>
          <div style="font-size:11px;color:#777">Market price</div>
          <div class="mrp">${p.Mrp ? "₹" + p.Mrp : "-"}</div>
        </div>

        <div style="text-align:right">
          <div style="font-size:11px;color:#777">Offer price</div>
          <div class="offer-price">₹${p.Price || 0}</div>
        </div>
      </div>

      <div style="display:flex;justify-content:space-between;font-size:12px;font-weight:700">
        <span>Min order</span>
        <span>${p.Min || 1} ${p.Unit || ""}</span>
      </div>

      <div class="tag">${p.InStock === false ? "Out of stock ❌" : "In stock ✅"}</div>

      <div class="qty" onclick="event.stopPropagation()">
        <button onclick="changeQty('${p.id}',-1)">-</button>
        <span id="q${p.id}">${p.Min || 1}</span>
        <button onclick="changeQty('${p.id}',1)">+</button>
      </div>

      <button class="add-to-cart"
        onclick="event.stopPropagation();addToCart('${p.id}')">
        Add to Cart
      </button>

    </div>
  `).join("");
}

/******************** LOAD PRODUCT → ADMIN ********************/
function loadToAdmin(id) {
  const p = products.find(x => x.id === id);
  if (!p) return;

  editId = id;

  p-name.value = p.Name || "";
  p-price.value = p.Price || "";
  p-mrp.value = p.Mrp || "";
  p-min.value = p.Min || 1;
  p-unit.value = p.Unit || "";
  p-stock.checked = p.InStock !== false;

  adminPanel.scrollIntoView({ behavior: "smooth" });
}

/******************** QTY ********************/
function changeQty(id, d) {
  const el = document.getElementById("q" + id);
  let v = Number(el.innerText) + d;
  if (v < 1) v = 1;
  el.innerText = v;
}

/******************** CART ********************/
function addToCart(id) {
  const p = products.find(x => x.id === id);
  if (!p || p.InStock === false) return;

  const qty = Number(document.getElementById("q" + id).innerText);
  const f = cart.find(i => i.id === id);

  f ? f.qty += qty : cart.push({
    id: p.id,
    name: p.Name,
    price: p.Price,
    unit: p.Unit || "",
    qty
  });

  localStorage.setItem("sasta_cart", JSON.stringify(cart));
  renderCart();
}

function renderCart() {
  const box = document.getElementById("cart-items");
  const totalBox = document.getElementById("cart-total");
  let total = 0;
  box.innerHTML = "";

  cart.forEach(i => {
    total += i.price * i.qty;
    box.innerHTML += `
      <div class="cart-row">
        ${i.name} (${i.qty} ${i.unit}) – ₹${i.price * i.qty}
        <button onclick="removeFromCart('${i.id}')">❌</button>
      </div>`;
  });

  totalBox.innerText = "Total: ₹" + total;
}
renderCart();

function removeFromCart(id) {
  cart = cart.filter(i => i.id !== id);
  localStorage.setItem("sasta_cart", JSON.stringify(cart));
  renderCart();
}

/******************** IMAGE UPLOAD ********************/
async function uploadImage(file) {
  const ref = storage.ref("products/" + Date.now());
  await ref.put(file);
  return await ref.getDownloadURL();
}

/******************** ADMIN SAVE / UPDATE ********************/
document.getElementById("admin-save").onclick = async () => {
  const data = {
    Name: p-name.value.trim(),
    Price: +p-price.value,
    Mrp: +p-mrp.value,
    Min: +p-min.value || 1,
    Unit: p-unit.value,
    InStock: p-stock.checked
  };

  const file = p-file.files[0];
  if (file) data.Image = await uploadImage(file);

  editId
    ? await db.collection("products").doc(editId).update(data)
    : await db.collection("products").add(data);

  alert("Saved successfully");
  document.getElementById("admin-clear").click();
};

/******************** ADMIN ADD NEW ********************/
document.getElementById("admin-clear").onclick = () => {
  editId = null;
  adminPanel.querySelectorAll("input").forEach(i => {
    if (i.type !== "checkbox") i.value = "";
  });
  p-stock.checked = true;
};

/******************** ADMIN DELETE ********************/
document.getElementById("admin-delete").onclick = async () => {
  if (!editId) return alert("Select product first");
  if (confirm("Delete this product?")) {
    await db.collection("products").doc(editId).delete();
    document.getElementById("admin-clear").click();
  }
};

/******************** CART POPUP ********************/
view-cart-btn.onclick = () => cart-popup.classList.add("show");
cart-close.onclick = () => cart-popup.classList.remove("show");
