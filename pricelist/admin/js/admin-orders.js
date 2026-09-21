var orderCurrentDetail=null;
function admHeaders(){return{'Content-Type':'application/json','x-admin-password':sessionPass}}
function fmtIDR(n){if(!n&&n!==0)return'0';n=parseInt(n,10)||0;if(n>=1000&&n%1000===0)return(n/1000)+'K';return n.toLocaleString('id-ID')}
function fmtDT(s){if(!s)return'-';try{return new Date(s+'Z').toLocaleString('id-ID',{timeZone:'Asia/Jakarta'})}catch(e){return s}}
function statusLabel(st){var map={'pending_payment':'Menunggu Bayar','delivered':'Terkirim','needs_attention':'Perlu Perhatian','cancelled':'Dibatalkan','refunded':'Direfund'};return map[st]||st}
function statusColor(st){if(st==='delivered')return'var(--sage-600)';if(st==='cancelled'||st==='refunded')return'var(--brick-500)';if(st==='needs_attention')return'var(--choco-700)';return'var(--choco-500)'}
function loadOrders(){
var list=document.getElementById('orderList');
if(!list)return;
while(list.firstChild)list.removeChild(list.firstChild);
list.appendChild(ce('div','loading-state','Memuat pesanan...'));
var filter=document.getElementById('orderStatusFilter');
var st=filter?filter.value:'';
var url='/api/admin/orders?limit=50'+(st?'&status='+encodeURIComponent(st):'');
fetch(url,{headers:{'x-admin-password':sessionPass}}).then(function(r){return r.json()}).then(function(rows){
while(list.firstChild)list.removeChild(list.firstChild);
if(!rows.length){list.appendChild(ce('div','empty-state','Belum ada pesanan.'));return}
rows.forEach(function(o){
var row=ce('div','fs-item');
var info=ce('div','fs-item-info');
var title=ce('p','fs-item-name','Order #'+o.id+' — '+(o.username||('reseller #'+o.reseller_id)));
title.appendChild(ce('span','pkg-flash-badge',statusLabel(o.status)));
title.querySelector('.pkg-flash-badge').style.color=statusColor(o.status);
info.appendChild(title);
var sub=ce('p','fs-item-price','Total '+fmtIDR(o.total_amount)+' • '+o.provider+' • '+fmtDT(o.created_at));
info.appendChild(sub);
row.appendChild(info);
var act=ce('div','fs-item-actions');
var viewBtn=ce('button','fs-edit-btn','Detail');
viewBtn.setAttribute('type','button');
viewBtn.addEventListener('click',function(){openOrderDetail(o.id)});
act.appendChild(viewBtn);
row.appendChild(act);
list.appendChild(row);
});
}).catch(function(){while(list.firstChild)list.removeChild(list.firstChild);list.appendChild(ce('div','empty-state','Gagal memuat pesanan.'))});
}
function openOrderDetail(id){
fetch('/api/admin/orders/'+id,{headers:{'x-admin-password':sessionPass}}).then(function(r){return r.json()}).then(function(o){
orderCurrentDetail=o;
var sub=document.getElementById('orderDetailSub');
if(sub)sub.textContent='Order #'+o.id+' — '+statusLabel(o.status);
var body=document.getElementById('orderDetailBody');
if(!body)return;
while(body.firstChild)body.removeChild(body.firstChild);
var head=ce('div');
var grid=ce('div','checkout-fields-grid');
grid.style.display='grid';
var c1=ce('div','field');c1.appendChild(ce('label',null,'Reseller'));c1.appendChild(ce('p','fs-item-name',o.username||('#'+o.reseller_id)));
var c2=ce('div','field');c2.appendChild(ce('label',null,'Total'));c2.appendChild(ce('p','fs-item-name',fmtIDR(o.total_amount)));
var c3=ce('div','field');c3.appendChild(ce('label',null,'Provider'));c3.appendChild(ce('p','fs-item-name',o.provider));
var c4=ce('div','field');c4.appendChild(ce('label',null,'Status'));var sp=ce('p','fs-item-name',statusLabel(o.status));sp.style.color=statusColor(o.status);c4.appendChild(sp);
grid.appendChild(c1);grid.appendChild(c2);grid.appendChild(c3);grid.appendChild(c4);
head.appendChild(grid);
var dt=ce('div','field');dt.appendChild(ce('label',null,'Waktu'));
var timeBox=ce('div');
var t1=ce('p','fs-item-price','Dibuat: '+fmtDT(o.created_at));
var t2=ce('p','fs-item-price','Bayar: '+(o.paid_at?fmtDT(o.paid_at):'—'));
var t3=ce('p','fs-item-price','Terkirim: '+(o.delivered_at?fmtDT(o.delivered_at):'—'));
timeBox.appendChild(t1);timeBox.appendChild(t2);timeBox.appendChild(t3);
dt.appendChild(timeBox);
head.appendChild(dt);
body.appendChild(head);
body.appendChild(ce('h3','pkg-section-label','Item Pesanan'));
(o.items||[]).forEach(function(it){
var row=ce('div','fs-item');
var info=ce('div','fs-item-info');
info.appendChild(ce('p','fs-item-name',it.app_name+' • '+it.category+' • '+it.duration));
info.appendChild(ce('p','fs-item-price','qty '+it.qty+' × '+fmtIDR(it.unit_price)+' = '+fmtIDR(it.line_total)+' ('+it.fulfilled_qty+' fulfilled)'));
row.appendChild(info);
body.appendChild(row);
});
body.appendChild(ce('h3','pkg-section-label','Log Payment'));
if(o.payments&&o.payments.length){
o.payments.forEach(function(p){
var row=ce('div','fs-item');
var info=ce('div','fs-item-info');
info.appendChild(ce('p','fs-item-name',p.provider+' — '+p.status+(p.provider_tx_id?(' ('+p.provider_tx_id+')'):'')));
info.appendChild(ce('p','fs-item-price',fmtDT(p.created_at)+' • gross '+fmtIDR(p.gross_amount)));
row.appendChild(info);
body.appendChild(row);
});
}else body.appendChild(ce('div','empty-state','Belum ada log payment.'));
body.appendChild(ce('h3','pkg-section-label','Kredensial Terkirim'));
var creds=o.credentials||[];
if(creds.length){
creds.forEach(function(c){
var row=ce('div','fs-item');
var info=ce('div','fs-item-info');
info.appendChild(ce('p','fs-item-name',c.app_name+' • '+c.category+' • '+c.duration+(c.stock_id?(' — stock #'+c.stock_id):'')));
try{var obj=JSON.parse(c.fields||'{}');info.appendChild(ce('p','fs-item-price',Object.keys(obj).map(function(k){return k+'='+(obj[k]||'')} ).join(' | ')))}catch(e){info.appendChild(ce('p','fs-item-price','(data tidak valid)'))}
row.appendChild(info);
body.appendChild(row);
});
}else body.appendChild(ce('div','empty-state','Belum ada kredensial (order belum delivered).'));
var actWrap=ce('div');
actWrap.style.marginTop='1rem';
actWrap.style.display='flex';
actWrap.style.gap='.5rem';
actWrap.style.flexWrap='wrap';
if(o.status==='pending_payment'){
var btn=ce('button','submit-btn amber');btn.style.marginTop='0';btn.textContent='✓ Tandai Lunas (Fulfill)';
btn.addEventListener('click',function(){
if(!confirm('Tandai order #'+o.id+' sebagai lunas dan jalankan fulfillment?'))return;
btn.disabled=true;btn.textContent='Memproses...';
fetch('/api/admin/orders/'+o.id+'/settle',{method:'POST',headers:admHeaders()}).then(function(r){return r.json()}).then(function(res){
if(res.ok){closeOrderDetail();loadOrders();loadLowStock();alert('Order diproses. '+(res.reason==='stock'?'Stok tidak cukup → perlu perhatian.':'Sukses delivered.'))}
else alert('Gagal: '+res.reason);
btn.disabled=false;btn.textContent='✓ Tandai Lunas (Fulfill)';
}).catch(function(){btn.disabled=false;btn.textContent='✓ Tandai Lunas (Fulfill)';alert('Gagal.')});
});
actWrap.appendChild(btn);
}
if(o.status==='needs_attention'){
var btn=ce('button','submit-btn sky');btn.style.marginTop='0';btn.textContent='↻ Retry Fulfill';
btn.addEventListener('click',function(){
btn.disabled=true;btn.textContent='Memproses...';
fetch('/api/admin/orders/'+o.id+'/fulfill',{method:'POST',headers:admHeaders()}).then(function(r){return r.json()}).then(function(res){
if(res.ok){closeOrderDetail();loadOrders();loadLowStock();alert('Retry selesai. '+(res.reason==='stock'?'Masih kekurangan stok.':'Delivered.'))}
else alert('Gagal: '+res.reason);
btn.disabled=false;btn.textContent='↻ Retry Fulfill';
}).catch(function(){btn.disabled=false;btn.textContent='↻ Retry Fulfill';alert('Gagal.')});
});
actWrap.appendChild(btn);
var btnR=ce('button','submit-btn');btnR.style.marginTop='0';btnR.style.background='var(--brick-400)';btnR.style.color='var(--w)';btnR.textContent='↶ Refund';
btnR.addEventListener('click',function(){
var ret=confirm('Refund order #'+o.id+'? Klik OK untuk refund TANPA mengembalikan stok, atau batal lalu pilih opsi lain.');
btnR.disabled=true;btnR.textContent='Memproses...';
fetch('/api/admin/orders/'+o.id+'/refund',{method:'POST',headers:admHeaders(),body:JSON.stringify({return_stock:!!ret})}).then(function(r){return r.json()}).then(function(res){
if(res.ok){closeOrderDetail();loadOrders();loadLowStock();alert('Order di-refund.')}
else alert('Gagal: '+res.reason);
btnR.disabled=false;btnR.textContent='↶ Refund';
}).catch(function(){btnR.disabled=false;btnR.textContent='↶ Refund';alert('Gagal.')});
});
actWrap.appendChild(btnR);
}
if(actWrap.childNodes.length)body.appendChild(actWrap);
var modal=document.getElementById('orderDetailModal');
if(modal)modal.classList.remove('hidden');
}).catch(function(){alert('Gagal memuat detail order.')});
}
function closeOrderDetail(){
var modal=document.getElementById('orderDetailModal');
if(modal)modal.classList.add('hidden');
orderCurrentDetail=null;
}
document.addEventListener('DOMContentLoaded',function(){
var btnRef=document.getElementById('btnRefreshOrders');
if(btnRef)btnRef.addEventListener('click',loadOrders);
var filt=document.getElementById('orderStatusFilter');
if(filt)filt.addEventListener('change',loadOrders);
var close=document.getElementById('orderDetailClose');
if(close)close.addEventListener('click',closeOrderDetail);
var bd=document.getElementById('orderDetailBackdrop');
if(bd)bd.addEventListener('click',closeOrderDetail);
});
