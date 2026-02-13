function orderFullCart() {
  let msg = "🛒 Order Details:\n\n";
  let total = 0;

  document.querySelectorAll(".cart-item").forEach(item => {
    let name = item.dataset.name;
    let price = parseInt(item.dataset.price);
    let qty = parseInt(item.dataset.qty);

    msg += `${name} (${qty}) = ₹${price * qty}\n`;
    total += price * qty;
  });

  msg += `\nTotal = ₹${total}`;
  let phone = "917602884208"; // apna number

  window.open(
    `https://wa.me/${phone}?text=${encodeURIComponent(msg)}`,
    "_blank"
  );
}

const phone = "917602884208";
const ADMIN_PASS = "1513";

/* FIREBASE CONFIG */
firebase.initializeApp({
  apiKey: "AIzaSyA4SQeDddwhmSjTA_g9v2yuIYP-A7kR9ZE",
  authDomain: "sasta-siliguri.firebaseapp.com",
  projectId: "sasta-siliguri",
  storageBucket: "sasta-siliguri.appspot.com"
});

const db = firebase.firestore();
const storage = firebase.storage;

let products = [];
let cart = JSON.parse(localStorage.getItem("sasta_cart")) || [];
let editId = null;
let tap = 0;

const logo = document.querySelector(".logo");
const adminPanel = document.getElementById("admin-panel");
const productList = document.getElementById("product-list");

/* ADMIN 3 TAP */
logo.onclick = () => {
  tap++;
  setTimeout(()=>tap=0,600);
  if(tap===3){
    const p = prompt("Admin password");
    if(p===ADMIN_PASS){
      adminPanel.style.display="block";
      adminPanel.scrollIntoView({behavior:"smooth"});
    }
  }
};

/* LOAD PRODUCTS */
db.collection("products").onSnapshot(s=>{
  products = s.docs.map(d=>({id:d.id,...d.data()}));
  render(products);
});

/* RENDER */
function render(list){
  productList.innerHTML="";
  list.forEach(p=>{
    const name  = p.Name  || p.name  || "Item";
const price = p.Price || p.price || 0;
const mrp   = p.Mrp   || p.mrp   || "";
const img   = p.Image || p.image || "https://via.placeholder.com/300";

productList.innerHTML += `
<div class="product">
  <img src="${img}">
  <h3>${name}</h3>
  <del>₹${mrp}</del> <b>₹${price}</b>

  <div class="qty">
    <button onclick="qty('${p.id}',-1)">−</button>
    <span id="q${p.id}">1</span>
    <button onclick="qty('${p.id}',1)">+</button>
  </div>

  <button class="add" onclick="addToCart('${p.id}')">
    Add to Cart
  </button>
</div>`;
  });
}

/* QTY */
function qty(id,d){
  let e=document.getElementById("q"+id);
  let v=Number(e.innerText)+d;
  if(v<1)v=1;
  e.innerText=v;
}
/* ========== CART FUNCTIONS ========== */

function addToCart(id){
  const p = products.find(x => x.id === id);
  if(!p || !p.InStock) return;

  const q = document.getElementById("q"+id);
  let qty = Number(q?.innerText || p.Min || 1);

  const found = cart.find(i => i.id === id);
  if(found){
    found.qty += qty;
  }else{
    cart.push({
      id: p.id,
      name: p.Name,
      price: p.Price,
      unit: p.Unit || "",
      qty: qty
    });
  }

  localStorage.setItem("sasta_cart", JSON.stringify(cart));
  renderCart();
}

function renderCart(){
  const box = document.getElementById("cart-items");
  const totalBox = document.getElementById("cart-total");
  if(!box || !totalBox) return;

  box.innerHTML = "";
  let total = 0;

  cart.forEach(i=>{
    total += i.price * i.qty;
    box.innerHTML += `
      <div>
        ${i.name} (${i.qty} ${i.unit}) = ₹${i.price*i.qty}
        <button onclick="removeFromCart('${i.id}')">❌</button>
      </div>
    `;
  });

  totalBox.innerText = "Total: ₹"+total;
}

function removeFromCart(id){
  cart = cart.filter(i=>i.id!==id);
  localStorage.setItem("sasta_cart", JSON.stringify(cart));
  renderCart();
}


/* IMAGE UPLOAD */
async function uploadImage(file){
  const ref=storage.ref("products/"+Date.now());
  await ref.put(file);
  return await ref.getDownloadURL();
}

/* ADMIN SAVE */
async function saveProduct(){
  let img="";
  if(pFile.files[0]) img=await uploadImage(pFile.files[0]);
  const d={
    Name:pName.value,
    Price:+pPrice.value,
    Mrp:+pMrp.value,
    Min:+pMin.value||1,
    Unit:pUnit.value,
    Image:img,
    InStock:pStock.checked
  };
  editId
    ? db.collection("products").doc(editId).update(d)
    : db.collection("products").add(d);
}
function resetForm(){editId=null;}
function deleteProduct(){
  if(editId) db.collection("products").doc(editId).delete();
}

renderCart();
document.getElementById("order-btn")?.addEventListener("click", orderFullCart);
