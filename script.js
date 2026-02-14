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
let tapCount = 0;

/******************** DOM ********************/
const productList = document.getElementById("product-list");
const adminPanel = document.getElementById("admin-panel");
const logo = document.querySelector(".logo");
const searchInput = document.getElementById("search-input");

/******************** ADMIN – 3 TAP ********************/
logo.addEventListener("click", () => {
  tapCount++;
  setTimeout(() => (tapCount = 0), 600);

  if (tapCount === 3) {
    const pass = prompt("Enter Admin Password");
    if (pass === ADMIN_PASS) {
      document.body.classList.add("admin-on");
      adminPanel.style.display = "block";
      adminPanel.scrollIntoView({ behavior: "smooth" });
    } else {
      alert("Wrong Password");
    }
  }
});

/******************** LOAD PRODUCTS (FAST + REALTIME) ********************/
db.collection("products")
  .get({ source: "cache" })
  .then(snap => {
    if (!snap.empty) {
      products = snap.docs.map(d => ({ id: d.id, ...d.data() }));
      render(products);
    }
  })
  .catch(() => {});

db.collection("products").onSnapshot(snapshot => {
  products = snapshot.docs.map(d => ({ id: d.id, ...d.data() }));
  render(products);
});

/******************** SEARCH (LIVE FILTER) ********************/
searchInput.addEventListener("input", e => {
  const q = e.target.value.toLowerCase().trim();
  if (!q) {
    render(products);
  } else {
    render(
      products.filter(p =>
        (p.Name || "").toLowerCase().includes(q)
      )
    );
  }
});

/******************** RENDER PRODUCTS ********************/
function render(list) {
  productList.innerHTML = list
    .map(p => {
      const name = p.Name || "Item";
      const price = p.Price || 0;
      const mrp = p.Mrp || "";
      const img = p.Image || "https://via.placeholder.com/300";
      const min = p.Min || 1;
      const unit = p.Unit || "";
      const stock = p.InStock !== false;

      return `
        <div class="product">
          <img src="${img}" loading="lazy">
          <h3>${name}</h3>

          <div class="price-row">
            <span class="mrp">${mrp ? "₹" + mrp : ""}</span>
            <span class="offer-price">₹${price}</span>
          </div>

          <div class="tag">${stock ? "In stock ✅" : "Out of stock ❌"}</div>

          <div class="qty">
            <button onclick="changeQty('${p.id}',-1)">-</button>
            <span id="q${p.id}">${min}</span>
            <button onclick="changeQty('${p.id}',1)">+</button>
          </div>

          <button class="add-to-cart" onclick="addToCart('${p.id}')">
            Add to Cart
          </button>
        </div>
      `;
    })
    .join("");
}

/******************** QTY ********************/
function changeQty(id, d) {
  const el = document.getElementById("q" + id);
  if (!el) return;
  let v = Number(el.innerText) + d;
  if (v < 1) v = 1;
  el.innerText = v;
}

/******************** CART ********************/
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

/******************** RENDER CART ********************/
function renderCart() {
  const box = document.getElementById("cart-items");
  const totalBox = document.getElementById("cart-total");
  if (!box) return;

  let total = 0;
  box.innerHTML = "";

  cart.forEach(i => {
    total += i.price * i.qty;
    box.innerHTML += `
      <div class="cart-row">
        ${i.name} (${i.qty} ${i.unit}) – ₹${i.price * i.qty}
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

/******************** IMAGE UPLOAD ********************/
async function uploadImage(file) {
  const ref = storage.ref("products/" + Date.now());
  await ref.put(file);
  return await ref.getDownloadURL();
}

/******************** ADMIN SAVE / UPDATE ********************/
document.getElementById("admin-save").onclick = async () => {
  const data = {
    Name: document.getElementById("p-name").value,
    Price: +document.getElementById("p-price").value,
    Mrp: +document.getElementById("p-mrp").value,
    Min: +document.getElementById("p-min").value || 1,
    Unit: document.getElementById("p-unit").value,
    InStock: document.getElementById("p-stock").checked
  };

  const file = document.getElementById("p-file").files[0];
  if (file) data.Image = await uploadImage(file);

  editId
    ? db.collection("products").doc(editId).update(data)
    : db.collection("products").add(data);

  editId = null;
  alert("Product saved / updated");
};

/******************** WHATSAPP ORDER ********************/
document.getElementById("order-btn").onclick = () => {
  const name = document.getElementById("cust-name").value.trim();
  const phone = document.getElementById("cust-phone").value.trim();
  const address = document.getElementById("cust-address").value.trim();

  if (!name || !phone || !address) {
    alert("Please fill Name, Phone & Address first");
    return;
  }
  if (cart.length === 0) {
    alert("Cart is empty");
    return;
  }

  let msg = "*SASTA SILIGURI – ORDER*\n\n";
  let total = 0;

  cart.forEach(i => {
    msg += `${i.name} (${i.qty} ${i.unit}) = ₹${i.price * i.qty}\n`;
    total += i.price * i.qty;
  });

  msg += `\nTOTAL: ₹${total}\n\n`;
  msg += `Name: ${name}\nPhone: ${phone}\nAddress: ${address}`;

  window.location.href =
    `https://wa.me/${WA_NUMBER}?text=${encodeURIComponent(msg)}`;
};

/******************** CART POPUP ********************/
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
