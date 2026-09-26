(function(M){
var root=null,flashTimer=null;
function fmtRpFull(n){return'Rp '+Number(n||0).toLocaleString('id-ID')}
function fmtRpShort(n){n=n||0;if(n>=1e9)return'Rp '+(n/1e9).toFixed(1)+' M';if(n>=1e6)return'Rp '+(n/1e6).toFixed(1)+' jt';if(n>=1e3)return'Rp '+Math.round(n/1e3)+' rb';return'Rp '+n}
function pad2(n){return String(n).padStart(2,'0')}
function fmtDTshort(s){
if(!s)return'-';
var t=Date.parse(String(s||'').replace(' ','T')+'Z');
if(isNaN(t))return s;
var d=new Date(t);
return d.toLocaleDateString('id-ID',{day:'numeric',month:'short'})+' • '+d.toLocaleTimeString('id-ID',{hour:'2-digit',minute:'2-digit'});
}
function setText(id,v){var el=document.getElementById(id);if(el)el.textContent=v}
function stopFlashTimer(){
if(flashTimer){clearInterval(flashTimer);flashTimer=null}
}
function startFlashTimer(endStr){
var el=document.getElementById('berandaFlashCd');
if(!el||!endStr)return;
var end=Date.parse(endStr);
if(isNaN(end))return;
function tick(){
var diff=end-Date.now();
if(diff<=0){el.textContent='00 : 00 : 00';stopFlashTimer();return}
var hh=Math.floor(diff/3600000);
var mm=Math.floor((diff%3600000)/60000);
var ss=Math.floor((diff%60000)/1000);
el.textContent=pad2(hh)+' : '+pad2(mm)+' : '+pad2(ss);
}
tick();
flashTimer=setInterval(tick,1000);
}
function renderStats(s){
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
if(lowSub){
lowSub.textContent=(st.low>0)?'varian perlu restock':'semua stok aman';
lowSub.className='bs-s'+(st.low>0?' warn':' ok');
}
}
function renderOrders(rows){
var tb=document.getElementById('berandaOrdersTable');
if(!tb)return;
var olds=tb.querySelectorAll('.bp-tr,.bp-empty');
for(var i=0;i<olds.length;i++)olds[i].remove();
if(!rows.length){
var e=ce('div','bp-empty','Belum ada order.');
e.style.cssText='grid-column:1/-1;text-align:center;padding:1rem 0;color:var(--choco-400);font-size:.7rem;font-weight:700';
tb.appendChild(e);
return;
}
var map={delivered:['SELESAI','ok'],pending_payment:['MENUNGGU','amber'],needs_attention:['PERHATIAN','bad'],cancelled:['BATAL','off'],refunded:['REFUND','bad']};
rows.forEach(function(r){
var tr=ce('div','bp-tr');
tr.appendChild(ce('span','oid',r.order_code||('#'+r.id)));
var c2=ce('span');
c2.appendChild(ce('i','bp-ava',(r.username||'?').slice(0,2).toUpperCase()));
c2.appendChild(document.createTextNode(r.username||'?'));
tr.appendChild(c2);
tr.appendChild(ce('span','tot',fmtRpFull(r.total_amount)));
var c4=ce('span');
var m=map[r.status]||[r.status,'off'];
c4.appendChild(ce('span','bp-chip '+m[1],m[0]));
tr.appendChild(c4);
tr.appendChild(ce('span','when',fmtDTshort(r.created_at)));
tb.appendChild(tr);
});
}
function renderLowStock(rows){
var box=document.getElementById('berandaLowStockBody');
if(!box)return;
while(box.firstChild)box.removeChild(box.firstChild);
if(!rows.length){
var ok=ce('div','bp-srow');
var ol=ce('div');
ol.appendChild(ce('b',null,'Semua stok aman'));
ol.appendChild(ce('small',null,'TIDAK ADA YANG PERLU RESTOCK'));
ok.appendChild(ol);
var orr=ce('div','bp-srow-r');
orr.appendChild(ce('span','bp-chip ok','AMAN'));
ok.appendChild(orr);
box.appendChild(ok);
return;
}
rows.forEach(function(r){
var row=ce('div','bp-srow');
var l=ce('div');
l.appendChild(ce('b',null,r.app_name+' • '+r.duration));
l.appendChild(ce('small',null,r.category));
row.appendChild(l);
var rt=ce('div','bp-srow-r');
rt.appendChild(ce('span','n',String(r.avail)));
rt.appendChild(ce('span','bp-chip '+(r.avail===0?'bad':(r.avail<=5?'amber':'ok')),r.avail===0?'HABIS':(r.avail<=5?'RENDAH':'AMAN')));
row.appendChild(rt);
box.appendChild(row);
});
}
function renderFlash(f){
var box=document.getElementById('berandaFlashBody');
if(!box)return;
while(box.firstChild)box.removeChild(box.firstChild);
stopFlashTimer();
if(!f||!f.active){
var em=ce('div','bp-fs-empty');
var ic=ce('span','bp-fs-ic');
ic.appendChild(admSvg('M13 2 4 14h6l-1 8 9-12h-6z'));
em.appendChild(ic);
em.appendChild(ce('b',null,'Belum ada flash sale berjalan'));
em.appendChild(ce('p',null,(f&&f.items?f.items:0)+' item terdaftar siap dipromosikan. Aktifkan flash sale untuk menarik lebih banyak pembeli hari ini.'));
var act=ce('div','bp-fs-act');
var b1=ce('button','bp-btn-fs','Aktifkan Flash Sale');b1.type='button';
b1.addEventListener('click',function(){Router.go('flashsale')});
var b2=ce('button','bp-btn-fs2','Lihat '+(f&&f.items?f.items:0)+' Item');b2.type='button';
b2.addEventListener('click',function(){Router.go('flashsale')});
act.appendChild(b1);act.appendChild(b2);
em.appendChild(act);
box.appendChild(em);
return;
}
var lv=ce('div','bp-fs-live');
lv.appendChild(ce('div','bp-fs-name',f.name||'Flash Sale'));
var st=ce('div','bp-fs-status');
st.appendChild(ce('span','bp-fs-live-pill','LIVE'));
st.appendChild(document.createTextNode('Berakhir dalam:'));
lv.appendChild(st);
var cd=ce('div','bp-fs-cd');
cd.id='berandaFlashCd';
lv.appendChild(cd);
lv.appendChild(ce('div','bp-fs-end','Jadwal: '+fmtDTshort(f.start)+' → '+fmtDTshort(f.end)+' • '+(f.items||0)+' item'));
box.appendChild(lv);
startFlashTimer(f.end);
}
function loadData(){
var d=new Date();
setText('berandaDate',d.toLocaleDateString('id-ID',{day:'numeric',month:'long',year:'numeric'}));
return Sec.json('/api/admin/stats').then(function(s){
if(!s||s.error)return;
renderStats(s);
renderOrders(s.recent_orders||[]);
renderLowStock(s.low_stock||[]);
renderFlash(s.flash_sale||{});
}).catch(function(){});
}
function bindLinks(){
var binds={
berandaOrdersAll:'pesanan',
berandaStockAll:'reseller',
berandaFlashAll:'flashsale',
quickAddPublic:'public',
quickAddReseller:'reseller',
quickAddStock:'reseller',
quickSettings:'pengaturan'
};
Object.keys(binds).forEach(function(id){
var el=document.getElementById(id);
if(el)el.addEventListener('click',function(){Router.go(binds[id])});
});
if(root){
root.addEventListener('click',function(e){
var t=e.target.closest('[data-route]');
if(t)Router.go(t.getAttribute('data-route'));
});
}
}
function init(host){
root=host;
root.appendChild(M.view());
bindLinks();
return loadData();
}
function destroy(){
stopFlashTimer();
root=null;
}
M.init=init;
M.destroy=destroy;
})(AdminModules.beranda=AdminModules.beranda||{});
