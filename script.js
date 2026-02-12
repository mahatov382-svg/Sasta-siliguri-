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
const storage = firebase.storage();

let products = [];
let cart = {};
let editId = null;
let tap = 0;

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
    productList.innerHTML+=`
    <div class="product">
      <img src="${p.Image}">
      <h3>${p.Name}</h3>
      <del>₹${p.Mrp||""}</del> <b>₹${p.Price}</b>
      <div class="qty">
        <button onclick="qty('${p.id}',-1)">−</button>
        <span id="q${p.id}">1</span>
        <button onclick="qty('${p.id}',1)">+</button>
      </div>
      <button class="add" onclick="add('${p.id}')">Add to Cart</button>
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

/* CART */
function add(id){
  cart[id]=(cart[id]||0)+Number(document.getElementById("q"+id).innerText);
  updateCart();
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

/* ORDER */
function orderWhatsApp(){
  let n=custName.value,p=custPhone.value,a=custAddress.value;
  if(!n||!p||!a){alert("Fill details");return;}
  let msg="SASTA SILIGURI ORDER\n\n";
  for(let id in cart){
    let pr=products.find(x=>x.id===id);
    msg+=`${pr.Name} × ${cart[id]}\n`;
  }
  location.href=`https://wa.me/${phone}?text=${encodeURIComponent(msg)}`;
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
