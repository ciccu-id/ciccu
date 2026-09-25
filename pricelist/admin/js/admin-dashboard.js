var DASH_TIMER=null;
function dashHeaders(){return{'x-admin-password':sessionPass}}
function fmtRpFull(n){n=n||0;return'Rp '+Number(n).toLocaleString('id-ID')}
function fmtRpShort(n){n=n||0;if(n>=1e9)return'Rp '+(n/1e9).toFixed(1)+' M';if(n>=1e6)return'Rp '+(n/1e6).toFixed(1)+' jt';if(n>=1e3)return'Rp '+Math.round(n/1e3)+' rb';return'Rp '+n}
function pad2(n){return String(n).padStart(2,'0')}
function relTime(s){var t=Date.parse(String(s||'').replace(' ','T')+'Z');if(isNaN(t))return'-';var diff=Date.now()-t;if(diff<0)diff=0;var m=Math.floor(diff/60000);if(m<1)return'baru';if(m<60)return m+' mnt';var h=Math.floor(m/60);if(h<24)return h+' jam';var d=Math.floor(h/24);return d+' hri'}
function fmtDTshort(s){if(!s)return'-';var d=new Date(s);if(isNaN(d))return s;return d.toLocaleDateString('id-ID',{day:'numeric',month:'short'})+' • '+d.toLocaleTimeString('id-ID',{hour:'2-digit',minute:'2-digit'})}
function goRes(sub){if(typeof switchTab==='function')switchTab(sub)}
function setText(id,v){var el=document.getElementById(id);if(el)el.textContent=v}
function dashSvg(d){var NS='http://www.w3.org/2000/svg';var s=document.createElementNS(NS,'svg');s.setAttribute('viewBox','0 0 24 24');s.setAttribute('fill','none');s.setAttribute('stroke','currentColor');s.setAttribute('stroke-width','2');s.setAttribute('stroke-linecap','round');s.setAttribute('stroke-linejoin','round');var p=document.createElementNS(NS,'path');p.setAttribute('d',d);s.appendChild(p);return s}
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
if(lowSub){lowSub.textContent=(st.low>0)?'varian perlu restock':'semua stok aman';lowSub.className='ds-s'+(st.low>0?' warn':' ok')}
}
function renderDashOrders(rows){
var tb=document.getElementById('dashOrdersTable');
if(!tb)return;
var olds=tb.querySelectorAll('.dp-tr,.dp-empty');
for(var i=0;i<olds.length;i++)olds[i].remove();
if(!rows.length){
var e=ce('div','dp-empty','Belum ada order.');
e.style.gridColumn='1/-1';e.style.textAlign='center';e.style.padding='1rem 0';e.style.color='var(--choco-400)';e.style.fontSize='.7rem';e.style.fontWeight='700';
tb.appendChild(e);return;
}
var map={delivered:['SELESAI','ok'],pending_payment:['MENUNGGU','amber'],needs_attention:['PERHATIAN','bad'],cancelled:['BATAL','off'],refunded:['REFUND','bad']};
rows.forEach(function(r){
var tr=ce('div','dp-tr');
tr.appendChild(ce('span','oid','#'+r.id));
var c2=ce('span');
c2.appendChild(ce('i','dp-ava',(r.username||'?').slice(0,2).toUpperCase()));
c2.appendChild(document.createTextNode(r.username||'?'));
tr.appendChild(c2);
tr.appendChild(ce('span','tot',fmtRpFull(r.total_amount)));
var c4=ce('span');
var m=map[r.status]||[r.status,'off'];
c4.appendChild(ce('span','dp-chip '+m[1],m[0]));
tr.appendChild(c4);
tr.appendChild(ce('span',null,relTime(r.created_at)));
tb.appendChild(tr);
});
}
function renderDashLowStock(rows){
var box=document.getElementById('dashLowStockBody');
if(!box)return;
while(box.firstChild)box.removeChild(box.firstChild);
if(!rows.length){
var ok=ce('div','dp-srow');
var ol=ce('div');
ol.appendChild(ce('b',null,'Semua stok aman'));
ol.appendChild(ce('small',null,'TIDAK ADA YANG PERLU RESTOCK'));
ok.appendChild(ol);
var orr=ce('div','dp-srow-r');
orr.appendChild(ce('span','dp-chip ok','AMAN'));
ok.appendChild(orr);
box.appendChild(ok);
return;
}
rows.forEach(function(r){
var row=ce('div','dp-srow');
var l=ce('div');
l.appendChild(ce('b',null,r.app_name+' • '+r.duration));
l.appendChild(ce('small',null,r.category));
row.appendChild(l);
var rt=ce('div','dp-srow-r');
rt.appendChild(ce('span','n',String(r.avail)));
rt.appendChild(ce('span','dp-chip '+(r.avail===0?'bad':(r.avail<=5?'amber':'ok')),r.avail===0?'HABIS':(r.avail<=5?'RENDAH':'AMAN')));
row.appendChild(rt);
box.appendChild(row);
});
}
function renderDashFlash(f){
var box=document.getElementById('dashFlashBody');
if(!box)return;
while(box.firstChild)box.removeChild(box.firstChild);
if(DASH_TIMER){clearInterval(DASH_TIMER);DASH_TIMER=null}
if(!f||!f.active){
var em=ce('div','dp-fs-empty');
var ic=ce('span','dp-fs-ic');
ic.appendChild(dashSvg('M13 2 4 14h6l-1 8 9-12h-6z'));
em.appendChild(ic);
em.appendChild(ce('b',null,'Belum ada flash sale berjalan'));
em.appendChild(ce('p',null,(f&&f.items?f.items:0)+' item terdaftar siap dipromosikan. Aktifkan flash sale untuk menarik lebih banyak pembeli hari ini.'));
var act=ce('div','dp-fs-act');
var b1=ce('button','dp-btn-fs','Aktifkan Flash Sale');
b1.type='button';
b1.addEventListener('click',function(){if(typeof switchTab==='function')switchTab('flashsale')});
var b2=ce('button','dp-btn-fs2','Lihat '+(f&&f.items?f.items:0)+' Item');
b2.type='button';
b2.addEventListener('click',function(){if(typeof switchTab==='function')switchTab('flashsale')});
act.appendChild(b1);act.appendChild(b2);
em.appendChild(act);
box.appendChild(em);
return;
}
var lv=ce('div','dp-fs-live');
lv.appendChild(ce('div','dp-fs-name',f.name||'Flash Sale'));
var st=ce('div','dp-fs-status');
st.appendChild(ce('span','dp-fs-live-pill','LIVE'));
st.appendChild(document.createTextNode('Berakhir dalam:'));
lv.appendChild(st);
var cd=ce('div','dp-fs-cd');
cd.id='dashFlashCd';
lv.appendChild(cd);
lv.appendChild(ce('div','dp-fs-end','Jadwal: '+fmtDTshort(f.start)+' → '+fmtDTshort(f.end)+' • '+(f.items||0)+' item'));
box.appendChild(lv);
startFlashTimer(f.end);
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
