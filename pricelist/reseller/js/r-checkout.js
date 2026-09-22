import{RES,ce,resFmtIDR,resApi,resToast,cartTotal}from'./r-core.js';
import{clearCart}from'./r-store.js';
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
RES.cart.forEach(function(item){
const row=ce('div','r-co-item');
row.appendChild(ce('span','r-co-name',item.app_name+' • '+item.category+' • '+item.duration+' ×'+item.qty));
row.appendChild(ce('span','r-co-price',resFmtIDR(item.unit*item.qty)));
body.appendChild(row);
});
const totRow=ce('div','r-co-total');
totRow.appendChild(ce('span',null,'Total'));
totRow.appendChild(ce('span','r-co-total-val',resFmtIDR(cartTotal())));
body.appendChild(totRow);
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
async function submitCheckout(btn){
if(!RES.cart.length){resToast('Keranjang masih kosong.');return;}
const items=RES.cart.map(function(i){return{variant_id:i.variant_id,qty:i.qty};});
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
resToast(e.message||'Checkout gagal.');
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
body.appendChild(ce('p','r-pay-info','Order #'+data.order_id+' • Total '+resFmtIDR(data.total)));
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
