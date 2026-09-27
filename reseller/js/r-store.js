import{RES,ce,svgI,resFmtIDR,resNum}from'./r-core.js';
import{resApi,resToast}from'./r-api.js';
import{persistCart,restoreCart}from'./r-ui.js';
import{FlashSale}from'./r-flashsale.js';
export async function loadCatalog(){
var grid=document.getElementById('resGrid');
try{const rows=await resApi('/api/reseller/catalog');RES.catalog=Array.isArray(rows)?rows:[]}catch(e){if(grid){while(grid.firstChild)grid.removeChild(grid.firstChild);grid.appendChild(ce('div','r-empty','Gagal memuat katalog.'))}updateCartUI();return}
var flash=null;try{flash=await resApi('/api/reseller/flash')}catch(e){}
FlashSale.init(flash||{});
FlashSale.setItems(RES.catalog);
renderFlashSection();
syncCartWithFlash();
if(grid)renderGrid(grid);
updateCartUI()
}
function renderFlashSection(){
var grid=document.getElementById('resGrid');
if(!grid||!grid.parentNode)return;
var old=document.getElementById('rFsMount');
if(old&&old.parentNode)old.parentNode.removeChild(old);
var sec=FlashSale.render();
if(!sec)return;
sec.id='rFsMount';
grid.parentNode.insertBefore(sec,grid)
}
function findVariant(vid){
var s=String(vid);
for(var i=0;i<RES.catalog.length;i++){if(String(RES.catalog[i].id)===s)return RES.catalog[i]}
return null
}
function stockCount(c){return parseInt(c.stock_available,10)||0}
function isOut(c){return stockCount(c)<=0||String(c.status||'').toLowerCase()!=='ready'}
function stockBadge(c){
var st=stockCount(c);
if(isOut(c))return{cls:'out',txt:'Habis'};
if(st<=4)return{cls:'low',txt:'Sisa '+st};
return{cls:'ok',txt:'Ready'}
}
function pruneInvalidCart(){
var changed=false;
for(var i=RES.cart.length-1;i>=0;i--){
var item=RES.cart[i];
if(!item||typeof item!=='object'||item.variant_id===undefined||item.variant_id===null||item.variant_id===''){RES.cart.splice(i,1);changed=true;continue}
var qty=parseInt(item.qty,10);
if(isNaN(qty)||qty<1){RES.cart.splice(i,1);changed=true;continue}
if(qty!==item.qty){item.qty=qty;changed=true}
if(!Array.isArray(item.formData))item.formData=[{}];
if(typeof item.separateForms!=='boolean')item.separateForms=false;
if(typeof item.useFirstItemData!=='boolean')item.useFirstItemData=false
}
if(changed)persistCart()
}
function syncCartWithFlash(){
var changed=false;
for(var i=RES.cart.length-1;i>=0;i--){
var item=RES.cart[i];
if(!item||typeof item!=='object'||item.variant_id===undefined||item.variant_id===null||item.variant_id===''){RES.cart.splice(i,1);changed=true;continue}
var v=findVariant(item.variant_id);
if(!v){RES.cart.splice(i,1);changed=true;continue}
var qty=parseInt(item.qty,10);
if(isNaN(qty)||qty<1){RES.cart.splice(i,1);changed=true;continue}
if(qty!==item.qty){item.qty=qty;changed=true}
if(!Array.isArray(item.formData))item.formData=[{}];
if(typeof item.separateForms!=='boolean')item.separateForms=false;
if(typeof item.useFirstItemData!=='boolean')item.useFirstItemData=false;
var st=stockCount(v);
if(st<=0){RES.cart.splice(i,1);changed=true;continue}
if(qty>st){item.qty=st;changed=true}
var eff=FlashSale.getEffectivePrice(v);
var unit=resNum(eff.price);
if(unit<=0){RES.cart.splice(i,1);changed=true;continue}
if(item.app_name!==v.app_name){item.app_name=v.app_name;changed=true}
if(item.category!==v.category){item.category=v.category;changed=true}
if(item.duration!==v.duration){item.duration=v.duration;changed=true}
if(item.price_str!==eff.price){item.price_str=eff.price;changed=true}
if(item.unit!==unit){item.unit=unit;changed=true}
if(!!item.isFlash!==!!eff.isFlash){item.isFlash=eff.isFlash;changed=true}
if(item.originalPrice!==eff.originalPrice){item.originalPrice=eff.originalPrice;changed=true}
if(!item.form_fields&&v.form_fields){item.form_fields=v.form_fields;changed=true}
if(!Array.isArray(item.formData)||!item.formData.length)item.formData=[{}]
}
if(changed){persistCart();updateCartUI()}
}
export function renderStore(container){
while(container.firstChild)container.removeChild(container.firstChild);
container.appendChild(ce('p','r-section-label','Katalog Wholesale'));
const sw=ce('div','r-search-wrap');
const si=ce('input','r-search-input');
si.id='resSearchInput';
si.type='text';
si.placeholder='Cari aplikasi / paket...';
si.value=RES.search||'';
si.addEventListener('input',function(){
RES.search=this.value.toLowerCase().trim();
const g=document.getElementById('resGrid');
if(g)renderGrid(g)
});
sw.appendChild(si);
const sicon=ce('div','r-search-icon');
sicon.appendChild(svgI('M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z','1rem','1rem'));
sw.appendChild(sicon);
container.appendChild(sw);
const bar=ce('div','r-cat-bar');
bar.id='resCatBar';
container.appendChild(bar);
refreshFilterBar();
const grid=ce('div','r-grid');
grid.id='resGrid';
grid.appendChild(ce('div','r-loading','Memuat katalog...'));
container.appendChild(grid);
createCartBar();
loadCatalog()
}
function refreshFilterBar(){
const bar=document.getElementById('resCatBar');
if(!bar)return;
while(bar.firstChild)bar.removeChild(bar.firstChild);
const allBtn=ce('button','r-cat-btn'+(RES.appFilter==='all'?' active':''),'SEMUA');
allBtn.type='button';
allBtn.addEventListener('click',function(){
RES.appFilter='all';
refreshFilterBar();
const g=document.getElementById('resGrid');
if(g)renderGrid(g)
});
bar.appendChild(allBtn);
appList().forEach(function(a){
const btn=ce('button','r-cat-btn'+(RES.appFilter===a?' active':''),a);
btn.type='button';
btn.addEventListener('click',function(){
RES.appFilter=a;
refreshFilterBar();
const g=document.getElementById('resGrid');
if(g)renderGrid(g)
});
bar.appendChild(btn)
})
}
function renderGrid(grid){
while(grid.firstChild)grid.removeChild(grid.firstChild);
const rows=filteredCatalog();
if(!rows.length){
grid.appendChild(ce('div','r-empty','Tidak ada produk cocok.'));
return
}
rows.forEach(function(c){
if(!c||c.id===undefined||c.id===null||!c.app_name)return;
const out=isOut(c);
const eff=FlashSale.getEffectivePrice(c);
const showFlash=eff.isFlash&&!out;
const card=ce('div','r-card'+(out?' out':''));
const top=ce('div','r-card-top');
const logo=ce('div','r-logo-ph',String(c.app_name).charAt(0).toUpperCase());
top.appendChild(logo);
const b=stockBadge(c);
top.appendChild(ce('span','r-badge '+b.cls,b.txt));
card.appendChild(top);
card.appendChild(ce('p','r-name',c.app_name));
card.appendChild(ce('p','r-pkg',c.category+' • '+c.duration));
const pr=ce('div','r-price-row');
if(showFlash){
pr.appendChild(ce('span','r-price-old',c.price));
pr.appendChild(ce('span','r-price flash',eff.price))
}else{
pr.appendChild(ce('span','r-price',c.price))
}
card.appendChild(pr);
const foot=ce('div','r-foot');
foot.appendChild(ce('span','r-count',stockCount(c)+' stok'));
const add=ce('button','r-add',out?'Habis':'+ Keranjang');
add.type='button';
if(out)add.disabled=true;
add.addEventListener('click',function(e){
e.stopPropagation();
addVariantToCart(c)
});
foot.appendChild(add);
card.appendChild(foot);
grid.appendChild(card)
})
}
function appList(){
const seen={},out=[];
RES.catalog.forEach(function(c){
const name=String(c.app_name||'').trim();
if(!name)return;
if(!seen[name]){seen[name]=true;out.push(name)}
});
return out
}
function filteredCatalog(){
return RES.catalog.filter(function(c){
if(!c||!c.app_name)return false;
const okApp=(RES.appFilter==='all'||c.app_name===RES.appFilter);
const q=RES.search;
const okSearch=!q||String(c.app_name).toLowerCase().indexOf(q)>=0||String(c.category).toLowerCase().indexOf(q)>=0||String(c.duration).toLowerCase().indexOf(q)>=0;
return okApp&&okSearch
})
}
function addVariantToCart(c){
if(!c||isOut(c)){resToast('Stok habis.');return}
const st=stockCount(c);
if(st<=0){resToast('Stok habis.');return}
const eff=FlashSale.getEffectivePrice(c);
const unit=resNum(eff.price);
if(unit<=0){resToast('Harga tidak valid.');return}
let found=null;
for(let i=0;i<RES.cart.length;i++){
if(String(RES.cart[i].variant_id)===String(c.id)){found=RES.cart[i];break}
}
if(found){
const q=parseInt(found.qty,10)||0;
if(q>=st){resToast('Melebihi stok tersedia.');return}
found.qty=q+1;
found.price_str=eff.price;
found.unit=unit;
found.isFlash=eff.isFlash;
found.originalPrice=eff.originalPrice;
found.app_name=c.app_name;
found.category=c.category;
found.duration=c.duration;
if(c.form_fields)found.form_fields=c.form_fields
}else{
RES.cart.push({
variant_id:c.id,
app_name:c.app_name,
category:c.category,
duration:c.duration,
price_str:eff.price,
unit:unit,
qty:1,
isFlash:eff.isFlash,
originalPrice:eff.originalPrice,
form_fields:c.form_fields||'',
separateForms:false,
useFirstItemData:false,
formData:[{}]
})
}
persistCart();
updateCartUI();
resToast('Ditambahkan ke keranjang.')
}
function addFlashToCart(vid){const c=findVariant(vid);if(c)addVariantToCart(c)}
function onFlashExpire(){
syncCartWithFlash();
var grid=document.getElementById('resGrid');
if(grid)renderGrid(grid);
document.dispatchEvent(new CustomEvent('res:flash-expired'))
}
function changeCartQty(idx,delta){
const item=RES.cart[idx];
if(!item)return;
const qty=parseInt(item.qty,10)||0;
const newQty=qty+delta;
if(newQty<1){RES.cart.splice(idx,1)}
else{
if(delta>0){
const v=findVariant(item.variant_id);
const st=v?stockCount(v):0;
if(newQty>st){resToast('Melebihi stok tersedia.');return}
}
item.qty=newQty
}
persistCart();
updateCartUI()
}
export function updateCartUI(){
const bar=document.getElementById('resCartBar');
if(!bar)return;
let count=0,total=0;
for(let i=0;i<RES.cart.length;i++){
const it=RES.cart[i];
if(!it)continue;
const q=parseInt(it.qty,10)||0;
const u=parseFloat(it.unit)||0;
count+=q;
total+=u*q
}
const badge=bar.querySelector('.r-cart-badge');
const totalEl=bar.querySelector('.r-cart-total');
if(badge)badge.textContent=count;
if(totalEl)totalEl.textContent=resFmtIDR(total);
if(count>0)bar.classList.add('visible');
else bar.classList.remove('visible');
renderCartList()
}
function renderCartList(){
const list=document.getElementById('resCartList');
if(!list)return;
while(list.firstChild)list.removeChild(list.firstChild);
RES.cart.forEach(function(item,idx){
if(!item||!item.app_name||item.variant_id===undefined||item.variant_id===null)return;
const row=ce('div','r-cartitem');
const left=ce('div','r-ci-left');
const logo=ce('div','r-ci-logo');
logo.appendChild(ce('span',null,String(item.app_name).charAt(0).toUpperCase()));
left.appendChild(logo);
const info=ce('div');
info.appendChild(ce('p','r-ci-name',item.app_name));
const pkgP=ce('p','r-ci-pkg',item.category+' • '+item.duration);
if(item.isFlash)pkgP.appendChild(ce('span','r-ci-flash',' ⚡'));
info.appendChild(pkgP);
left.appendChild(info);
const right=ce('div','r-ci-right');
right.appendChild(ce('span','r-ci-price',resFmtIDR((parseFloat(item.unit)||0)*(parseInt(item.qty,10)||0))));
const qty=ce('div','r-qty');
const minus=ce('button','r-qty-btn minus','-');
minus.type='button';
minus.addEventListener('click',function(){changeCartQty(idx,-1)});
const val=ce('span','r-qty-val',String(parseInt(item.qty,10)||0));
const plus=ce('button','r-qty-btn plus','+');
plus.type='button';
plus.addEventListener('click',function(){changeCartQty(idx,1)});
qty.appendChild(minus);qty.appendChild(val);qty.appendChild(plus);
right.appendChild(qty);
row.appendChild(left);row.appendChild(right);
list.appendChild(row)
})
}
function createCartBar(){
if(document.getElementById('resCartBar'))return;
const bar=ce('div','r-cartbar');
bar.id='resCartBar';
const inner=ce('div','r-cart-inner');
const head=ce('div','r-cart-head');
const left=ce('div','r-cart-left');
const icon=ce('div','r-cart-icon');
icon.appendChild(svgI('M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z','1rem','1rem'));
icon.appendChild(ce('span','r-cart-badge','0'));
left.appendChild(icon);
const info=ce('div');
info.appendChild(ce('p','r-cart-label','Total Belanja'));
info.appendChild(ce('p','r-cart-total','Rp 0'));
left.appendChild(info);
const right=ce('div','r-cart-right');
const co=ce('button','r-cart-checkout');
co.type='button';
co.appendChild(ce('span',null,'Checkout'));
co.appendChild(svgI('M14 5l7 7m0 0l-7 7m7-7H3','.75rem','.75rem'));
co.addEventListener('click',function(){document.dispatchEvent(new CustomEvent('res:open-checkout'))});
right.appendChild(co);
const tog=ce('div','r-cart-toggle');
tog.appendChild(svgI('M5 15l7-7 7 7','.875rem','.875rem'));
tog.addEventListener('click',function(e){
e.stopPropagation();
const list=document.getElementById('resCartList');
if(!list)return;
const open=list.classList.toggle('open');
while(tog.firstChild)tog.removeChild(tog.firstChild);
tog.appendChild(svgI(open?'M19 9l-7 7-7-7':'M5 15l7-7 7 7','.875rem','.875rem'))
});
right.appendChild(tog);
head.appendChild(left);head.appendChild(right);
const list=ce('div','r-cartlist');
list.id='resCartList';
inner.appendChild(head);inner.appendChild(list);
bar.appendChild(inner);
document.body.appendChild(bar)
}
export function clearCart(){
RES.cart=[];
persistCart();
updateCartUI()
}
export function initStore(){
restoreCart();
pruneInvalidCart();
FlashSale.onAdd=addFlashToCart;
FlashSale.onExpire=onFlashExpire;
var baseUpdate=FlashSale.update;
FlashSale.update=function(){
var prev=FlashSale.wasUpcoming;
baseUpdate.call(FlashSale);
if(prev&&!FlashSale.wasUpcoming){
syncCartWithFlash();
var grid=document.getElementById('resGrid');
if(grid)renderGrid(grid)
}
};
document.addEventListener('res:logged-in',function(){
const container=document.getElementById('resStoreView');
if(container)renderStore(container)
})
}
