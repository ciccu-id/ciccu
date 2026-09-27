import{ce,svgI,ICON,formatSmartPrice,extractNumK}from'./p-core.js';
import{S,getLogoUrl}from'./p-state.js';
import{FlashSale}from'./p-flashsale.js';
import{guardClosed}from'./p-modals.js';
var panelEl=null,badgeEl=null,totalEl=null,listEl=null,toastEl=null;
export function createToast(){toastEl=ce('div','toast');var icon=ce('div','toast-icon');icon.appendChild(svgI(ICON.check,'1rem','1rem'));toastEl.appendChild(icon);var text=ce('div','toast-text');text.appendChild(ce('b',null,'Ditambahkan! 💕'));text.appendChild(ce('small',null,'Cek di keranjang bawah ya.'));toastEl.appendChild(text);document.body.appendChild(toastEl)}
export function showToast(){if(!toastEl)return;toastEl.classList.add('show');setTimeout(function(){toastEl.classList.remove('show')},1500)}
export function createCartPanel(onCheckout){
panelEl=ce('div','cart-panel');
var inner=ce('div','cart-inner');
var header=ce('div','cart-header');
var left=ce('div','cart-left');
var iconWrap=ce('div','cart-icon-wrap');
iconWrap.appendChild(svgI(ICON.bag,'1rem','1rem'));
badgeEl=ce('span','cart-badge','0');iconWrap.appendChild(badgeEl);
left.appendChild(iconWrap);
var info=ce('div');info.appendChild(ce('p','cart-info-label','Total Belanjaan 🛍️'));
totalEl=ce('p','cart-info-total','0K');info.appendChild(totalEl);
left.appendChild(info);
var right=ce('div','cart-right');
var checkoutBtn=ce('button','cart-checkout');checkoutBtn.setAttribute('type','button');
checkoutBtn.appendChild(ce('span',null,'Checkout'));checkoutBtn.appendChild(svgI(ICON.right,'.75rem','.75rem'));
checkoutBtn.addEventListener('click',function(e){e.stopPropagation();if(onCheckout)onCheckout()});
right.appendChild(checkoutBtn);
var toggleBtn=ce('div','cart-toggle');toggleBtn.id='cartToggleIcon';toggleBtn.appendChild(svgI(ICON.chevD,'.875rem','.875rem'));
right.appendChild(toggleBtn);
header.appendChild(left);header.appendChild(right);
header.addEventListener('click',function(e){if(e.target.closest('.cart-checkout'))return;toggleSummaryList()});
listEl=ce('div','cart-list');
inner.appendChild(header);inner.appendChild(listEl);
panelEl.appendChild(inner);
document.body.appendChild(panelEl);
}
export function toggleSummaryList(){
S.summaryOpen=!S.summaryOpen;
var icon=document.getElementById('cartToggleIcon');
if(S.summaryOpen){listEl.classList.add('open');if(icon){while(icon.firstChild)icon.removeChild(icon.firstChild);icon.appendChild(svgI(ICON.chevU,'.875rem','.875rem'))}}
else{listEl.classList.remove('open');if(icon){while(icon.firstChild)icon.removeChild(icon.firstChild);icon.appendChild(svgI(ICON.chevD,'.875rem','.875rem'))}}
}
export function addToCart(appName,cat,dur,price){
if(guardClosed())return;
var eff=FlashSale.getEffectivePrice({price:price,flash_price:price});
var isFlash=false,origPrice=price;
var info=S.apps[appName];
if(info){for(var i=0;i<info.packages.length;i++){var p=info.packages[i];if(p.category===cat&&p.duration===dur){var e2=FlashSale.getEffectivePrice(p);price=e2.price;isFlash=e2.isFlash;origPrice=e2.isFlash?e2.originalPrice:e2.price;break}}}
var idx=-1;
for(var j=0;j<S.cart.length;j++){if(S.cart[j].app===appName&&S.cart[j].cat===cat&&S.cart[j].dur===dur){idx=j;break}}
if(idx!==-1)S.cart[idx].qty++;
else S.cart.push({app:appName,cat:cat,dur:dur,price:price,qty:1,isFlash:isFlash,originalPrice:origPrice,separateForms:false,useFirstItemData:false,formData:[{}]});
updateCartUI();showToast();
var wrap=panelEl?panelEl.querySelector('.cart-icon-wrap'):null;
if(wrap){wrap.classList.remove('bounce');void wrap.offsetWidth;wrap.classList.add('bounce')}
}
export function updateCartUI(){
var count=0,total=0;
for(var i=0;i<S.cart.length;i++){count+=S.cart[i].qty;total+=extractNumK(S.cart[i].price)*S.cart[i].qty}
if(badgeEl)badgeEl.textContent=count;
if(totalEl)totalEl.textContent=formatSmartPrice(total);
if(count>0){if(panelEl)panelEl.classList.add('visible');renderCartList()}
else{if(panelEl)panelEl.classList.remove('visible');S.summaryOpen=false;if(listEl)listEl.classList.remove('open')}
}
function renderCartList(){
if(!listEl)return;
while(listEl.firstChild)listEl.removeChild(listEl.firstChild);
for(var i=0;i<S.cart.length;i++){
(function(index){
var item=S.cart[index];
var row=ce('div','cart-item');
var left=ce('div','cart-item-left');
var logoWrap=ce('div','cart-item-logo');
var logoUrl=getLogoUrl(item.app);
if(logoUrl){var img=ce('img');img.setAttribute('src',logoUrl);img.setAttribute('loading','lazy');logoWrap.appendChild(img)}
else logoWrap.appendChild(ce('span',null,item.app.charAt(0)));
left.appendChild(logoWrap);
var info=ce('div','cart-item-info');
info.appendChild(ce('p','cart-item-name',item.app));
var pkg=ce('p','cart-item-pkg');
var catSpan=ce('span',null,item.cat);catSpan.style.color='var(--choco-600)';catSpan.style.fontWeight='700';catSpan.style.textTransform='uppercase';
pkg.appendChild(catSpan);
if(item.isFlash)pkg.appendChild(ce('span','flash-ind','⚡'));
pkg.appendChild(ce('span',null,' • '+item.dur));
info.appendChild(pkg);
left.appendChild(info);
var right=ce('div','cart-item-right');
right.appendChild(ce('span','cart-item-price',formatSmartPrice(extractNumK(item.price)*item.qty)));
var qty=ce('div','qty-ctrl');
var minus=ce('button','qty-btn minus','-');minus.setAttribute('type','button');minus.addEventListener('click',function(){updateQty(index,-1)});
var val=ce('span','qty-val',String(item.qty));
var plus=ce('button','qty-btn plus','+');plus.setAttribute('type','button');plus.addEventListener('click',function(){updateQty(index,1)});
qty.appendChild(minus);qty.appendChild(val);qty.appendChild(plus);
right.appendChild(qty);
row.appendChild(left);row.appendChild(right);
listEl.appendChild(row);
})(i);
}
}
function updateQty(index,delta){
var item=S.cart[index];
var q=item.qty+delta;
if(q<1)S.cart.splice(index,1);else item.qty=q;
updateCartUI();
}
