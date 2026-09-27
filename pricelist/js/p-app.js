import{ce}from'./p-core.js';
import{S}from'./p-state.js';
import{loadSettings,loadPricelist,loadForms,loadMetadata,buildApps,buildForms,buildMeta}from'./p-api.js';
import{FlashSale}from'./p-flashsale.js';
import{createToast,createCartPanel,addToCart,updateCartUI}from'./p-cart.js';
import{createCheckoutPanel,openCheckout}from'./p-checkout.js';
import{showPricelist,renderCurrentGrid,refreshOrderModal}from'./p-render.js';
import{showWelcome,setPricelistHandler}from'./p-welcome.js';
function onExpire(){
for(var i=0;i<S.cart.length;i++){
var info=S.apps[S.cart[i].app];
if(info){for(var j=0;j<info.packages.length;j++){var p=info.packages[j];if(p.category===S.cart[i].cat&&p.duration===S.cart[i].dur){S.cart[i].price=p.price;S.cart[i].isFlash=false;S.cart[i].originalPrice=p.price;break}}}
}
updateCartUI();
renderCurrentGrid();
refreshOrderModal();
}
function loadAll(){
return loadSettings().then(function(s){
if(s.is_closed){S.storeClosed=true;if(s.message)S.storeClosedMsg=s.message}
FlashSale.init({start:s.flash_sale_start,end:s.flash_sale_end,name:s.flash_sale_name,description:s.flash_sale_description});
return loadPricelist();
}).then(function(data){
buildApps(data);
FlashSale.setItems(S.apps);
return loadForms();
}).then(function(forms){
buildForms(forms);
return loadMetadata();
}).then(function(meta){
buildMeta(meta);
});
}
function syncScrollLock(){
var open=document.querySelector('.modal-overlay:not(.hidden),.checkout-overlay:not(.hidden),.store-closed-overlay:not(.hidden)');
document.body.style.overflow=open?'hidden':'';
}
function boot(){
createToast();
createCartPanel(openCheckout);
createCheckoutPanel();
FlashSale.onAdd=addToCart;
FlashSale.onExpire=onExpire;
setPricelistHandler(showPricelist);
var lockObserver=new MutationObserver(syncScrollLock);
lockObserver.observe(document.body,{subtree:true,childList:true,attributes:true,attributeFilter:['class']});
syncScrollLock();
loadAll().then(function(){showWelcome()}).catch(function(e){
console.error('Init error:',e);
var container=document.getElementById('app');
if(!container)return;
while(container.firstChild)container.removeChild(container.firstChild);
var errDiv=ce('div','welcome');
errDiv.appendChild(ce('p',null,'Gagal memuat data. Silakan coba lagi. 🥺'));
var retryBtn=ce('button','btn btn-primary');
retryBtn.setAttribute('type','button');
retryBtn.textContent='Coba Lagi';
retryBtn.addEventListener('click',function(){location.reload()});
errDiv.appendChild(retryBtn);
container.appendChild(errDiv);
});
}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',boot);else boot();
