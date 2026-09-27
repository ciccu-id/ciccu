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
export function rModal(el,box,opts){
opts=opts||{};
el.setAttribute('role','dialog');
el.setAttribute('aria-modal','true');
box.setAttribute('tabindex','-1');
var isOpen=false,savedFocus=null;
var SEL='a[href],button:not([disabled]),input:not([disabled]),select:not([disabled]),textarea:not([disabled]),[tabindex]:not([tabindex="-1"])';
function list(){return box.querySelectorAll(SEL)}
function onKey(e){
if(!isOpen)return;
if(e.key==='Escape'){if(opts.escape!==false){e.preventDefault();close()}}
else if(e.key==='Tab'){
var f=list();
if(!f.length){e.preventDefault();box.focus();return}
var first=f[0],last=f[f.length-1],ae=document.activeElement;
if(e.shiftKey){if(ae===first||ae===box||!box.contains(ae)){e.preventDefault();last.focus()}}
else{if(ae===last||!box.contains(ae)){e.preventDefault();first.focus()}}
}
}
el.addEventListener('keydown',onKey);
function open(focusFirstFlag){
if(isOpen)return;
isOpen=true;
savedFocus=document.activeElement;
if(!el.parentNode)document.body.appendChild(el);
requestAnimationFrame(function(){requestAnimationFrame(function(){
if(focusFirstFlag){var f=list();if(f.length){f[0].focus();return}}
box.focus();
})});
}
function close(){
if(!isOpen)return;
isOpen=false;
if(el.parentNode)el.parentNode.removeChild(el);
if(savedFocus&&typeof savedFocus.focus==='function'){try{savedFocus.focus()}catch(e){}}
savedFocus=null;
}
return{open:open,close:close,focusFirst:function(){var f=list();if(f.length)f[0].focus();else box.focus()},focusLast:function(){var f=list();if(f.length)f[f.length-1].focus();else box.focus()}};
}
