// ========== WhatsApp number ==========
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

// ========== Global products ==========
let products = [];

// ========== CART ==========
let cart = [];

// ========== Customer details ==========
function getCustomerDetails() {
  const name = document.getElementById("cust-name").value.trim();
  const phone = document.getElementById("cust-phone").value.trim();
  const address = document.getElementById("cust-address").value.trim();

  if (!name || !phone || !address) {
    alert("Name, phone aur address bharo");
    return null;
  }
  return { name, phone, address };
}

// ========== Qty +/- ==========
function changeQty(id, delta, minQty) {
  const input = document.getElementById("qty-" + id);
  if (!input) return;
  let value = parseInt(input.value) || minQty || 1;
  value += delta;
  if (value < minQty) value = minQty;
  input.value = value;
}

// ========== ADD TO CART ==========
function addToCart(id) {
  const product = products.find(p => p.id === id);
  if (!product || !product.InStock) return;

  const qty = parseInt(document.getElementById("qty-" + id).value) || product.MinQty;

  const found = cart.find(i => i.id === id);
  if (found) {
    found.qty += qty;
  } else {
    cart.push({
      id,
      name: product.Name,
      price: product.Price,
      qty,
      unit: product.Unit || ""
    });
  }

  updateCartUI();
}

// ========== CART UI ==========
function updateCartUI() {
  const cartBar = document.getElementById("cart-bar");
  const cartCount = document.getElementById("cart-count");
  const cartItems = document.getElementById("cart-items");
  const cartTotal = document.getElementById("cart-total");

  cartBar.style.display = cart.length ? "flex" : "none";
  cartCount.innerText = cart.length;

  cartItems.innerHTML = "";
  let total = 0;

  cart.forEach(item => {
    const t = item.qty * item.price;
    total += t;

    const div = document.createElement("div");
    div.innerHTML = `
      <b>${item.name}</b><br>
      ${item.qty} ${item.unit} × ₹${item.price} = ₹${t}
      <hr>
    `;
    cartItems.appendChild(div);
  });

  cartTotal.innerText = total;
}

// ========== CART → WHATSAPP ==========
document.getElementById("cart-whatsapp")?.addEventListener("click", () => {
  const customer = getCustomerDetails();
  if (!customer || cart.length === 0) return;

  let msg = `🧾 SASTA SILIGURI – ORDER\n\n`;
  let total = 0;

  cart.forEach((i, n) => {
    const t = i.qty * i.price;
    total += t;
    msg += `${n + 1}. ${i.name}\nQty: ${i.qty} ${i.unit}\n₹${t}\n\n`;
  });

  msg += `TOTAL: ₹${total}\n\n`;
  msg += `👤 ${customer.name}\n📞 ${customer.phone}\n🏠 ${customer.address}\n\n🚚 Same Day Delivery`;

  window.location.href =
    `https://api.whatsapp.com/send?phone=${phoneNumber}&text=${encodeURIComponent(msg)}`;
});

// ========== CART OPEN / CLOSE ==========
document.getElementById("open-cart")?.addEventListener("click", () => {
  document.getElementById("cart-modal").style.display = "block";
});
document.getElementById("close-cart")?.addEventListener("click", () => {
  document.getElementById("cart-modal").style.display = "none";
});

// ========== Render products ==========
function renderProducts(list) {
  const container = document.getElementById("product-list");
  container.innerHTML = "";

  list.forEach(p => {
    const minQty = p.MinQty || 1;
    const unit = p.Unit || "";

    const card = document.createElement("div");
    card.className = "product-card";

    card.innerHTML = `
      <img src="${p.Image || "placeholder.jpg"}">
      <h2>${p.Name}</h2>
      <p>${p.Weight || ""}</p>

      ${p.Mrp ? `<p><s>₹${p.Mrp}</s></p>` : ""}
      <p><b>₹${p.Price}</b></p>

      <p>Minimum order: ${minQty} ${unit}</p>

      <div class="qty-row">
        <button onclick="changeQty('${p.id}',-1,${minQty})">-</button>
        <input id="qty-${p.id}" value="${minQty}" type="number">
        <button onclick="changeQty('${p.id}',1,${minQty})">+</button>
      </div>

      <button class="btn btn-whatsapp"
        onclick="addToCart('${p.id}')">
        Add to Cart
      </button>
    `;
    container.appendChild(card);
  });
}

// ========== Search ==========
function setupSearch() {
  document.getElementById("search-input")
    .addEventListener("input", e => {
      const q = e.target.value.toLowerCase();
      renderProducts(products.filter(p => p.Name.toLowerCase().includes(q)));
    });
}

// ========== Firebase products ==========
function subscribeProducts() {
  db.collection("products").orderBy("Name").onSnapshot(snap => {
    products = snap.docs.map(d => ({ id: d.id, ...d.data() }));
    renderProducts(products);
  });
}

// ========== INIT ==========
document.addEventListener("DOMContentLoaded", () => {
  subscribeProducts();
  setupSearch();
});
