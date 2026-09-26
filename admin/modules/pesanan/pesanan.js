(function(M){
var root=null,ddStatus=null,ddRange=null,offset=0,limit=20,loaded=[],search='',searchTimer=null;
function query(){
var u='/api/admin/orders?limit='+limit+'&offset='+offset;
var sv=ddStatus?ddStatus.get():'';
var rv=ddRange?ddRange.get():'';
if(sv)u+='&status='+encodeURIComponent(sv);
if(rv)u+='&range='+encodeURIComponent(rv);
if(search)u+='&q='+encodeURIComponent(search);
return u;
}
function syncActive(){
if(ddStatus)ddStatus.el.classList.toggle('dd-active',!!ddStatus.get());
if(ddRange)ddRange.el.classList.toggle('dd-active',!!ddRange.get());
}
function buildFilters(){
ddStatus=DD.build({options:[{value:'',label:'Semua Status'},{value:'pending_payment',label:'Menunggu'},{value:'delivered',label:'Terkirim'},{value:'needs_attention',label:'Perhatian'},{value:'cancelled',label:'Dibatalkan'},{value:'refunded',label:'Refund'}],value:'',cls:'ord-dd ord-dd-icon',leading:admSvg('M22 3H2l8 9.46V19l4 2v-8.54L22 3z','1rem','1rem'),onChange:function(){syncActive();load(true)}});
ddRange=DD.build({options:[{value:'',label:'Semua Waktu'},{value:'today',label:'Hari Ini'},{value:'7d',label:'7 Hari'},{value:'30d',label:'30 Hari'}],value:'',cls:'ord-dd ord-dd-icon',leading:admSvg('M12 3a8.5 8.5 0 1 0 0 17 8.5 8.5 0 0 0 0-17zM12 7.5V12l3 1.8','1rem','1rem'),onChange:function(){syncActive();load(true)}});
var ss=document.getElementById('orderStatusSlot');if(ss)ss.appendChild(ddStatus.el);
var sr=document.getElementById('orderRangeSlot');if(sr)sr.appendChild(ddRange.el);
syncActive();
}
function load(reset){
if(reset){offset=0;loaded=[]}
var list=document.getElementById('orderList');
if(!list)return Promise.resolve();
if(reset){while(list.firstChild)list.removeChild(list.firstChild);list.appendChild(ce('div','loading-state','Memuat pesanan...'))}
return Sec.json(query()).then(function(rows){
if(reset){while(list.firstChild)list.removeChild(list.firstChild)}
rows=rows||[];
rows.forEach(function(o){loaded.push(o);list.appendChild(M.buildCard(o))});
var more=document.getElementById('btnOrdersMore');
if(more)more.classList.toggle('hidden',rows.length<limit);
if(!loaded.length&&reset)list.appendChild(ce('div','empty-state','Tidak ada pesanan yang cocok.'));
}).catch(function(){
if(reset){while(list.firstChild)list.removeChild(list.firstChild);list.appendChild(ce('div','empty-state','Gagal memuat pesanan.'))}
});
}
function init(host){
root=host;
root.appendChild(M.view());
buildFilters();
M.startCd(root);
var se=document.getElementById('orderSearchInput');
if(se)se.addEventListener('input',debounce(function(){search=String(se.value||'').trim();load(true)},300));
var rf=document.getElementById('btnRefreshOrders');
if(rf)rf.addEventListener('click',function(){load(true)});
var more=document.getElementById('btnOrdersMore');
if(more)more.addEventListener('click',function(){offset+=limit;load(false)});
return load(true);
}
function destroy(){root=null}
M.init=init;
M.destroy=destroy;
M.loadOrders=function(){load(true)};
})(AdminModules.pesanan=AdminModules.pesanan||{});
