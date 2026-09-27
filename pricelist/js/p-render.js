import{ce,svgI,ICON,extractNumK}from'./p-core.js';
import{S,getAppCategory,getLogoUrl,GRID_LABELS}from'./p-state.js';
import{FlashSale}from'./p-flashsale.js';
import{addToCart}from'./p-cart.js';
import{modalShell,guardClosed}from'./p-modals.js';
import{showWelcome,openInfoNetflixModal}from'./p-welcome.js';
var orderModal=null,currentOrderApp='',searchTimeout=null;
const CATS=[['all','SEMUA'],['streaming','STREAMING'],['music','MUSIC'],['editing','EDITING'],['study','STUDY'],['game','GAME']];
export function showPricelist(){
FlashSale.stop();
var container=document.getElementById('app');
if(!container)return;
renderPricelistView(container);
}
export function renderPricelistView(container){
while(container.firstChild)container.removeChild(container.firstChild);
var toolbar=ce('div','toolbar');
var headerBar=ce('div','header-bar');
var backBtn=ce('button','btn-back');backBtn.setAttribute('type','button');
backBtn.appendChild(svgI(ICON.back,'.875rem','.875rem'));
backBtn.appendChild(ce('span',null,'Kembali'));
backBtn.addEventListener('click',function(){showWelcome()});
headerBar.appendChild(backBtn);
var searchWrap=ce('div','search-wrap');
var searchInput=ce('input','search-input');
searchInput.setAttribute('type','text');
searchInput.setAttribute('placeholder','Cari aplikasi...');
searchInput.id='searchInput';
searchInput.addEventListener('input',function(){clearTimeout(searchTimeout);searchTimeout=setTimeout(applyFilters,300)});
searchWrap.appendChild(searchInput);
var searchIcon=ce('div','search-icon');searchIcon.appendChild(svgI(ICON.search,'1rem','1rem'));
searchWrap.appendChild(searchIcon);
headerBar.appendChild(searchWrap);
toolbar.appendChild(headerBar);
var catBar=ce('div','cat-bar');
CATS.forEach(function(c){
var btn=ce('button','cat-btn'+(c[0]===S.category?' active':''),c[1]);
btn.setAttribute('type','button');
btn.setAttribute('data-cat',c[0]);
btn.addEventListener('click',function(){switchCategory(c[0])});
catBar.appendChild(btn);
});
toolbar.appendChild(catBar);
container.appendChild(toolbar);
var fsEl=FlashSale.render();
if(fsEl)container.appendChild(fsEl);
var statusMsg=ce('div','loading');statusMsg.id='statusMessage';
statusMsg.appendChild(ce('div','loader'));
statusMsg.appendChild(ce('p',null,'Menyiapkan etalase...'));
container.appendChild(statusMsg);
var gridLabel=ce('p','section-label',GRID_LABELS[S.category]||'Semua Aplikasi');gridLabel.id='gridLabel';
container.appendChild(gridLabel);
var grid=ce('div','product-grid');grid.id='pricingGrid';
var noRes=ce('div','no-results');noRes.id='noResults';noRes.classList.add('hidden');
var noResBox=ce('div','no-results-box');noResBox.appendChild(ce('p',null,'Aplikasi tidak ditemukan 🥺'));
noRes.appendChild(noResBox);
grid.appendChild(noRes);
container.appendChild(grid);
applyFilters();
var sm=document.getElementById('statusMessage');
if(sm)sm.classList.add('hidden');
}
export function switchCategory(cat){
S.category=cat;
var btns=document.querySelectorAll('.cat-btn');
btns.forEach(function(b){if(b.getAttribute('data-cat')===cat)b.classList.add('active');else b.classList.remove('active')});
var lbl=document.getElementById('gridLabel');
if(lbl)lbl.textContent=GRID_LABELS[cat]||'Semua Aplikasi';
applyFilters();
}
export function applyFilters(){
var searchEl=document.getElementById('searchInput');
var term=searchEl?searchEl.value.toLowerCase().trim():'';
var filtered={},filteredOrder=[],hasVisible=false;
S.appOrder.forEach(function(name){
var info=S.apps[name];
if(!info)return;
var matchSearch=name.toLowerCase().includes(term);
var matchCat=(S.category==='all'||getAppCategory(name)===S.category);
if(matchSearch&&matchCat&&info.packages.length>0){filtered[name]=info;filteredOrder.push(name);hasVisible=true}
});
renderCards(filtered,filteredOrder);
var noRes=document.getElementById('noResults');
if(noRes){if(hasVisible)noRes.classList.add('hidden');else noRes.classList.remove('hidden')}
}
export function renderCurrentGrid(){applyFilters()}
function renderCards(apps,orderedNames){
var grid=document.getElementById('pricingGrid');
if(!grid)return;
var noRes=document.getElementById('noResults');
while(grid.firstChild)grid.removeChild(grid.firstChild);
if(noRes)grid.appendChild(noRes);
orderedNames.forEach(function(name){
var info=apps[name],totalPkgs=info.packages.length;
var minPrice=Infinity,displayPrice='-',hasFlash=false,origPrice='';
info.packages.forEach(function(item){
var eff=FlashSale.getEffectivePrice(item);
var pVal=extractNumK(eff.price);
if(pVal>0&&pVal<minPrice){minPrice=pVal;displayPrice=eff.price;hasFlash=eff.isFlash;origPrice=eff.isFlash?eff.originalPrice:''}
});
var card=ce('div','product-card fade-in-down');
card.addEventListener('click',function(){openOrderModal(name)});
if(name.toLowerCase().includes('netflix')){
var infoBtn=ce('button','info-btn');infoBtn.setAttribute('type','button');
infoBtn.appendChild(ce('span',null,'i'));
infoBtn.addEventListener('click',function(e){e.stopPropagation();openInfoNetflixModal()});
card.appendChild(infoBtn);
}
var top=ce('div','product-card-top');
var logoUrl=getLogoUrl(name);
if(logoUrl){var img=ce('img','product-logo');img.setAttribute('src',logoUrl);img.setAttribute('alt',name);img.setAttribute('loading','lazy');top.appendChild(img)}
else{var ph=ce('div','product-logo-placeholder');ph.appendChild(svgI(ICON.tv,'1rem','1rem'));top.appendChild(ph)}
var badges=ce('div','product-badges');
if(hasFlash)badges.appendChild(ce('span','badge badge-flash','⚡'));
badges.appendChild(ce('span','badge badge-cat',getAppCategory(name)));
top.appendChild(badges);
card.appendChild(top);
var mid=ce('div');
mid.appendChild(ce('h2','product-name',name));
var prices=ce('div','product-prices');
prices.appendChild(ce('span','product-price-label','Mulai'));
if(hasFlash){prices.appendChild(ce('span','product-price-old',origPrice));prices.appendChild(ce('span','product-price flash',displayPrice))}
else prices.appendChild(ce('span','product-price',displayPrice));
mid.appendChild(prices);
card.appendChild(mid);
var foot=ce('div','product-footer');
var count=ce('p','product-count');
count.appendChild(svgI(ICON.checkCircle,'.625rem','.625rem'));
count.appendChild(ce('span',null,totalPkgs+' Paket'));
foot.appendChild(count);
var arrow=ce('div','product-arrow');arrow.appendChild(svgI(ICON.plus,'.625rem','.625rem'));
foot.appendChild(arrow);
card.appendChild(foot);
grid.insertBefore(card,noRes);
});
}
export function openOrderModal(appName){
if(guardClosed())return;
currentOrderApp=appName;
if(!orderModal)orderModal=modalShell({logo:true,title:'Aplikasi'});
orderModal.title.textContent=appName;
if(orderModal.logo){
while(orderModal.logo.firstChild)orderModal.logo.removeChild(orderModal.logo.firstChild);
var logoUrl=getLogoUrl(appName);
if(logoUrl){var img=ce('img');img.setAttribute('src',logoUrl);img.style.width='100%';img.style.height='100%';img.style.objectFit='cover';orderModal.logo.appendChild(img)}
else orderModal.logo.appendChild(ce('span',null,appName.charAt(0)));
}
var info=S.apps[appName];
if(!info||!orderModal.body)return;
while(orderModal.body.firstChild)orderModal.body.removeChild(orderModal.body.firstChild);
var list=ce('div','pkg-list');
info.packages.forEach(function(item,index){
var cat=item.category,pkgId='pkg-'+cat.replace(/[^a-zA-Z0-9]/g,'')+'-'+index;
var isSold=item.status&&String(item.status).toLowerCase()!=='ready';
var eff=FlashSale.getEffectivePrice(item);
var cartQty=0;
for(var i=0;i<S.cart.length;i++){if(S.cart[i].app===appName&&S.cart[i].cat===cat&&S.cart[i].dur===item.duration){cartQty=S.cart[i].qty;break}}
var row=ce('div','pkg-item'+(isSold?' sold':'')+(cartQty>0?' in-cart':''));
row.id='row-'+pkgId;
var left=ce('div','pkg-item-left');
var catRow=ce('div','pkg-item-cat');
catRow.appendChild(ce('span',null,cat));
if(isSold)catRow.appendChild(ce('span','pkg-badge-sold','Habis'));
if(eff.isFlash&&!isSold)catRow.appendChild(ce('span','pkg-badge-flash','⚡'));
left.appendChild(catRow);
left.appendChild(ce('h4','pkg-item-name',item.duration));
if(item.notes&&String(item.notes).toLowerCase()!=='nan'){
var note=ce('p','pkg-item-note');
note.appendChild(ce('span',null,'↳'));
note.appendChild(ce('span',null,item.notes));
left.appendChild(note);
}
var right=ce('div','pkg-item-right');
var priceDiv=ce('div','pkg-item-price');
if(eff.isFlash&&!isSold){priceDiv.appendChild(ce('span','pkg-price-old',eff.originalPrice));priceDiv.appendChild(ce('span','pkg-price-val',eff.price))}
else priceDiv.appendChild(ce('span','pkg-price-val',eff.price));
right.appendChild(priceDiv);
var btnWrap=ce('div');btnWrap.id='btn-container-'+pkgId;
if(isSold){btnWrap.appendChild(ce('span','pkg-sold-label','Kosong'))}
else{
var addBtn=ce('button','btn btn-sm');addBtn.setAttribute('type','button');
addBtn.style.background=cartQty>0?'var(--choco-600)':'var(--w)';
addBtn.style.color=cartQty>0?'var(--butter-100)':'var(--choco-600)';
addBtn.style.border='1px solid '+(cartQty>0?'var(--choco-600)':'var(--blue-200)');
addBtn.style.borderRadius='9999px';
addBtn.style.padding='.3rem .625rem';
addBtn.style.fontSize='.625rem';
addBtn.style.fontWeight='700';
addBtn.textContent=cartQty>0?cartQty+' pcs ✓':'Tambah';
(function(a,c,d,p,pid){
addBtn.addEventListener('click',function(){
addToCart(a,c,d,p);
var qty=0;
for(var i=0;i<S.cart.length;i++){if(S.cart[i].app===a&&S.cart[i].cat===c&&S.cart[i].dur===d){qty=S.cart[i].qty;break}}
this.textContent=qty>0?qty+' pcs ✓':'Tambah';
this.style.background=qty>0?'var(--choco-600)':'var(--w)';
this.style.color=qty>0?'var(--butter-100)':'var(--choco-600)';
this.style.border='1px solid '+(qty>0?'var(--choco-600)':'var(--blue-200)');
var rowEl=document.getElementById('row-'+pid);
if(rowEl){if(qty>0)rowEl.classList.add('in-cart');else rowEl.classList.remove('in-cart')}
});
})(appName,cat,item.duration,eff.price,pkgId);
btnWrap.appendChild(addBtn);
}
right.appendChild(btnWrap);
row.appendChild(left);row.appendChild(right);
list.appendChild(row);
});
orderModal.body.appendChild(list);
orderModal.open();
}
export function refreshOrderModal(){
if(orderModal&&!orderModal.el.classList.contains('hidden')&&currentOrderApp)openOrderModal(currentOrderApp);
}
