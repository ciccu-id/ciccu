import{RES,ce,resFmtIDR}from'./r-core.js';
import{resApi,resToast}from'./r-api.js';
import{cartTotal,rModal}from'./r-ui.js';
import{clearCart}from'./r-store.js';
let _coModal=null,_payModal=null;
function parseFormFields(str){
if(!str)return[];
try{if(String(str).trim().startsWith('['))return JSON.parse(str).map(function(i){return i.name||i})}catch(e){}
return String(str).split(',').map(function(s){return s.trim()}).filter(Boolean)
}
function safeUrl(u,isImg){
var s=String(u||'');
if(!s)return'';
try{
var x=new URL(s,window.location.origin);
if(x.protocol==='https:')return x.href;
if(isImg&&x.protocol==='data:'&&s.indexOf('data:image/')===0)return s
}catch(e){}
return''
}
function idemKey(items){
var s=JSON.stringify(items),h=5381;
for(var i=0;i<s.length;i++)h=((h<<5)+h+s.charCodeAt(i))>>>0;
return'res_'+h.toString(16)
}
function ensureItemForm(item){
if(!item.form_fields){
var found=null;
for(var i=0;i<RES.catalog.length;i++){
if(RES.catalog[i].id===item.variant_id){found=RES.catalog[i];break}
}
item.form_fields=found?(found.form_fields||''):''
}
if(!Array.isArray(item.formData))item.formData=[{}];
if(typeof item.separateForms!=='boolean')item.separateForms=false;
if(typeof item.useFirstItemData!=='boolean')item.useFirstItemData=false
}
function loopCountFor(item){
return(item.separateForms&&item.qty>1)?item.qty:1
}
function openCheckoutModal(){
if(!RES.cart.length){resToast('Keranjang masih kosong.');return}
if(_coModal){try{_coModal.close()}catch(e){}_coModal=null}
const overlay=ce('div','r-modal-overlay');overlay.id='resCheckoutModal';
const box=ce('div','r-modal-box');
const head=ce('div','r-modal-head');head.appendChild(ce('h3',null,'Checkout'));
const close=ce('button','r-modal-close');close.type='button';close.textContent='×';
head.appendChild(close);box.appendChild(head);
const body=ce('div','r-modal-body');body.id='resCheckoutBody';renderCheckoutForms(body);box.appendChild(body);
const foot=ce('div','r-modal-foot');
const submit=ce('button','r-co-submit','Buat Pesanan');submit.type='button';submit.addEventListener('click',function(){submitCheckout(submit)});
foot.appendChild(submit);box.appendChild(foot);
overlay.appendChild(box);
const m=rModal(overlay,box,{});_coModal=m;
close.addEventListener('click',function(){_coModal=null;m.close()});
overlay.addEventListener('click',function(e){if(e.target===overlay){_coModal=null;m.close()}});
m.open(true);
}
function renderCheckoutForms(body){
while(body.firstChild)body.removeChild(body.firstChild);
const groups={};
const order=[];
RES.cart.forEach(function(item,idx){
ensureItemForm(item);
const key=item.app_name;
if(!groups[key]){groups[key]={appName:item.app_name,items:[]};order.push(key)}
groups[key].items.push({idx:idx,item:item})
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
const metaP=ce('p','r-co-meta');
if(item.isFlash){
metaP.appendChild(ce('span','r-co-old',item.originalPrice));
metaP.appendChild(ce('span','r-co-flash',' ⚡'));
metaP.appendChild(ce('span',null,' '+resFmtIDR(item.unit)+' × '+item.qty))
}else{
metaP.textContent='Harga '+resFmtIDR(item.unit)+' × '+item.qty
}
info.appendChild(metaP);
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
sameCb.addEventListener('change',function(){item.useFirstItemData=this.checked;renderCheckoutForms(body)});
sameLabel.appendChild(sameCb);
sameLabel.appendChild(ce('span',null,'Samakan dengan form '+first.category+' '+first.duration));
itemDiv.appendChild(sameLabel)
}
if(!item.useFirstItemData){
if(item.qty>1){
const allLabel=ce('label','r-co-same');
const allCb=ce('input');
allCb.type='checkbox';
if(!item.separateForms)allCb.checked=true;
allCb.addEventListener('change',function(){item.separateForms=!this.checked;renderCheckoutForms(body)});
allLabel.appendChild(allCb);
allLabel.appendChild(ce('span',null,'Gunakan data yang sama untuk semua '+item.qty+' akun pesanan ini'));
itemDiv.appendChild(allLabel)
}
const lc=loopCountFor(item);
for(let f=0;f<lc;f++){
if(!item.formData[f])item.formData[f]={};
if(item.separateForms&&item.qty>1){itemDiv.appendChild(ce('div','r-co-acct-label','↳ DATA AKUN #'+(f+1)))}
const grid=ce('div','r-co-fields');
fields.forEach(function(fn){
const fieldDiv=ce('div','r-co-field');
fieldDiv.appendChild(ce('label',null,fn));
const input=ce('input');
input.type='text';
input.placeholder='Ketik '+fn;
if(item.formData[f][fn])input.value=item.formData[f][fn];
input.addEventListener('input',function(){item.formData[f][fn]=this.value});
fieldDiv.appendChild(input);
grid.appendChild(fieldDiv)
});
itemDiv.appendChild(grid)
}
}else{
const ok=ce('div','r-co-ok');
ok.appendChild(ce('p',null,'Data akan disalin otomatis dari form '+group.items[0].item.category+' '+group.items[0].item.duration+'.'));
itemDiv.appendChild(ok)
}
}
gbody.appendChild(itemDiv)
});
details.appendChild(gbody);
body.appendChild(details)
});
const totRow=ce('div','r-co-total');
totRow.appendChild(ce('span',null,'Total'));
totRow.appendChild(ce('span','r-co-total-val',resFmtIDR(cartTotal())));
body.appendChild(totRow)
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
return msg
}
}
}
}
return null
}
function buildItems(){
const firstByApp={};
for(let i=0;i<RES.cart.length;i++){
const it=RES.cart[i];
ensureItemForm(it);
const key=it.app_name;
if(firstByApp[key]===undefined&&parseFormFields(it.form_fields).length&&!it.useFirstItemData)firstByApp[key]=i
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
arr=(src.formData||[]).slice(0,loopCountFor(src))
}else{
arr=(it.formData||[]).slice(0,1)
}
}else{
arr=(it.formData||[]).slice(0,loopCountFor(it))
}
out.form_data=arr
}
return out
})
}
async function submitCheckout(btn){
if(!RES.cart.length){resToast('Keranjang masih kosong.');return}
const verr=validateForms();
if(verr){resToast(verr,true);return}
const items=buildItems();
const idem=idemKey(items);
btn.disabled=true;
btn.textContent='Memproses...';
try{
const data=await resApi('/api/reseller/checkout',{method:'POST',body:{items:items,idempotency_key:idem}});
if(_coModal){try{_coModal.close()}catch(e){}_coModal=null}
clearCart();
showPaymentInstruction(data);
document.dispatchEvent(new CustomEvent('res:checkout-success',{detail:data}))
}catch(e){
resToast(e.message||'Checkout gagal.',true);
btn.disabled=false;
btn.textContent='Buat Pesanan'
}
}
function showPaymentInstruction(data){
if(_payModal){try{_payModal.close()}catch(e){}_payModal=null}
const overlay=ce('div','r-modal-overlay');overlay.id='resPaymentModal';
const box=ce('div','r-modal-box');
const head=ce('div','r-modal-head');head.appendChild(ce('h3',null,'Pesanan Dibuat'));
const close=ce('button','r-modal-close');close.type='button';close.textContent='×';
head.appendChild(close);box.appendChild(head);
const body=ce('div','r-modal-body');
body.appendChild(ce('p','r-pay-info','Order '+(data.order_code||('#'+data.order_id))+' • Total '+resFmtIDR(data.total)));
body.appendChild(ce('p','r-pay-info','Metode: '+(data.provider||'-')));
if(data.instruction){body.appendChild(renderInstruction(data.instruction))}
else{body.appendChild(ce('p','r-pay-info','Menunggu pembayaran. Cek halaman Pesanan untuk status terbaru.'))}
box.appendChild(body);
const foot=ce('div','r-modal-foot');
const okBtn=ce('button','r-co-submit','Mengerti');okBtn.type='button';
foot.appendChild(okBtn);box.appendChild(foot);
overlay.appendChild(box);
const m=rModal(overlay,box,{});_payModal=m;
close.addEventListener('click',function(){_payModal=null;m.close()});
okBtn.addEventListener('click',function(){_payModal=null;m.close()});
overlay.addEventListener('click',function(e){if(e.target===overlay){_payModal=null;m.close()}});
m.open();
}
function renderInstruction(instr){
const wrap=ce('div','r-pay-instr');
if(typeof instr==='string'){wrap.appendChild(ce('p','r-pay-text',instr));return wrap}
if(typeof instr!=='object'||instr===null)return wrap;
if(instr.type==='qris'){
const q=safeUrl(instr.qr_url,true);
if(q){
const img=document.createElement('img');
img.src=q;
img.className='r-pay-qr';
img.alt='QRIS';
wrap.appendChild(img)
}
}
const ru=safeUrl(instr.redirect_url);
if(ru){
const a=document.createElement('a');
a.href=ru;
a.target='_blank';
a.rel='noopener noreferrer';
a.className='r-pay-link';
a.textContent='Lanjut ke Pembayaran →';
wrap.appendChild(a)
}
if(instr.bank)wrap.appendChild(ce('p','r-pay-text','Bank: '+instr.bank));
if(instr.account)wrap.appendChild(ce('p','r-pay-text','No. Rekening: '+instr.account));
if(instr.account_name)wrap.appendChild(ce('p','r-pay-text','Atas Nama: '+instr.account_name));
if(instr.amount)wrap.appendChild(ce('p','r-pay-text','Jumlah: '+resFmtIDR(instr.amount)));
if(instr.notes)wrap.appendChild(ce('p','r-pay-note',instr.notes));
return wrap
}
export function initCheckout(){
document.addEventListener('res:open-checkout',function(){openCheckoutModal()});
document.addEventListener('res:flash-expired',function(){
const m=document.getElementById('resCheckoutModal');
if(!m)return;
const body=m.querySelector('#resCheckoutBody');
if(body)renderCheckoutForms(body)
})
}
