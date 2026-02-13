const WA_NUMBER = "917602884208";
const ADMIN_PASS = "1513";

/* ================= FIREBASE ================= */
firebase.initializeApp({
  apiKey: "AIzaSyA4SQeDddwhmSjTA_g9v2yuIYP-A7kR9ZE",
  authDomain: "sasta-siliguri.firebaseapp.com",
  projectId: "sasta-siliguri",
  storageBucket: "sasta-siliguri.appspot.com"
});

const db = firebase.firestore();
const storage = firebase.storage();

/* ================= GLOBAL ================= */
let products = [];
let cart = JSON.parse(localStorage.getItem("sasta_cart")) || [];
let editId = null;
let tap = 0;

/* ================= DOM ================= */
const productList = document.getElementById("product-list");
const adminPanel = document.getElementById("admin-panel");
const logo = document.querySelector(".logo");

/* ================= ADMIN 3 TAP ================= */
logo.onclick = () => {
  tap++;
  setTimeout(() => tap = 0, 600);

  if (tap === 3) {
    const p = prompt("Admin password");
    if (p === ADMIN_PASS) {
      document.getElementById("admin-login-btn").style.display = "none";
      adminPanel.style.display = "block";
      adminPanel.scrollIntoView({ behavior: "smooth" });
    }
  }
};

/* ================= LOAD PRODUCTS ================= */
db.collection("products").onSnapshot(snap => {
  products = snap.docs.map(d => ({ id: d.id, ...d.data() }));
  renderProducts(products);
});

/* ================= RENDER PRODUCTS ================= */
function renderProducts(list) {
  productList.innerHTML = "";

  list.forEach(p => {
    const name = p.Name || p.name || "Item";
    const price = p.Price || p.price || 0;
    const mrp = p.Mrp || p.mrp || "";
    const img = p.Image || p.image || "https://via.placeholder.com/300";
    const unit = p.Unit || "";
    const min = p.Min || 1;
    const stock = p.InStock !== false;

    productList.innerHTML += `
      <div class="product">
        <img src="${img}">
        <h3>${name}</h3>

        <div class="price-row">
          <span class="mrp">₹${mrp}</span>
          <span class="offer-price">₹${price}</span>
        </div>

        <div class="tag">${stock ? "In stock ✅" : "Out of stock ❌"}</div>

        <div class="qty">
          <button onclick="changeQty('${p.id}',-1)">−</button>
          <span id="q${p.id}">${min}</span>
          <button onclick="changeQty('${p.id}',1)">+</button>
        </div>

        <button class="add-to-cart" onclick="addToCart('${p.id}')">
          Add to Cart
        </button>
      </div>
    `;
  });
}

/* ================= QTY ================= */
function changeQty(id, d) {
  const e = document.getElementById("q" + id);
  let v = Number(e.innerText) + d;
  if (v < 1) v = 1;
  e.innerText = v;
}

/* ================= CART ================= */
function addToCart(id) {
  const p = products.find(x => x.id === id);
  if (!p || p.InStock === false) return;

  const qty = Number(document.getElementById("q" + id)?.innerText || 1);
  const found = cart.find(i => i.id === id);

  if (found) {
    found.qty += qty;
  } else {
    cart.push({
      id: p.id,
      name: p.Name,
      price: p.Price,
      unit: p.Unit || "",
      qty
    });
  }

  localStorage.setItem("sasta_cart", JSON.stringify(cart));
  renderCart();
}

/* ================= RENDER CART ================= */
function renderCart() {
  const box = document.getElementById("cart-items");
  const totalBox = document.getElementById("cart-total");
  if (!box) return;

  box.innerHTML = "";
  let total = 0;

  cart.forEach(i => {
    total += i.price * i.qty;
    box.innerHTML += `
      <div class="cart-row">
        ${i.name} (${i.qty} ${i.unit}) = ₹${i.price * i.qty}
        <button onclick="removeFromCart('${i.id}')">❌</button>
      </div>
    `;
  });

  totalBox.innerText = "Total: ₹" + total;
}

function removeFromCart(id) {
  cart = cart.filter(i => i.id !== id);
  localStorage.setItem("sasta_cart", JSON.stringify(cart));
  renderCart();
}

renderCart();

/* ================= IMAGE UPLOAD ================= */
async function uploadImage(file) {
  const ref = storage.ref("products/" + Date.now());
  await ref.put(file);
  return await ref.getDownloadURL();
}

/* ================= ADMIN SAVE ================= */
const pName = document.getElementById("p-name");
const pPrice = document.getElementById("p-price");
const pMrp = document.getElementById("p-mrp");
const pMin = document.getElementById("p-min");
const pUnit = document.getElementById("p-unit");
const pFile = document.getElementById("p-file");
const pStock = document.getElementById("p-stock");

document.getElementById("admin-save").onclick = async () => {
  let img = "";
  if (pFile.files[0]) img = await uploadImage(pFile.files[0]);

  const data = {
    Name: pName.value,
    Price: +pPrice.value,
    Mrp: +pMrp.value,
    Min: +pMin.value || 1,
    Unit: pUnit.value,
    Image: img,
    InStock: pStock.checked
  };

  editId
    ? db.collection("products").doc(editId).update(data)
    : db.collection("products").add(data);

  editId = null;
};

/* ================= ORDER WHATSAPP ================= */
document.getElementById("order-btn").onclick = () => {
  const name = custName.value.trim();
  const phone = custPhone.value.trim();
  const address = custAddress.value.trim();

  if (!name || !phone || !address) {
    alert("Please fill all details");
    return;
  }
  if (cart.length === 0) {
    alert("Cart is empty");
    return;
  }

  let msg = "*SASTA SILIGURI – DELIVERY BILL*\n\n";
  msg += "*Products:*\n";

  let total = 0;
  cart.forEach(i => {
    msg += `${i.name} (${i.qty} ${i.unit}) = Rs ${i.price * i.qty}\n`;
    total += i.price * i.qty;
  });

  msg += "\n-------------------------\n";
  msg += `*TOTAL AMOUNT: Rs ${total}*\n`;
  msg += "-------------------------\n\n";
  msg += `*Customer Name: ${name}*\n`;
  msg += `*Phone: ${phone}*\n`;
  msg += `*Address:* ${address}\n\n`;
  msg += "Delivery: Same Day (10am – 8pm)\n";
  msg += "Payment: Cash on Delivery\n";
  msg += "-------------------------\n\n";
  msg += "THANK YOU FOR SHOPPING *SASTA SILIGURI*";

  window.location.href =
    `https://wa.me/${WA_NUMBER}?text=${encodeURIComponent(msg)}`;
};

/* ================= CART POPUP ================= */
const viewCartBtn = document.getElementById("view-cart-btn");
const cartPopup = document.getElementById("cart-popup");
const cartClose = document.getElementById("cart-close");

viewCartBtn.onclick = () => {
  cartPopup.classList.add("show");
  document.body.style.overflow = "hidden";
};

cartClose.onclick = () => {
  cartPopup.classList.remove("show");
  document.body.style.overflow = "";
};
