import{RES,ce,svgI,resFmtIDR,resNum,resApi,resToast,persistCart,restoreCart,cartCount,cartTotal}from'./r-core.js';
export async function loadCatalog(){
try{
const rows=await resApi('/api/reseller/catalog');
RES.catalog=rows||[];
const grid=document.getElementById('resGrid');
if(grid)renderGrid(grid);
updateCartUI();
}catch(e){
const grid=document.getElementById('resGrid');
if(grid){
while(grid.firstChild)grid.removeChild(grid.firstChild);
grid.appendChild(ce('div','r-empty','Gagal memuat katalog.'));
}
}
}
export function renderStore(container){
while(container.firstChild)container.removeChild(container.firstChild);
container.appendChild(ce('p','r-section-label','Katalog Wholesale'));
const sw=ce('div','r-search-wrap');
const si=ce('input','r-search-input');
si.id='resSearchInput';
si.type='text';
si.placeholder='Cari aplikasi / paket...';
si.value=RES.search;
si.addEventListener('input',function(){
RES.search=this.value.toLowerCase().trim();
const g=document.getElementById('resGrid');
if(g)renderGrid(g);
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
loadCatalog();
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
if(g)renderGrid(g);
});
bar.appendChild(allBtn);
appList().forEach(function(a){
const btn=ce('button','r-cat-btn'+(RES.appFilter===a?' active':''),a);
btn.type='button';
btn.addEventListener('click',function(){
RES.appFilter=a;
refreshFilterBar();
const g=document.getElementById('resGrid');
if(g)renderGrid(g);
});
bar.appendChild(btn);
});
}
function renderGrid(grid){
while(grid.firstChild)grid.removeChild(grid.firstChild);
const rows=filteredCatalog();
if(!rows.length){
grid.appendChild(ce('div','r-empty','Tidak ada produk cocok.'));
return;
}
rows.forEach(function(c){
const out=isOut(c);
const card=ce('div','r-card'+(out?' out':''));
const top=ce('div','r-card-top');
const logo=ce('div','r-logo-ph',c.app_name.charAt(0).toUpperCase());
top.appendChild(logo);
const b=stockBadge(c);
top.appendChild(ce('span','r-badge '+b.cls,b.txt));
card.appendChild(top);
card.appendChild(ce('p','r-name',c.app_name));
card.appendChild(ce('p','r-pkg',c.category+' • '+c.duration));
const pr=ce('div','r-price-row');
pr.appendChild(ce('span','r-price',c.price));
card.appendChild(pr);
const foot=ce('div','r-foot');
foot.appendChild(ce('span','r-count',c.stock_available+' stok'));
const add=ce('button','r-add',out?'Habis':'+ Keranjang');
add.type='button';
if(out)add.disabled=true;
add.addEventListener('click',function(e){
e.stopPropagation();
addVariantToCart(c);
});
foot.appendChild(add);
card.appendChild(foot);
grid.appendChild(card);
});
}
function appList(){
const seen={},out=[];
RES.catalog.forEach(function(c){
if(!seen[c.app_name]){seen[c.app_name]=true;out.push(c.app_name);}
});
return out;
}
function filteredCatalog(){
return RES.catalog.filter(function(c){
const okApp=(RES.appFilter==='all'||c.app_name===RES.appFilter);
const q=RES.search;
const okSearch=!q||c.app_name.toLowerCase().indexOf(q)>=0||c.category.toLowerCase().indexOf(q)>=0||c.duration.toLowerCase().indexOf(q)>=0;
return okApp&&okSearch;
});
}
function isOut(c){
return c.stock_available<=0||String(c.status).toLowerCase()!=='ready';
}
function stockBadge(c){
if(isOut(c))return{cls:'out',txt:'Habis'};
if(c.stock_available<=4)return{cls:'low',txt:'Sisa '+c.stock_available};
return{cls:'ok',txt:'Ready'};
}
function addVariantToCart(c){
if(isOut(c)){resToast('Stok habis.');return;}
let found=null;
for(let i=0;i<RES.cart.length;i++){
if(RES.cart[i].variant_id===c.id){found=RES.cart[i];break;}
}
if(found){
if(found.qty>=c.stock_available){resToast('Melebihi stok tersedia.');return;}
found.qty++;
}else{
RES.cart.push({
variant_id:c.id,
app_name:c.app_name,
category:c.category,
duration:c.duration,
price_str:c.price,
unit:resNum(c.price),
qty:1
});
}
persistCart();
updateCartUI();
resToast('Ditambahkan ke keranjang.');
}
function changeCartQty(idx,delta){
const item=RES.cart[idx];
if(!item)return;
item.qty+=delta;
if(item.qty<1)RES.cart.splice(idx,1);
persistCart();
updateCartUI();
}
export function updateCartUI(){
const bar=document.getElementById('resCartBar');
if(!bar)return;
const cnt=cartCount();
const badge=bar.querySelector('.r-cart-badge');
const total=bar.querySelector('.r-cart-total');
if(badge)badge.textContent=cnt;
if(total)total.textContent=resFmtIDR(cartTotal());
if(cnt>0)bar.classList.add('visible');
else bar.classList.remove('visible');
renderCartList();
}
function renderCartList(){
const list=document.getElementById('resCartList');
if(!list)return;
while(list.firstChild)list.removeChild(list.firstChild);
RES.cart.forEach(function(item,idx){
const row=ce('div','r-cartitem');
const left=ce('div','r-ci-left');
const logo=ce('div','r-ci-logo');
logo.appendChild(ce('span',null,item.app_name.charAt(0).toUpperCase()));
left.appendChild(logo);
const info=ce('div');
info.appendChild(ce('p','r-ci-name',item.app_name));
info.appendChild(ce('p','r-ci-pkg',item.category+' • '+item.duration));
left.appendChild(info);
const right=ce('div','r-ci-right');
right.appendChild(ce('span','r-ci-price',resFmtIDR(item.unit*item.qty)));
const qty=ce('div','r-qty');
const minus=ce('button','r-qty-btn minus','-');
minus.type='button';
minus.addEventListener('click',function(){changeCartQty(idx,-1);});
const val=ce('span','r-qty-val',String(item.qty));
const plus=ce('button','r-qty-btn plus','+');
plus.type='button';
plus.addEventListener('click',function(){changeCartQty(idx,1);});
qty.appendChild(minus);qty.appendChild(val);qty.appendChild(plus);
right.appendChild(qty);
row.appendChild(left);row.appendChild(right);
list.appendChild(row);
});
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
co.addEventListener('click',function(){
document.dispatchEvent(new CustomEvent('res:open-checkout'));
});
right.appendChild(co);
const tog=ce('div','r-cart-toggle');
tog.appendChild(svgI('M5 15l7-7 7 7','.875rem','.875rem'));
tog.addEventListener('click',function(e){
e.stopPropagation();
const list=document.getElementById('resCartList');
if(!list)return;
const open=list.classList.toggle('open');
while(tog.firstChild)tog.removeChild(tog.firstChild);
tog.appendChild(svgI(open?'M19 9l-7 7-7-7':'M5 15l7-7 7 7','.875rem','.875rem'));
});
right.appendChild(tog);
head.appendChild(left);head.appendChild(right);
const list=ce('div','r-cartlist');
list.id='resCartList';
inner.appendChild(head);inner.appendChild(list);
bar.appendChild(inner);
document.body.appendChild(bar);
}
export function clearCart(){
RES.cart=[];
persistCart();
updateCartUI();
}
export function initStore(){
restoreCart();
document.addEventListener('res:logged-in',function(){
const container=document.getElementById('resStoreView');
if(container)renderStore(container);
});
}
