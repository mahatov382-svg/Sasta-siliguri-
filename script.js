const phone = "917602884208";
const ADMIN_PASS = "1513";

firebase.initializeApp({
  apiKey: "AIzaSyA4SQeDddwhmSjTA_g9v2yuIYP-A7kR9ZE",
  authDomain: "sasta-siliguri.firebaseapp.com",
  projectId: "sasta-siliguri"
});

const db = firebase.firestore();

let products = [];
let cart = {};
let adminTap = 0;
let editId = null;

/* ADMIN 3 TAP */
logo.onclick = () => {
  adminTap++;
  setTimeout(()=>adminTap=0,600);
  if(adminTap===3){
    const p = prompt("Admin password");
    if(p===ADMIN_PASS) adminPanel.style.display="block";
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
    productList.innerHTML+=`
    <div class="product">
      <img src="${p.Image}">
      <h3>${p.Name}</h3>
      <del>₹${p.Mrp}</del> <b>₹${p.Price}</b>
      <div class="qty">
        <button onclick="q('${p.id}',-1)">−</button>
        <span id="q${p.id}">1</span>
        <button onclick="q('${p.id}',1)">+</button>
      </div>
      <button class="add" onclick="add('${p.id}')">Add to Cart</button>
    </div>`;
  });
}

/* CART */
function add(id){
  cart[id]=(cart[id]||0)+Number(document.getElementById("q"+id).innerText);
  updateCart();
}
function q(id,d){
  let e=document.getElementById("q"+id);
  let v=Number(e.innerText)+d;
  if(v<1)v=1;
  e.innerText=v;
}
function updateCart(){
  cartBar.style.display="flex";
  cartCount.innerText=Object.values(cart).reduce((a,b)=>a+b,0);
}
function openCart(){
  cartModal.style.display="block";
  cartItems.innerHTML="";
  let t=0;
  for(let id in cart){
    let p=products.find(x=>x.id===id);
    let s=cart[id]*p.Price;
    t+=s;
    cartItems.innerHTML+=`${p.Name} × ${cart[id]} = ₹${s}<br>`;
  }
  cartTotal.innerText=t;
}
function closeCart(){cartModal.style.display="none";}
function orderWhatsApp(){
  let msg="SASTA SILIGURI ORDER\n";
  for(let id in cart){
    let p=products.find(x=>x.id===id);
    msg+=`${p.Name} × ${cart[id]}\n`;
  }
  location.href=`https://wa.me/${phone}?text=${encodeURIComponent(msg)}`;
}

/* ADMIN */
function saveProduct(){
  const d={
    Name:pName.value,
    Price:+pPrice.value,
    Mrp:+pMrp.value,
    Image:pImage.value,
    InStock:pStock.checked
  };
  editId
    ? db.collection("products").doc(editId).update(d)
    : db.collection("products").add(d);
}
function newProduct(){editId=null;}
function deleteProduct(){
  if(editId) db.collection("products").doc(editId).delete();
}

document.addEventListener("DOMContentLoaded", () => {
  subscribeProducts();
  updateCartUI();
  setupAdminLogin();
});
