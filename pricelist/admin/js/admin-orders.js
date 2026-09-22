function fmtRpOrd(n){n=n||0;return'Rp '+Number(n).toLocaleString('id-ID')}
function fmtDTOrd(s){
if(!s)return'-';
var t=Date.parse(String(s).replace(' ','T')+'Z');
if(isNaN(t))return s;
return new Date(t).toLocaleString('id-ID',{day:'2-digit',month:'short',hour:'2-digit',minute:'2-digit'});
}
function orderStatusText(s){var m={'pending_payment':'Menunggu pembayaran','delivered':'Terkirim','needs_attention':'Perlu perhatian admin','cancelled':'Dibatalkan','refunded':'Direfund'};return m[s]||s}
function orderStatusClass(s){return'pill '+(s==='delivered'?'green':s==='pending_payment'?'amber':s==='needs_attention'?'amber':s==='cancelled'?'gray':'red')}
function orderHeaders(){return{'Content-Type':'application/json','x-admin-password':sessionPass}}
function loadOrders(){
var list=document.getElementById('orderList');
if(!list)return;
while(list.firstChild)list.removeChild(list.firstChild);
list.appendChild(ce('div','loading-state','Memuat pesanan...'));
var status=document.getElementById('orderStatusFilter').value;
var url='/api/admin/orders?limit=50'+(status?'&status='+encodeURIComponent(status):'');
fetch(url,{headers:{'x-admin-password':sessionPass}}).then(function(r){return r.json()}).then(function(rows){
while(list.firstChild)list.removeChild(list.firstChild);
if(!rows||!rows.length){list.appendChild(ce('div','empty-state','Belum ada pesanan reseller.'));return}
rows.forEach(function(o){
var card=ce('div','card');
var head=ce('div','card-header-row');
var left=ce('div');
left.appendChild(ce('h3','card-title','Order #'+o.id));
left.appendChild(ce('p','fs-item-price',(o.username||'')+(o.username?' • ':'')+fmtDTOrd(o.created_at)));
head.appendChild(left);
head.appendChild(ce('span',orderStatusClass(o.status),orderStatusText(o.status)));
card.appendChild(head);
card.appendChild(ce('p','fs-item-price','Total '+fmtRpOrd(o.total_amount)+' • '+o.provider));
if(o.status==='delivered'&&o.expires_at){
var cdP=ce('p','fs-item-price');
cdP.appendChild(document.createTextNode('Sisa masa aktif: '));
var cdT=ce('span','cd-tag');
cdT.setAttribute('data-cd',o.expires_at);
cdP.appendChild(cdT);
card.appendChild(cdP);
}
var actions=ce('div','pkg-actions');
actions.style.marginTop='.5rem';
var viewBtn=ce('button','tool-btn sky','Detail');
viewBtn.setAttribute('type','button');
viewBtn.addEventListener('click',function(){viewOrder(o.id)});
actions.appendChild(viewBtn);
if(o.status==='pending_payment'){
var settleBtn=ce('button','tool-btn green','Tandai Lunas');
settleBtn.setAttribute('type','button');
settleBtn.addEventListener('click',function(){settleOrder(o.id)});
actions.appendChild(settleBtn);
}
if(o.status==='needs_attention'){
var retryBtn=ce('button','tool-btn purple','Proses Ulang');
retryBtn.setAttribute('type','button');
retryBtn.addEventListener('click',function(){retryOrder(o.id)});
actions.appendChild(retryBtn);
}
if(o.status==='delivered'||o.status==='needs_attention'){
var refundBtn=ce('button','tool-btn','Refund');
refundBtn.setAttribute('type','button');
refundBtn.style.background='var(--brick-50)';
refundBtn.style.color='var(--brick-500)';
refundBtn.style.borderColor='var(--brick-200)';
refundBtn.addEventListener('click',function(){refundOrder(o.id)});
actions.appendChild(refundBtn);
}
card.appendChild(actions);
list.appendChild(card);
});
if(typeof uiTickCountdowns==='function')uiTickCountdowns();
}).catch(function(){
while(list.firstChild)list.removeChild(list.firstChild);
list.appendChild(ce('div','empty-state','Gagal memuat pesanan.'));
});
}
function viewOrder(id){
fetch('/api/admin/orders/'+id,{headers:{'x-admin-password':sessionPass}}).then(function(r){return r.json()}).then(function(o){
if(!o||o.error)return uiAlert((o&&o.error)||'Order tidak ditemukan.','Kesalahan');
var sub=document.getElementById('orderDetailSub');
if(sub)sub.textContent='Order #'+o.id;
var body=document.getElementById('orderDetailBody');
while(body.firstChild)body.removeChild(body.firstChild);
var stP=ce('p','fs-item-price');
stP.appendChild(document.createTextNode('Status: '));
stP.appendChild(ce('span',orderStatusClass(o.status),orderStatusText(o.status)));
body.appendChild(stP);
body.appendChild(ce('p','fs-item-price','Total '+fmtRpOrd(o.total_amount)));
body.appendChild(ce('p','fs-item-price','Dibuat '+fmtDTOrd(o.created_at)));
if(o.paid_at)body.appendChild(ce('p','fs-item-price','Lunas '+fmtDTOrd(o.paid_at)));
if(o.delivered_at)body.appendChild(ce('p','fs-item-price','Terkirim '+fmtDTOrd(o.delivered_at)));
if(o.status==='delivered'&&o.expires_at){
var ocd=ce('p','fs-item-price');
ocd.appendChild(document.createTextNode('Sisa masa aktif (tercepat): '));
var ocdT=ce('span','cd-tag');
ocdT.setAttribute('data-cd',o.expires_at);
ocd.appendChild(ocdT);
body.appendChild(ocd);
}
body.appendChild(ce('p','card-title','Item'));
(o.items||[]).forEach(function(it){
var p=ce('p','fs-item-price');
p.appendChild(document.createTextNode(it.app_name+' • '+it.category+' • '+it.duration+' — qty '+it.qty+' × '+fmtRpOrd(it.unit_price)+' '));
if(it.expires_at){
var itCd=ce('span','cd-tag');
itCd.setAttribute('data-cd',it.expires_at);
p.appendChild(itCd);
}
body.appendChild(p);
});
if(o.payments&&o.payments.length){
body.appendChild(ce('p','card-title','Pembayaran'));
o.payments.forEach(function(py){
body.appendChild(ce('p','fs-item-price',py.provider+' • '+py.status+' • '+fmtRpOrd(py.gross_amount)+' • '+fmtDTOrd(py.created_at)));
});
}
if(o.credentials&&o.credentials.length){
body.appendChild(ce('p','card-title','Kredensial'));
o.credentials.forEach(function(cr){
if(!cr.fields)return;
try{var obj=JSON.parse(cr.fields);body.appendChild(ce('p','fs-item-price','Stock #'+cr.stock_id+' — '+Object.keys(obj).map(function(k){return k+': '+obj[k]}).join(' | ')))}catch(e){}
});
}
var modal=document.getElementById('orderDetailModal');
if(modal)modal.classList.remove('hidden');
if(typeof uiTickCountdowns==='function')uiTickCountdowns();
}).catch(function(){uiAlert('Gagal memuat detail pesanan.','Kesalahan')});
}
function settleOrder(id){
uiConfirm('Tandai order #'+id+' sebagai lunas?\nSistem akan langsung memproses fulfillment dan mengirim data ke reseller.','Tandai Lunas',function(){
fetch('/api/admin/orders/'+id+'/settle',{method:'POST',headers:orderHeaders()}).then(function(r){return r.json()}).then(function(d){
if(d&&d.error)return uiAlert(d.error,'Gagal');
uiToast('Order ditandai lunas & diproses.');loadOrders();
}).catch(function(){uiAlert('Gagal memproses order.','Kesalahan')});
});
}
function retryOrder(id){
uiConfirm('Proses ulang fulfillment untuk order #'+id+'?','Proses Ulang',function(){
fetch('/api/admin/orders/'+id+'/fulfill',{method:'POST',headers:orderHeaders()}).then(function(r){return r.json()}).then(function(d){
if(d&&d.error)return uiAlert(d.error,'Gagal');
uiToast('Fulfillment diproses ulang.');loadOrders();
}).catch(function(){uiAlert('Gagal memproses ulang.','Kesalahan')});
});
}
function refundOrder(id){
uiConfirm('Refund order #'+id+'?','Refund Order',function(){
fetch('/api/admin/orders/'+id+'/refund',{method:'POST',headers:orderHeaders(),body:JSON.stringify({return_stock:false})}).then(function(r){return r.json()}).then(function(d){
if(d&&d.error)return uiAlert(d.error,'Gagal');
uiToast('Order direfund.');loadOrders();
}).catch(function(){uiAlert('Gagal merefund order.','Kesalahan')});
},{danger:true,okText:'Refund'});
}
function closeOrderDetail(){
var modal=document.getElementById('orderDetailModal');
if(modal)modal.classList.add('hidden');
}
document.addEventListener('DOMContentLoaded',function(){
var btn=document.getElementById('btnRefreshOrders');
if(btn)btn.addEventListener('click',loadOrders);
var filter=document.getElementById('orderStatusFilter');
if(filter)filter.addEventListener('change',loadOrders);
});
