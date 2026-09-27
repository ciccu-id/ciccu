import{RES}from'./r-core.js';
export function resShowView(name){
RES.view=name;
var sv=document.getElementById('resStoreView');
var ov=document.getElementById('resOrdersView');
if(sv)sv.classList.toggle('hidden',name!=='store');
if(ov)ov.classList.toggle('hidden',name!=='orders');
var ns=document.getElementById('resNavStore');
var no=document.getElementById('resNavOrders');
if(ns)ns.classList.toggle('active',name==='store');
if(no)no.classList.toggle('active',name==='orders');
document.dispatchEvent(new CustomEvent('res:view-changed',{detail:{view:name}}))
}
export function cartCount(){var c=0;RES.cart.forEach(function(i){c+=i.qty});return c}
export function cartTotal(){var t=0;RES.cart.forEach(function(i){t+=(i.unit||0)*(i.qty||0)});return t}
export function persistCart(){try{localStorage.setItem('res_cart',JSON.stringify(RES.cart))}catch(e){}}
export function restoreCart(){try{var raw=localStorage.getItem('res_cart');if(raw){var arr=JSON.parse(raw);if(Array.isArray(arr))RES.cart=arr}}catch(e){}}
