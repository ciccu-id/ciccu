import{RES,resShowView}from'./r-core.js?v=6';
import{initAuth}from'./r-auth.js?v=6';
import{initStore}from'./r-store.js?v=6';
import{initCheckout}from'./r-checkout.js?v=6';
import{initOrders}from'./r-orders.js?v=6';
function setupNav(){
const navStore=document.getElementById('resNavStore');
const navOrders=document.getElementById('resNavOrders');
if(navStore)navStore.addEventListener('click',function(){resShowView('store')});
if(navOrders)navOrders.addEventListener('click',function(){resShowView('orders')});
}
function boot(){
initStore();
initCheckout();
initOrders();
setupNav();
document.addEventListener('res:logged-in',function(){
resShowView(RES.view||'store');
});
initAuth();
}
if(document.readyState==='loading'){
document.addEventListener('DOMContentLoaded',boot);
}else{
boot();
}
