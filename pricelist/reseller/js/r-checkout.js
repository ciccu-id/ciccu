import{RES,ce,resFmtIDR,resApi,resToast,cartTotal}from'./r-core.js?v=6';
import{clearCart}from'./r-store.js?v=6';
function parseFormFields(str){
if(!str)return[];
try{if(String(str).trim().startsWith('['))return JSON.parse(str).map(function(i){return i.name||i})}catch(e){}
return String(str).split(',').map(function(s){return s.trim()}).filter(Boolean);
}
function ensureItemForm(item){
if(!item.form_fields){
var found=null;
for(var i=0;i<RES.catalog.length;i++){
if(RES.catalog[i].id===item.variant_id){found=RES.catalog[i];break}
}
item.form_fields=found?(found.form_fields||''):'';
}
if(!Array.isArray(item.formData))item.formData=[{}];
if(typeof item.separateForms!=='boolean')item.separateForms=false;
if(typeof item.useFirstItemData!=='boolean')item.useFirstItemData=false;
}
function loopCountFor(item){
return(item.separateForms&&item.qty>1)?item.qty:1;
}
function openCheckoutModal(){
if(!RES.cart.length){
resToast('Keranjang masih kosong.');
return;
}
let overlay=document.getElementById('resCheckoutModal');
if(overlay)overlay.remove();
overlay=ce('div','r-modal-overlay');
overlay.id='resCheckoutModal';
const box=ce('div','r-modal-box');
const head=ce('div','r-modal-head');
head.appendChild(ce('h3',null,'Checkout'));
const close=ce('button','r-modal-close','×');
close.type='button';
close.addEventListener('click',function(){overlay.remove();});
head.appendChild(close);
box.appendChild(head);
const body=ce('div','r-modal-body');
body.id='resCheckoutBody';
renderCheckoutForms(body);
box.appendChild(body);
const foot=ce('div','r-modal-foot');
const submit=ce('button','r-co-submit','Buat Pesanan');
submit.type='button';
submit.addEventListener('click',function(){submitCheckout(submit);});
foot.appendChild(submit);
box.appendChild(foot);
overlay.appendChild(box);
overlay.addEventListener('click',function(e){if(e.target===overlay)overlay.remove();});
document.body.appendChild(overlay);
}
function renderCheckoutForms(body){
while(body.firstChild)body.removeChild(body.firstChild);
const groups={};
const order=[];
RES.cart.forEach(function(item,idx){
ensureItemForm(item);
const key=item.app_name;
if(!groups[key]){groups[key]={appName:item.app_name,items:[]};order.push(key)}
groups[key].items.push({idx:idx,item:item});
});
order.forEach(function(key){
const group=groups[key];
const details=ce('details','r-co-group');
details.setAttribute('open','');
const summary=ce('summary','r-co-group-head');
summary.appendChild(ce('span','r-co-group-name',group.appName));
summary.appendChild(ce('span','r-co-group-count',group.items.length+' Paket'));
details.appendChild(summary);
const gbody=ce('div','r-co-group-body');
group.items.forEach(function(entry,gi){
const item=entry.item;
const fields=parseFormFields(item.form_fields);
const itemDiv=ce('div','r-co-item');
const top=ce('div','r-co-item-top');
const info=ce('div','r-co-item-info');
info.appendChild(ce('p','r-co-name',item.category+' • '+item.duration));
info.appendChild(ce('p','r-co-meta','Harga '+resFmtIDR(item.unit)+' × '+item.qty));
top.appendChild(info);
top.appendChild(ce('span','r-co-price',resFmtIDR(item.unit*item.qty)));
itemDiv.appendChild(top);
if(fields.length){
if(gi>0){
const first=group.items[0].item;
const sameLabel=ce('label','r-co-same');
const sameCb=ce('input');
sameCb.type='checkbox';
if(item.useFirstItemData)sameCb.checked=true;
sameCb.addEventListener('change',function(){
item.useFirstItemData=this.checked;
renderCheckoutForms(body);
});
sameLabel.appendChild(sameCb);
sameLabel.appendChild(ce('span',null,'Samakan dengan form '+first.category+' '+first.duration));
itemDiv.appendChild(sameLabel);
}
if(!item.useFirstItemData){
if(item.qty>1){
const allLabel=ce('label','r-co-same');
const allCb=ce('input');
allCb.type='checkbox';
if(!item.separateForms)allCb.checked=true;
allCb.addEventListener('change',function(){
item.separateForms=!this.checked;
renderCheckoutForms(body);
});
allLabel.appendChild(allCb);
allLabel.appendChild(ce('span',null,'Gunakan data yang sama untuk semua '+item.qty+' akun pesanan ini'));
itemDiv.appendChild(allLabel);
}
const lc=loopCountFor(item);
for(let f=0;f<lc;f++){
if(!item.formData[f])item.formData[f]={};
if(item.separateForms&&item.qty>1){
itemDiv.appendChild(ce('div','r-co-acct-label','↳ DATA AKUN #'+(f+1)));
}
const grid=ce('div','r-co-fields');
fields.forEach(function(fn){
const fieldDiv=ce('div','r-co-field');
fieldDiv.appendChild(ce('label',null,fn));
const input=ce('input');
input.type='text';
input.placeholder='Ketik '+fn;
if(item.formData[f][fn])input.value=item.formData[f][fn];
input.addEventListener('input',function(){
item.formData[f][fn]=this.value;
});
fieldDiv.appendChild(input);
grid.appendChild(fieldDiv);
});
itemDiv.appendChild(grid);
}
}else{
const ok=ce('div','r-co-ok');
ok.appendChild(ce('p',null,'Data akan disalin otomatis dari form '+group.items[0].item.category+' '+group.items[0].item.duration+'.'));
itemDiv.appendChild(ok);
}
}
gbody.appendChild(itemDiv);
});
details.appendChild(gbody);
body.appendChild(details);
});
const totRow=ce('div','r-co-total');
totRow.appendChild(ce('span',null,'Total'));
totRow.appendChild(ce('span','r-co-total-val',resFmtIDR(cartTotal())));
body.appendChild(totRow);
}
function validateForms(){
for(let i=0;i<RES.cart.length;i++){
const item=RES.cart[i];
ensureItemForm(item);
const fields=parseFormFields(item.form_fields);
if(!fields.length)continue;
if(item.useFirstItemData)continue;
const lc=loopCountFor(item);
for(let f=0;f<lc;f++){
for(let fi=0;fi<fields.length;fi++){
const fn=fields[fi];
const v=item.formData[f]&&item.formData[f][fn]?String(item.formData[f][fn]).trim():'';
if(!v){
let msg='Mohon lengkapi kolom "'+fn+'" untuk pesanan '+item.app_name+' ('+item.category+' '+item.duration+')';
if(item.separateForms&&item.qty>1)msg+=' pada Data Akun #'+(f+1);
return msg;
}
}
}
}
return null;
}
function buildItems(){
const firstByApp={};
for(let i=0;i<RES.cart.length;i++){
const it=RES.cart[i];
ensureItemForm(it);
const key=it.app_name;
if(firstByApp[key]===undefined&&parseFormFields(it.form_fields).length&&!it.useFirstItemData)firstByApp[key]=i;
}
return RES.cart.map(function(it,idx){
const fields=parseFormFields(it.form_fields);
const out={variant_id:it.variant_id,qty:it.qty};
if(fields.length){
let arr;
if(it.useFirstItemData){
const fi=firstByApp[it.app_name];
if(fi!==undefined&&fi!==idx){
const src=RES.cart[fi];
arr=(src.formData||[]).slice(0,loopCountFor(src));
}else{
arr=(it.formData||[]).slice(0,1);
}
}else{
arr=(it.formData||[]).slice(0,loopCountFor(it));
}
out.form_data=arr;
}
return out;
});
}
async function submitCheckout(btn){
if(!RES.cart.length){resToast('Keranjang masih kosong.');return;}
const verr=validateForms();
if(verr){resToast(verr,true);return;}
const items=buildItems();
const idem='res_'+Date.now()+'_'+Math.random().toString(36).slice(2,8);
btn.disabled=true;
btn.textContent='Memproses...';
try{
const data=await resApi('/api/reseller/checkout',{
method:'POST',
body:{items:items,idempotency_key:idem}
});
const m=document.getElementById('resCheckoutModal');
if(m)m.remove();
clearCart();
showPaymentInstruction(data);
document.dispatchEvent(new CustomEvent('res:checkout-success',{detail:data}));
}catch(e){
resToast(e.message||'Checkout gagal.',true);
btn.disabled=false;
btn.textContent='Buat Pesanan';
}
}
function showPaymentInstruction(data){
let overlay=document.getElementById('resPaymentModal');
if(overlay)overlay.remove();
overlay=ce('div','r-modal-overlay');
overlay.id='resPaymentModal';
const box=ce('div','r-modal-box');
const head=ce('div','r-modal-head');
head.appendChild(ce('h3',null,'Pesanan Dibuat'));
const close=ce('button','r-modal-close','×');
close.type='button';
close.addEventListener('click',function(){overlay.remove();});
head.appendChild(close);
box.appendChild(head);
const body=ce('div','r-modal-body');
body.appendChild(ce('p','r-pay-info','Order '+ (data.order_code||('#'+data.order_id)) +' • Total '+resFmtIDR(data.total)));
body.appendChild(ce('p','r-pay-info','Metode: '+(data.provider||'-')));
if(data.instruction){
body.appendChild(renderInstruction(data.instruction));
}else{
body.appendChild(ce('p','r-pay-info','Menunggu pembayaran. Cek halaman Pesanan untuk status terbaru.'));
}
box.appendChild(body);
const foot=ce('div','r-modal-foot');
const okBtn=ce('button','r-co-submit','Mengerti');
okBtn.type='button';
okBtn.addEventListener('click',function(){overlay.remove();});
foot.appendChild(okBtn);
box.appendChild(foot);
overlay.appendChild(box);
overlay.addEventListener('click',function(e){if(e.target===overlay)overlay.remove();});
document.body.appendChild(overlay);
}
function renderInstruction(instr){
const wrap=ce('div','r-pay-instr');
if(typeof instr==='string'){
wrap.appendChild(ce('p','r-pay-text',instr));
return wrap;
}
if(typeof instr!=='object'||instr===null)return wrap;
if(instr.type==='qris'&&instr.qr_url){
const img=document.createElement('img');
img.src=instr.qr_url;
img.className='r-pay-qr';
img.alt='QRIS';
wrap.appendChild(img);
}
if(instr.redirect_url){
const a=document.createElement('a');
a.href=instr.redirect_url;
a.target='_blank';
a.rel='noopener';
a.className='r-pay-link';
a.textContent='Lanjut ke Pembayaran →';
wrap.appendChild(a);
}
if(instr.bank)wrap.appendChild(ce('p','r-pay-text','Bank: '+instr.bank));
if(instr.account)wrap.appendChild(ce('p','r-pay-text','No. Rekening: '+instr.account));
if(instr.account_name)wrap.appendChild(ce('p','r-pay-text','Atas Nama: '+instr.account_name));
if(instr.amount)wrap.appendChild(ce('p','r-pay-text','Jumlah: '+resFmtIDR(instr.amount)));
if(instr.notes)wrap.appendChild(ce('p','r-pay-note',instr.notes));
return wrap;
}
export function initCheckout(){
document.addEventListener('res:open-checkout',function(){
openCheckoutModal();
});
}
