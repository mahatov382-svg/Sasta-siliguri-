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
logo.onclick = () => {
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
};

/******************** LOAD PRODUCTS ********************/
db.collection("products").onSnapshot(snap => {
  products = snap.docs.map(d => ({ id: d.id, ...d.data() }));
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
      <img src="${p.Image || 'https://via.placeholder.com/300'}">
      <h3>${p.Name}</h3>

      <div class="price-row">
        <span class="mrp">${p.Mrp ? "₹"+p.Mrp : ""}</span>
        <span class="offer-price">₹${p.Price}</span>
      </div>

      <div class="tag">${p.InStock ? "In stock ✅" : "Out of stock ❌"}</div>

      <div class="qty" onclick="event.stopPropagation()">
        <button onclick="changeQty('${p.id}',-1)">-</button>
        <span id="q${p.id}">${p.Min || 1}</span>
        <button onclick="changeQty('${p.id}',1)">+</button>
      </div>

      <button class="add-to-cart" onclick="event.stopPropagation();addToCart('${p.id}')">
        Add to Cart
      </button>
    </div>
  `).join("");
}

/******************** LOAD PRODUCT TO ADMIN ********************/
function loadToAdmin(id){
  const p = products.find(x => x.id === id);
  if(!p) return;

  editId = id;
  document.getElementById("p-name").value = p.Name || "";
  document.getElementById("p-price").value = p.Price || "";
  document.getElementById("p-mrp").value = p.Mrp || "";
  document.getElementById("p-min").value = p.Min || 1;
  document.getElementById("p-unit").value = p.Unit || "";
  document.getElementById("p-stock").checked = p.InStock !== false;

  adminPanel.scrollIntoView({ behavior:"smooth" });
}

/******************** QTY ********************/
function changeQty(id,d){
  const el = document.getElementById("q"+id);
  let v = Number(el.innerText) + d;
  if(v < 1) v = 1;
  el.innerText = v;
}

/******************** CART ********************/
function addToCart(id){
  const p = products.find(x => x.id === id);
  if(!p || p.InStock === false) return;

  const qty = Number(document.getElementById("q"+id).innerText);
  const f = cart.find(i => i.id === id);

  f ? f.qty += qty : cart.push({
    id:p.id, name:p.Name, price:p.Price, unit:p.Unit||"", qty
  });

  localStorage.setItem("sasta_cart", JSON.stringify(cart));
  renderCart();
}

function renderCart(){
  const box = document.getElementById("cart-items");
  const totalBox = document.getElementById("cart-total");
  let total = 0;
  box.innerHTML = "";

  cart.forEach(i=>{
    total += i.price*i.qty;
    box.innerHTML += `
      <div class="cart-row">
        ${i.name} (${i.qty} ${i.unit}) – ₹${i.price*i.qty}
        <button onclick="removeFromCart('${i.id}')">❌</button>
      </div>`;
  });

  totalBox.innerText = "Total: ₹"+total;
}
function removeFromCart(id){
  cart = cart.filter(i=>i.id!==id);
  localStorage.setItem("sasta_cart", JSON.stringify(cart));
  renderCart();
}
renderCart();

/******************** IMAGE UPLOAD ********************/
async function uploadImage(file){
  const ref = storage.ref("products/"+Date.now());
  await ref.put(file);
  return await ref.getDownloadURL();
}

/******************** ADMIN BUTTONS ********************/
document.getElementById("admin-save").onclick = async ()=>{
  const data = {
    Name: p-name.value,
    Price:+p-price.value,
    Mrp:+p-mrp.value,
    Min:+p-min.value||1,
    Unit:p-unit.value,
    InStock:p-stock.checked
  };

  const file = p-file.files[0];
  if(file) data.Image = await uploadImage(file);

  editId
    ? db.collection("products").doc(editId).update(data)
    : db.collection("products").add(data);

  alert("Saved Successfully");
  editId = null;
};

document.getElementById("admin-add").onclick = ()=>{
  editId = null;
  adminPanel.querySelectorAll("input").forEach(i=>i.value="");
  p-stock.checked = true;
};

document.getElementById("admin-delete").onclick = ()=>{
  if(!editId) return alert("Select product first");
  if(confirm("Delete this product?")){
    db.collection("products").doc(editId).delete();
    editId = null;
  }
};

/******************** CART POPUP ********************/
view-cart-btn.onclick = ()=>{
  cart-popup.classList.add("show");
};
cart-close.onclick = ()=>{
  cart-popup.classList.remove("show");
};
