var RES_CHECKOUT_KEY='',resPollTimer=null,resCheckoutModal=null,resCheckoutOrderId=null;
function stopResPoll(){if(resPollTimer){clearInterval(resPollTimer);resPollTimer=null}}
function resStatusText(st){var m={'pending_payment':'Menunggu pembayaran','delivered':'Terkirim','needs_attention':'Perlu perhatian admin','cancelled':'Dibatalkan','refunded':'Direfund'};return m[st]||st}
function createResCheckoutModal(){
if(resCheckoutModal)return resCheckoutModal;
var ov=ce('div','r-modal');ov.id='resCheckoutModal';ov.classList.add('hidden');
var bd=ce('div','r-modal-bd');
bd.addEventListener('click',closeResCheckout);
ov.appendChild(bd);
var box=ce('div','r-modal-box');
var head=ce('div','r-modal-head');
head.appendChild(ce('h3',null,'Pembayaran'));
var close=ce('button','r-modal-close');
close.setAttribute('type','button');
close.appendChild(svgI('M6 18L18 6M6 6l12 12','1rem','1rem'));
close.addEventListener('click',closeResCheckout);
head.appendChild(close);
box.appendChild(head);
var body=ce('div','r-modal-body');body.id='resCheckoutBody';
box.appendChild(body);
ov.appendChild(box);
document.body.appendChild(ov);
resCheckoutModal=ov;
return ov;
}
function closeResCheckout(){
stopResPoll();
if(resCheckoutModal){
var bd=resCheckoutModal.querySelector('.r-modal-bd');
var bx=resCheckoutModal.querySelector('.r-modal-box');
if(bd)bd.classList.remove('show');
if(bx)bx.classList.remove('show');
setTimeout(function(){resCheckoutModal.classList.add('hidden')},300);
}
}
function openResCheckoutModal(){
var ov=createResCheckoutModal();
ov.classList.remove('hidden');
var bd=ov.querySelector('.r-modal-bd');
var bx=ov.querySelector('.r-modal-box');
setTimeout(function(){if(bd)bd.classList.add('show');if(bx)bx.classList.add('show')},10);
}
function renderCheckoutBody(html){
var body=document.getElementById('resCheckoutBody');
if(!body)return;
while(body.firstChild)body.removeChild(body.firstChild);
return body;
}
function showCheckoutError(msg){
var body=renderCheckoutBody();
body.appendChild(ce('div','r-empty',msg));
}
function showInstruction(orderId,total,instruction){
var body=renderCheckoutBody();
var qr=ce('div','r-qr');
if(instruction&&instruction.type==='qris'){
if(instruction.qr_image){var img=ce('img');img.setAttribute('src',instruction.qr_image);img.style.margin='0 auto';img.style.maxWidth='14rem';qr.appendChild(img)}
else if(instruction.qr_string){qr.appendChild(ce('p','r-qr-msg','Scan QR berikut untuk membayar:'));qr.appendChild(ce('pre','r-qr-code',instruction.qr_string))}
else qr.appendChild(ce('p','r-qr-msg','Instruksi QR tidak tersedia.'));
}else{
qr.appendChild(ce('p','r-qr-msg',(instruction&&instruction.message)||'Pesanan dibuat. Tunggu verifikasi pembayaran.'));
}
qr.appendChild(ce('p','r-qr-total','Rp '+resFmt(total)));
qr.appendChild(ce('p','r-qr-id','Order #'+orderId));
if(instruction&&instruction.expires_at)qr.appendChild(ce('p','r-qr-id','Batas bayar: '+instruction.expires_at));
body.appendChild(qr);
var st=ce('p','r-order-meta');st.id='resPayStatus';st.style.textAlign='center';st.style.marginTop='.75rem';
st.textContent='Status: memeriksa...';
body.appendChild(st);
startResPoll(orderId);
}
function startResPoll(orderId){
stopResPoll();
var n=0;
resPollTimer=setInterval(function(){
n++;
if(n>100){stopResPoll();var s=document.getElementById('resPayStatus');if(s)s.textContent='Status: waktu polling habis. Cek halaman Pesanan.';return}
fetch('/api/reseller/orders/'+orderId+'/status',{credentials:'same-origin'}).then(function(r){return r.json()}).then(function(d){
var el=document.getElementById('resPayStatus');
if(el)el.textContent='Status: '+resStatusText(d.status);
if(d.status==='delivered'){
stopResPoll();
onCheckoutDelivered(orderId);
}else if(d.status==='cancelled'||d.status==='refunded'){
stopResPoll();
}
}).catch(function(){});
},3000);
}
function onCheckoutDelivered(orderId){
var body=renderCheckoutBody();
var ok=ce('div','r-qr');
ok.appendChild(ce('p','r-qr-msg','✅ Pembayaran terverifikasi & data terkirim!'));
ok.appendChild(ce('p','r-qr-id','Order #'+orderId));
body.appendChild(ok);
var btn=ce('button','r-btn r-btn-mint');
btn.setAttribute('type','button');
btn.style.width='100%';
btn.style.marginTop='.75rem';
btn.textContent='Lihat Data Saya';
btn.addEventListener('click',function(){
closeResCheckout();
RES_CART=[];
updateResCartUI();
resShowView('orders');
});
body.appendChild(btn);
RES_CART=[];
updateResCartUI();
}
function resOpenCheckout(){
if(!RES_CART.length)return resToast('Keranjang kosong.');
RES_CHECKOUT_KEY='rsl-'+Date.now()+'-'+Math.random().toString(36).slice(2,10);
var items=RES_CART.map(function(i){return{variant_id:i.variant_id,qty:i.qty}});
openResCheckoutModal();
var body=renderCheckoutBody();
body.appendChild(ce('div','r-loading','Membuat pesanan...'));
resApi('/api/reseller/checkout',{method:'POST',body:JSON.stringify({items:items,idempotency_key:RES_CHECKOUT_KEY})})
.then(function(d){
if(d.error)return showCheckoutError(d.error);
resCheckoutOrderId=d.order_id;
if(d.reused){showInstruction(d.order_id,d.total,null);return}
showInstruction(d.order_id,d.total,d.instruction);
})
.catch(function(e){
if(e&&e.message==='unauthorized')return;
showCheckoutError('Gagal membuat pesanan. Coba lagi.');
});
}
