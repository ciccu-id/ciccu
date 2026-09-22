var DASH_TIMER=null;
function dashHeaders(){return{'x-admin-password':sessionPass}}
function fmtRpFull(n){n=n||0;return'Rp '+Number(n).toLocaleString('id-ID')}
function fmtRpShort(n){n=n||0;if(n>=1e9)return'Rp '+(n/1e9).toFixed(1)+' M';if(n>=1e6)return'Rp '+(n/1e6).toFixed(1)+' jt';if(n>=1e3)return'Rp '+Math.round(n/1e3)+' rb';return'Rp '+n}
function pad2(n){return String(n).padStart(2,'0')}
function relTime(s){
var t=Date.parse(String(s||'').replace(' ','T')+'Z');
if(isNaN(t))return'-';
var diff=Date.now()-t;
if(diff<0)diff=0;
var m=Math.floor(diff/60000);
if(m<1)return'baru';
if(m<60)return m+' mnt';
var h=Math.floor(m/60);
if(h<24)return h+' jam';
var d=Math.floor(h/24);
return d+' hri';
}
function fmtDTshort(s){
if(!s)return'-';
var d=new Date(s);
if(isNaN(d))return s;
return d.toLocaleDateString('id-ID',{day:'numeric',month:'short'})+' • '+d.toLocaleTimeString('id-ID',{hour:'2-digit',minute:'2-digit'});
}
function goRes(sub){
if(typeof switchTab==='function')switchTab(sub);
}
function setText(id,v){var el=document.getElementById(id);if(el)el.textContent=v}
function loadDashboard(){
if(!sessionPass)return;
var d=new Date();
setText('dashDate',d.toLocaleDateString('id-ID',{day:'numeric',month:'long',year:'numeric'}));
fetch('/api/admin/stats',{headers:dashHeaders()}).then(function(r){return r.json()}).then(function(s){
if(!s||s.error)return;
renderDashStats(s);
renderDashOrders(s.recent_orders||[]);
renderDashLowStock(s.low_stock||[]);
renderDashFlash(s.flash_sale||{});
}).catch(function(e){console.error('Dashboard load error',e)});
}
function renderDashStats(s){
var o=s.orders||{};
setText('statOrders',(o.total||0).toLocaleString('id-ID'));
setText('statOrdersSub',(o.delivered||0)+' selesai • '+(o.pending||0)+' menunggu');
setText('statRevenue',fmtRpShort(s.revenue||0));
setText('statRevenueSub',fmtRpFull(s.revenue||0));
var st=s.stock||{};
setText('statStock',(st.available||0).toLocaleString('id-ID'));
setText('statStockSub','unit siap kirim');
setText('statLow',(st.low||0).toLocaleString('id-ID'));
var lowSub=document.getElementById('statLowSub');
if(lowSub){lowSub.textContent=(st.low>0)?'varian perlu restock':'semua stok aman';lowSub.className='stat-sub'+(st.low>0?' red':'')}
}
function renderDashOrders(rows){
var tb=document.getElementById('dashOrdersBody');
if(!tb)return;
while(tb.firstChild)tb.removeChild(tb.firstChild);
if(!rows.length){
var tr0=document.createElement('tr');
var td0=document.createElement('td');
td0.setAttribute('colspan','5');
td0.style.textAlign='center';
td0.style.color='var(--choco-400)';
td0.textContent='Belum ada order.';
tr0.appendChild(td0);tb.appendChild(tr0);return;
}
rows.forEach(function(r){
var tr=document.createElement('tr');
var c1=document.createElement('td');
var oid=document.createElement('span');oid.className='order-id';oid.textContent='#'+r.id;c1.appendChild(oid);
tr.appendChild(c1);
var c2=document.createElement('td');
var wrap=document.createElement('span');wrap.className='mini-avatar';
var circ=document.createElement('span');circ.className='mini-circle';
var uname=r.username||'?';
circ.textContent=uname.slice(0,2).toUpperCase();
var info=document.createElement('span');info.className='mini-info';
var nm=document.createElement('span');nm.className='mini-name';nm.textContent=uname;
info.appendChild(nm);
wrap.appendChild(circ);wrap.appendChild(info);
c2.appendChild(wrap);tr.appendChild(c2);
var c3=document.createElement('td');c3.textContent=fmtRpFull(r.total_amount);tr.appendChild(c3);
var c4=document.createElement('td');
var pill=document.createElement('span');
var map={delivered:['Selesai','green'],pending_payment:['Menunggu','amber'],needs_attention:['Perhatian','amber'],cancelled:['Dibatalkan','gray'],refunded:['Refund','red']};
var m=map[r.status]||[r.status,'gray'];
pill.className='pill '+m[1];pill.textContent=m[0];
c4.appendChild(pill);tr.appendChild(c4);
var c5=document.createElement('td');
var tm=document.createElement('span');tm.className='order-time';tm.textContent=relTime(r.created_at);
c5.appendChild(tm);tr.appendChild(c5);
tb.appendChild(tr);
});
}
function renderDashLowStock(rows){
var box=document.getElementById('dashLowStockBody');
if(!box)return;
while(box.firstChild)box.removeChild(box.firstChild);
if(!rows.length){box.appendChild(ce('div','flash-box-empty','Semua stok aman 👍'));return}
rows.forEach(function(r){
var row=ce('div','stock-row');
var info=ce('div','stock-row-info');
info.appendChild(ce('div','stock-row-name',r.app_name+' • '+r.duration));
info.appendChild(ce('div','stock-row-meta',r.category));
row.appendChild(info);
var cnt=ce('span','stock-row-count'+((r.avail<=5)?' low':''),String(r.avail));
row.appendChild(cnt);
var badge=ce('span','pill '+(r.avail===0?'red':(r.avail<=5?'amber':'green')),r.avail===0?'Habis':(r.avail<=5?'Rendah':'Aman'));
row.appendChild(badge);
box.appendChild(row);
});
}
function renderDashFlash(f){
var box=document.getElementById('dashFlashBody');
if(!box)return;
while(box.firstChild)box.removeChild(box.firstChild);
if(DASH_TIMER){clearInterval(DASH_TIMER);DASH_TIMER=null}
if(!f||(!f.name&&!f.start)){box.appendChild(ce('div','flash-box-empty','Belum ada flash sale.'));return}
box.appendChild(ce('div','flash-name',f.name||'Flash Sale'));
var st=ce('div','flash-status');
if(f.active){st.appendChild(ce('span','flash-live','LIVE'));st.appendChild(ce('span',null,'Berakhir dalam:'))}
else{st.appendChild(ce('span','pill gray','Tidak aktif'))}
box.appendChild(st);
if(f.active&&f.end){
var cd=ce('div','flash-cd');cd.id='dashFlashCd';box.appendChild(cd);
startFlashTimer(f.end);
}else if(f.start&&f.end){
box.appendChild(ce('div','flash-end','Jadwal: '+fmtDTshort(f.start)+' → '+fmtDTshort(f.end)));
}
box.appendChild(ce('div','flash-end',(f.items||0)+' item terdaftar'));
}
function startFlashTimer(endStr){
var el=document.getElementById('dashFlashCd');
if(!el||!endStr)return;
var end=Date.parse(endStr);
if(isNaN(end))return;
function tick(){
var diff=end-Date.now();
if(diff<=0){el.textContent='00 : 00 : 00';clearInterval(DASH_TIMER);DASH_TIMER=null;return}
var hh=Math.floor(diff/3600000);
var mm=Math.floor((diff%3600000)/60000);
var ss=Math.floor((diff%60000)/1000);
el.textContent=pad2(hh)+' : '+pad2(mm)+' : '+pad2(ss);
}
tick();
DASH_TIMER=setInterval(tick,1000);
}
document.addEventListener('DOMContentLoaded',function(){
var binds={
'dashOrdersAll':function(){goRes('rorders')},
'dashStockAll':function(){goRes('rprice')},
'dashFlashAll':function(){if(typeof switchTab==='function')switchTab('flashsale')},
'quickAddPublic':function(){if(typeof switchTab==='function')switchTab('produk')},
'quickAddReseller':function(){goRes('rprice');if(typeof openRvarEdit==='function')openRvarEdit(null,'')},
'quickAddStock':function(){goRes('rprice')},
'quickSettings':function(){if(typeof switchTab==='function')switchTab('pengaturan')},
'mod-produk':function(){if(typeof switchTab==='function')switchTab('produk')},
'mod-rprice':function(){goRes('rprice')},
'mod-flashsale':function(){if(typeof switchTab==='function')switchTab('flashsale')},
'mod-rorders':function(){goRes('rorders')},
'mod-pengaturan':function(){if(typeof switchTab==='function')switchTab('pengaturan')},
'mod-activity':function(){if(typeof switchTab==='function')switchTab('activity')}
};
Object.keys(binds).forEach(function(id){
var el=document.getElementById(id);
if(el)el.addEventListener('click',function(){binds[id]()});
});
});
