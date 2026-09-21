var RES_ORDER_LOADED={};
function resMask(v){v=String(v==null?'':v);if(!v)return'';if(v.length<=4)return'•'.repeat(v.length);return v.slice(0,2)+'•'.repeat(Math.min(10,v.length-4))+v.slice(-2)}
function resCopy(txt){
if(navigator.clipboard&&navigator.clipboard.writeText){navigator.clipboard.writeText(txt).then(function(){resToast('Disalin.')},function(){resCopyFallback(txt)});return}
resCopyFallback(txt);
}
function resCopyFallback(txt){
var ta=ce('textarea');ta.value=txt;ta.style.position='fixed';ta.style.opacity='0';document.body.appendChild(ta);ta.select();
try{document.execCommand('copy');resToast('Disalin.')}catch(e){resToast('Gagal menyalin.')}
document.body.removeChild(ta);
}
function resOrderStatusClass(st){return'r-status '+String(st||'').replace(/[^a-z_]/g,'')}
function renderOrderItems(holder,o){
while(holder.firstChild)holder.removeChild(holder.firstChild);
var wrap=ce('div','r-order-items');
(o.items||[]).forEach(function(it){
var row=ce('p','r-oi');
row.appendChild(document.createTextNode(it.app_name+' • '+it.category+' • '+it.duration+' '));
row.appendChild(ce('small',null,'qty '+it.qty+' × '+resFmt(it.unit_price)));
wrap.appendChild(row);
});
if(o.status==='pending_payment')wrap.appendChild(ce('p','r-oi','⏳ Menunggu pembayaran / verifikasi.'));
if(o.status==='needs_attention')wrap.appendChild(ce('p','r-oi','⚠️ Pesanan perlu perhatian admin (biasanya restok). Mohon tunggu.'));
if(o.status==='delivered'){
var btn=ce('button','r-mini-btn mint','🔑 Muat Data Akses');
btn.setAttribute('type','button');
btn.addEventListener('click',function(){btn.disabled=true;btn.textContent='Memuat...';revealOrder(o.id,wrap,btn)});
wrap.appendChild(btn);
}
holder.appendChild(wrap);
}
function revealOrder(orderId,wrap,btn){
resApi('/api/reseller/orders/'+orderId+'/reveal',{method:'POST'})
.then(function(groups){
if(groups&&groups.error){resToast(groups.error);if(btn){btn.disabled=false;btn.textContent='🔑 Muat Data Akses'}return}
if(btn)btn.remove();
(groups||[]).forEach(function(g){
(g.credentials||[]).forEach(function(cr,ci){
var fields=cr.fields||{};
var keys=Object.keys(fields);
var block=ce('div','r-cred');
block.appendChild(ce('p','r-cred-title',g.app_name+' • '+g.category+' • '+g.duration+' — Akun #'+(ci+1)));
var revealed=false;
var rows=[];
keys.forEach(function(k){
var row=ce('div','r-cred-row');
row.appendChild(ce('span',null,k));
var val=ce('span','r-cred-val',resMask(fields[k]));
row.appendChild(val);
rows.push({val:val,real:fields[k]});
block.appendChild(row);
});
var acts=ce('div','r-cred-actions');
var see=ce('button','r-mini-btn','Lihat');
see.setAttribute('type','button');
see.addEventListener('click',function(){
revealed=!revealed;
rows.forEach(function(r){r.val.textContent=revealed?r.real:resMask(r.real)});
see.textContent=revealed?'Tutup':'Lihat';
});
acts.appendChild(see);
var copy=ce('button','r-mini-btn','Salin');
copy.setAttribute('type','button');
copy.addEventListener('click',function(){resCopy(keys.map(function(k){return k+': '+fields[k]}).join('\n'))});
acts.appendChild(copy);
block.appendChild(acts);
wrap.appendChild(block);
});
});
resToast('Data akses dimuat.');
})
.catch(function(e){if(e&&e.message==='unauthorized')return;if(btn){btn.disabled=false;btn.textContent='🔑 Muat Data Akses'}resToast('Gagal memuat data.')});
}
function renderOrderCard(o){
var card=ce('div','r-order');
var head=ce('div','r-order-head');
head.appendChild(ce('span','r-order-id','Order #'+o.id));
head.appendChild(ce('span',resOrderStatusClass(o.status),resStatusText(o.status)));
card.appendChild(head);
card.appendChild(ce('p','r-order-meta','Total '+resFmt(o.total_amount)+' • '+o.provider+' • '+o.created_at));
var holder=ce('div');
card.appendChild(holder);
var toggle=ce('button','r-mini-btn','Detail');
toggle.setAttribute('type','button');
toggle.style.marginTop='.5rem';
var open=false;
toggle.addEventListener('click',function(){
open=!open;
if(open){
if(RES_ORDER_LOADED[o.id]){renderOrderItems(holder,RES_ORDER_LOADED[o.id])}
else{
holder.appendChild(ce('div','r-loading','Memuat...'));
resApi('/api/reseller/orders/'+o.id).then(function(d){
if(d&&d.error){resToast(d.error);return}
RES_ORDER_LOADED[o.id]=d;
renderOrderItems(holder,d);
}).catch(function(e){if(e&&e.message==='unauthorized')return;resToast('Gagal memuat detail.')});
}
toggle.textContent='Tutup';
}else{
while(holder.firstChild)holder.removeChild(holder.firstChild);
toggle.textContent='Detail';
}
});
card.appendChild(toggle);
return card;
}
function resRenderOrders(container){
var label=ce('p','r-section-label','Pesanan Saya');
container.appendChild(label);
var bar=ce('div','r-cat-bar');
var ref=ce('button','r-cat-btn','↻ Refresh');
ref.setAttribute('type','button');
ref.addEventListener('click',function(){RES_ORDER_LOADED={};resRenderOrders(container)});
bar.appendChild(ref);
container.appendChild(bar);
var list=ce('div');
list.appendChild(ce('div','r-loading','Memuat pesanan...'));
container.appendChild(list);
resApi('/api/reseller/orders?limit=50').then(function(rows){
while(list.firstChild)list.removeChild(list.firstChild);
if(!rows||!rows.length){list.appendChild(ce('div','r-empty','Belum ada pesanan. Yuk belanja dulu di tab Toko.'));return}
rows.forEach(function(o){list.appendChild(renderOrderCard(o))});
}).catch(function(e){
if(e&&e.message==='unauthorized')return;
while(list.firstChild)list.removeChild(list.firstChild);
list.appendChild(ce('div','r-empty','Gagal memuat pesanan.'));
});
}
