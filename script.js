// ================= BASIC SETUP =================
const phoneNumber = "917602884208";

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

let products = [];
let cart = {}; // { productId: {product, qty} }

// ================= CUSTOMER =================
function getCustomerDetails() {
  const name = cust-name.value.trim();
  const phone = cust-phone.value.trim();
  const address = cust-address.value.trim();
  if (!name || !phone || !address) {
    alert("Name, phone aur address bharo");
    return null;
  }
  return { name, phone, address };
}

// ================= CART LOGIC =================
function addToCart(product) {
  if (!cart[product.id]) {
    cart[product.id] = { product, qty: product.MinQty || 1 };
  } else {
    cart[product.id].qty++;
  }
  updateCartUI();
}

function updateCartUI() {
  const count = Object.values(cart).reduce((a, c) => a + c.qty, 0);
  cart-count.textContent = count;

  cart-bar.style.display = count > 0 ? "flex" : "none";

  let total = 0;
  cart-items.innerHTML = "";

  Object.values(cart).forEach(item => {
    const p = item.product;
    total += p.Price * item.qty;

    cart-items.innerHTML += `
      <div class="cart-item">
        <strong>${p.Name}</strong><br>
        Qty: ${item.qty} × ₹${p.Price}
      </div>
    `;
  });

  cart-total.textContent = total;
}

// ================= CART MODAL =================
open-cart.onclick = () => cart-modal.style.display = "flex";
close-cart.onclick = () => cart-modal.style.display = "none";

// ================= WHATSAPP ORDER =================
cart-whatsapp.onclick = () => {
  const customer = getCustomerDetails();
  if (!customer) return;

  let message = `🧾 SASTA SILIGURI – ORDER\n\n`;
  let total = 0;

  Object.values(cart).forEach(item => {
    const p = item.product;
    const sub = p.Price * item.qty;
    total += sub;

    message += `• ${p.Name}\n  Qty: ${item.qty} ${p.Unit || ""}\n  ₹${sub}\n\n`;
  });

  message += `-----------------\nTOTAL: ₹${total}\n\n`;
  message += `👤 ${customer.name}\n📞 ${customer.phone}\n🏠 ${customer.address}\n\n🚚 Same Day Delivery\n💸 COD`;

  window.location.href =
    "https://api.whatsapp.com/send?phone=" +
    phoneNumber +
    "&text=" +
    encodeURIComponent(message);
};

// ================= RENDER PRODUCTS =================
function renderProducts(list) {
  product-list.innerHTML = "";

  list.forEach(p => {
    const card = document.createElement("div");
    card.className = "product-card";

    card.innerHTML = `
      <img src="${p.Image || "placeholder.jpg"}">
      <h2>${p.Name}</h2>

      <div class="price-row">
        <span>Offer price</span>
        <span class="offer-price">₹${p.Price}</span>
      </div>

      <button class="btn btn-whatsapp">
        Add to Cart
      </button>
    `;

    card.querySelector("button").onclick = () => addToCart(p);
    product-list.appendChild(card);
  });
}

// ================= FIREBASE =================
db.collection("products")
  .orderBy("Name")
  .onSnapshot(snap => {
    products = snap.docs.map(d => ({ id: d.id, ...d.data() }));
    renderProducts(products);
  });

// ================= SEARCH =================
search-input.oninput = () => {
  const q = search-input.value.toLowerCase();
  renderProducts(products.filter(p => p.Name.toLowerCase().includes(q)));
};
