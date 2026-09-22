var RES_CATALOG=[],RES_CART=[],RES_APP_FILTER='all',RES_SEARCH='';
function resApps(){var seen={},out=[];RES_CATALOG.forEach(function(c){if(!seen[c.app_name]){seen[c.app_name]=true;out.push(c.app_name)}});return out}
function resFiltered(){
return RES_CATALOG.filter(function(c){
var okApp=(RES_APP_FILTER==='all'||c.app_name===RES_APP_FILTER);
var okSearch=!RES_SEARCH||c.app_name.toLowerCase().includes(RES_SEARCH)||c.category.toLowerCase().includes(RES_SEARCH)||c.duration.toLowerCase().includes(RES_SEARCH);
return okApp&&okSearch;
});
}
function resIsOut(c){return c.stock_available<=0||String(c.status).toLowerCase()!=='ready'}
function stockBadge(c){
if(resIsOut(c))return{cls:'out',txt:'Habis'};
if(c.stock_available<=4)return{cls:'low',txt:'Sisa '+c.stock_available};
return{cls:'ok',txt:'Ready'};
}
function resCartCount(){var c=0;RES_CART.forEach(function(i){c+=i.qty});return c}
function resCartTotal(){var t=0;RES_CART.forEach(function(i){t+=i.unit*i.qty});return t}
function updateResCartUI(){
var bar=document.getElementById('resCartBar');
if(!bar)return;
var cnt=resCartCount();
var badge=bar.querySelector('.r-cart-badge');
var total=bar.querySelector('.r-cart-total');
if(badge)badge.textContent=cnt;
if(total)total.textContent=resFmt(resCartTotal());
if(cnt>0)bar.classList.add('visible');else bar.classList.remove('visible');
renderResCartList();
}
function renderResCartList(){
var list=document.getElementById('resCartList');
if(!list)return;
while(list.firstChild)list.removeChild(list.firstChild);
RES_CART.forEach(function(item,idx){
var row=ce('div','r-cartitem');
var left=ce('div','r-ci-left');
var logo=ce('div','r-ci-logo');
logo.appendChild(ce('span',null,item.app_name.charAt(0).toUpperCase()));
left.appendChild(logo);
var info=ce('div');
info.appendChild(ce('p','r-ci-name',item.app_name));
info.appendChild(ce('p','r-ci-pkg',item.category+' • '+item.duration));
left.appendChild(info);
var right=ce('div','r-ci-right');
right.appendChild(ce('span','r-ci-price',resFmt(item.unit*item.qty)));
var qty=ce('div','r-qty');
var minus=ce('button','r-qty-btn minus','-');
minus.setAttribute('type','button');
minus.addEventListener('click',function(){resCartQty(idx,-1)});
var val=ce('span','r-qty-val',String(item.qty));
var plus=ce('button','r-qty-btn plus','+');
plus.setAttribute('type','button');
plus.addEventListener('click',function(){resCartQty(idx,1)});
qty.appendChild(minus);qty.appendChild(val);qty.appendChild(plus);
right.appendChild(qty);
row.appendChild(left);row.appendChild(right);
list.appendChild(row);
});
}
function resCartQty(idx,delta){
var item=RES_CART[idx];
if(!item)return;
item.qty+=delta;
if(item.qty<1)RES_CART.splice(idx,1);
updateResCartUI();
}
function resAddToCart(c){
if(resIsOut(c))return resToast('Stok habis.');
var found=null;
for(var i=0;i<RES_CART.length;i++){if(RES_CART[i].variant_id===c.id){found=RES_CART[i];break}}
if(found){if(found.qty>=c.stock_available)return resToast('Melebihi stok tersedia.');found.qty++}
else RES_CART.push({variant_id:c.id,app_name:c.app_name,category:c.category,duration:c.duration,price_str:c.price,unit:resNum(c.price),qty:1});
updateResCartUI();
resToast('Ditambahkan ke keranjang.');
}
function createResCartBar(){
if(document.getElementById('resCartBar'))return;
var bar=ce('div','r-cartbar');bar.id='resCartBar';
var inner=ce('div','r-cart-inner');
var head=ce('div','r-cart-head');
var left=ce('div','r-cart-left');
var icon=ce('div','r-cart-icon');
icon.appendChild(svgI('M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z','1rem','1rem'));
icon.appendChild(ce('span','r-cart-badge','0'));
left.appendChild(icon);
var info=ce('div');
info.appendChild(ce('p','r-cart-label','Total Belanja'));
info.appendChild(ce('p','r-cart-total','0'));
left.appendChild(info);
var right=ce('div','r-cart-right');
var co=ce('button','r-cart-checkout');
co.setAttribute('type','button');
co.appendChild(ce('span',null,'Checkout'));
co.appendChild(svgI('M14 5l7 7m0 0l-7 7m7-7H3','.75rem','.75rem'));
co.addEventListener('click',function(){if(typeof resOpenCheckout==='function')resOpenCheckout()});
right.appendChild(co);
var tog=ce('div','r-cart-toggle');
tog.appendChild(svgI('M5 15l7-7 7 7','.875rem','.875rem'));
tog.addEventListener('click',function(e){
e.stopPropagation();
var list=document.getElementById('resCartList');
if(!list)return;
var open=list.classList.toggle('open');
while(tog.firstChild)tog.removeChild(tog.firstChild);
tog.appendChild(svgI(open?'M19 9l-7 7-7-7':'M5 15l7-7 7 7','.875rem','.875rem'));
});
right.appendChild(tog);
head.appendChild(left);head.appendChild(right);
var list=ce('div','r-cartlist');list.id='resCartList';
inner.appendChild(head);inner.appendChild(list);
bar.appendChild(inner);
document.body.appendChild(bar);
}
function renderResGrid(grid){
while(grid.firstChild)grid.removeChild(grid.firstChild);
var rows=resFiltered();
if(!rows.length){grid.appendChild(ce('div','r-empty','Tidak ada produk cocok.'));return}
rows.forEach(function(c){
var out=resIsOut(c);
var card=ce('div','r-card'+(out?' out':''));
var top=ce('div','r-card-top');
var logo=ce('div','r-logo-ph',c.app_name.charAt(0).toUpperCase());
top.appendChild(logo);
var b=stockBadge(c);
top.appendChild(ce('span','r-badge '+b.cls,b.txt));
card.appendChild(top);
card.appendChild(ce('p','r-name',c.app_name));
card.appendChild(ce('p','r-pkg',c.category+' • '+c.duration));
var pr=ce('div','r-price-row');
pr.appendChild(ce('span','r-price',c.price));
card.appendChild(pr);
var foot=ce('div','r-foot');
foot.appendChild(ce('span','r-count',c.stock_available+' stok'));
var add=ce('button','r-add',out?'Habis':'+ Keranjang');
add.setAttribute('type','button');
if(out)add.disabled=true;
add.addEventListener('click',function(e){e.stopPropagation();resAddToCart(c)});
foot.appendChild(add);
card.appendChild(foot);
grid.appendChild(card);
});
}
function resRenderStore(container){
createResCartBar();
var label=ce('p','r-section-label','Katalog Wholesale');
container.appendChild(label);
var sw=ce('div','r-search-wrap');
var si=ce('input','r-search-input');
si.setAttribute('type','text');
si.setAttribute('placeholder','Cari aplikasi / paket...');
si.value=RES_SEARCH;
si.addEventListener('input',function(){RES_SEARCH=this.value.toLowerCase().trim();var g=document.getElementById('resGrid');if(g)renderResGrid(g)});
sw.appendChild(si);
var sicon=ce('div','r-search-icon');
sicon.appendChild(svgI('M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z','1rem','1rem'));
sw.appendChild(sicon);
container.appendChild(sw);
var bar=ce('div','r-cat-bar');
var allBtn=ce('button','r-cat-btn'+(RES_APP_FILTER==='all'?' active':''),'SEMUA');
allBtn.setAttribute('type','button');
allBtn.addEventListener('click',function(){RES_APP_FILTER='all';resRenderStore(container)});
bar.appendChild(allBtn);
resApps().forEach(function(a){
var btn=ce('button','r-cat-btn'+(RES_APP_FILTER===a?' active':''),a);
btn.setAttribute('type','button');
btn.addEventListener('click',function(){RES_APP_FILTER=a;resRenderStore(container)});
bar.appendChild(btn);
});
container.appendChild(bar);
var grid=ce('div','r-grid');grid.id='resGrid';
grid.appendChild(ce('div','r-loading','Memuat katalog...'));
container.appendChild(grid);
resApi('/api/reseller/catalog').then(function(rows){
RES_CATALOG=rows||[];
renderResGrid(grid);
updateResCartUI();
}).catch(function(){
while(grid.firstChild)grid.removeChild(grid.firstChild);
grid.appendChild(ce('div','r-empty','Gagal memuat katalog.'));
});
}
