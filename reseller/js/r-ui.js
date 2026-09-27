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
export function cartCount(){
var c=0;
for(var i=0;i<RES.cart.length;i++){var q=parseInt(RES.cart[i].qty,10);if(q>0)c+=q}
return c
}
export function cartTotal(){
var t=0;
for(var i=0;i<RES.cart.length;i++){
var it=RES.cart[i];
var q=parseInt(it.qty,10)||0;
var u=parseFloat(it.unit)||0;
t+=u*q
}
return t
}
export function persistCart(){
try{localStorage.setItem('res_cart',JSON.stringify(RES.cart))}catch(e){}
}
export function restoreCart(){
try{
var raw=localStorage.getItem('res_cart');
if(!raw)return;
var arr=JSON.parse(raw);
if(!Array.isArray(arr))return;
var clean=[];
for(var i=0;i<arr.length;i++){
var it=arr[i];
if(!it||typeof it!=='object'||Array.isArray(it))continue;
var vid=it.variant_id;
if(vid===undefined||vid===null||vid==='')continue;
var qty=parseInt(it.qty,10);
if(isNaN(qty)||qty<1)continue;
var unit=parseFloat(it.unit);
if(isNaN(unit)||unit<0)unit=0;
var fd=Array.isArray(it.formData)?it.formData.filter(function(o){return o&&typeof o==='object'&&!Array.isArray(o)}):[];
if(!fd.length)fd=[{}];
clean.push({
variant_id:vid,
app_name:String(it.app_name||''),
category:String(it.category||''),
duration:String(it.duration||''),
price_str:String(it.price_str||''),
unit:unit,
qty:qty,
isFlash:!!it.isFlash,
originalPrice:it.originalPrice!==undefined?String(it.originalPrice):'',
separateForms:it.separateForms===true,
useFirstItemData:it.useFirstItemData===true,
form_fields:String(it.form_fields||''),
formData:fd
})
}
RES.cart=clean
}catch(e){}
}
