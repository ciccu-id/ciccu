(function(M){
var root=null;
var soldApi=null,payApi=null,ordersApi=null,auditApi=null,revApi=null;
var RANGE=[{value:'',label:'Semua Waktu'},{value:'today',label:'Hari Ini'},{value:'7d',label:'7 Hari'},{value:'30d',label:'30 Hari'}];
var ORDER_STATUS=[{value:'',label:'Semua Status'},{value:'pending_payment',label:'Menunggu'},{value:'delivered',label:'Terkirim'},{value:'needs_attention',label:'Perhatian'},{value:'cancelled',label:'Dibatalkan'},{value:'refunded',label:'Refund'}];
var PAY_STATUS=[{value:'',label:'Semua Transaksi'},{value:'settle',label:'Settle'},{value:'refund',label:'Refund'},{value:'pending',label:'Pending'},{value:'created',label:'Created'}];
var ACTOR_TYPE=[{value:'',label:'Semua Aktor'},{value:'admin',label:'Admin'},{value:'reseller',label:'Reseller'},{value:'guest',label:'Guest'},{value:'system',label:'System'}];
function pad2(n){return String(n).padStart(2,'0')}
function fmtDT(s){if(!s)return'-';var t=Date.parse(String(s).replace(' ','T')+'Z');if(isNaN(t))return String(s);var d=new Date(t);return d.toLocaleDateString('id-ID',{day:'2-digit',month:'short',year:'2-digit'})+' '+pad2(d.getHours())+':'+pad2(d.getMinutes())}
function fmtRp(n){return'Rp '+Number(n||0).toLocaleString('id-ID')}
function fmtRpShort(n){n=Number(n||0);if(n>=1e9)return'Rp '+(n/1e9).toFixed(1)+' M';if(n>=1e6)return'Rp '+(n/1e6).toFixed(1)+' jt';if(n>=1e3)return'Rp '+Math.round(n/1e3)+' rb';return'Rp '+n}
function clear(n){while(n&&n.firstChild)n.removeChild(n.firstChild)}
function kv(l,v,mono){var r=ce('div','rekap-row');r.appendChild(ce('span','rekap-label',l));r.appendChild(ce('span','rekap-value'+(mono?' rekap-money':''),String(v==null||v===''?'-':v)));return r}
function chip(t,m){return ce('span','rekap-chip '+m,t)}
function orderChip(s){var m={delivered:['TERKIRIM','ok'],pending_payment:['MENUNGGU','amber'],needs_attention:['PERHATIAN','bad'],cancelled:['BATAL','gray'],refunded:['REFUND','bad']};var x=m[s]||[String(s||'-'),'gray'];return chip(x[0],x[1])}
function payChip(s){var m={settle:['SETTLE','ok'],refund:['REFUND','bad'],pending:['PENDING','amber'],created:['CREATED','blue'],deny:['DENY','bad'],expire:['EXPIRE','gray'],cancel:['CANCEL','gray']};var x=m[s]||[String(s||'-').toUpperCase(),'gray'];return chip(x[0],x[1])}
function actorChip(a){var m={admin:['ADMIN','blue'],reseller:['RESELLER','ok'],guest:['GUEST','gray'],system:['SYSTEM','amber']};var x=m[a]||[String(a||'-').toUpperCase(),'gray'];return chip(x[0],x[1])}
function card(){return ce('div','rekap-card')}
function head(title,sub,right){var h=ce('div','rekap-card-head');var mn=ce('div','rekap-card-main');mn.appendChild(ce('p','rekap-title',title));if(sub)mn.appendChild(ce('p','rekap-sub',sub));h.appendChild(mn);if(right)h.appendChild(right);return h}
function qs(u,st,limit,offset,keys){var out=u+(u.indexOf('?')<0?'?':'&')+'limit='+limit+'&offset='+offset;if(st.search)out+='&q='+encodeURIComponent(st.search);for(var i=0;i<keys.length;i++){var k=keys[i];var v=st.filters&&st.filters[k];if(v)out+='&'+k+'='+encodeURIComponent(v)}return out}
function makeList(cfg){
var st={offset:0,loading:false,search:'',done:false,filters:{}};
var seq=0;
function L(){return document.getElementById(cfg.list)}
function Mo(){return document.getElementById(cfg.more)}
function load(reset){
var el=L();if(!el)return Promise.resolve();
if(reset){st.offset=0;st.done=false}
if(st.loading)return Promise.resolve();
if(!reset&&st.done)return Promise.resolve();
st.loading=true;
if(reset){clear(el);el.appendChild(ce('div','rekap-loading','Memuat...'))}
var my=++seq;
return Sec.json(cfg.fetch(st,cfg.limit,st.offset)).then(function(rows){
st.loading=false;if(my!==seq)return;
var e2=L();if(!e2)return;clear(e2);rows=rows||[];
if(!rows.length){e2.appendChild(ce('div','rekap-empty',cfg.empty||'Tidak ada data.'));st.done=true;var m1=Mo();if(m1)m1.classList.add('hidden');return}
rows.forEach(function(r){e2.appendChild(cfg.render(r))});
st.offset+=rows.length;
var m2=Mo();
if(rows.length<cfg.limit){st.done=true;if(m2)m2.classList.add('hidden')}else if(m2)m2.classList.remove('hidden');
}).catch(function(){
st.loading=false;if(my!==seq)return;
var e3=L();if(!e3)return;clear(e3);e3.appendChild(ce('div','rekap-error','Gagal memuat data.'));var m3=Mo();if(m3)m3.classList.add('hidden');
});
}
return{st:st,load:load};
}
function bindSearch(id,api){var inp=document.getElementById(id);if(!inp)return;inp.addEventListener('input',debounce(function(){api.st.search=String(inp.value||'').trim();api.load(true)},300))}
function bindMore(id,api){var b=document.getElementById(id);if(b)b.addEventListener('click',function(){api.load(false)})}
function buildDD(slotId,options,api,key,def){
var slot=document.getElementById(slotId);if(!slot)return;
if(typeof DD==='undefined')return;
var dd=DD.build({options:options,value:def||'',onChange:function(){api.st.filters[key]=dd.get();api.load(true)}});
api['dd_'+key]=dd;slot.appendChild(dd.el);
}
function gotoModule(intent,mod){try{Store.set('rekap_intent',intent)}catch(e){}if(window.Router)Router.go(mod)}
function stockCard(r){
var c=ce('div','rekap-stock-card');
var top=ce('div','rekap-stock-top');
top.appendChild(ce('div','rekap-stock-name',r.app_name||'-'));
top.appendChild(ce('div','rekap-stock-variants',(r.variants||0)+' varian'));
c.appendChild(top);
var cnt=ce('div','rekap-counts');
[['available','SIAP'],['reserved','DIKUNCI'],['sold','TERJUAL'],['disabled','NONAKTIF']].forEach(function(p){
var b=ce('div','rekap-count '+p[0]);b.appendChild(ce('b',null,String(r[p[0]]||0)));b.appendChild(ce('span',null,p[1]));cnt.appendChild(b);
});
c.appendChild(cnt);
var act=ce('div','rekap-stock-actions');
var kelola=ce('button','rekap-btn primary','Kelola Stok');kelola.type='button';
kelola.addEventListener('click',function(){gotoModule({type:'manageStock',app:r.app_name},'reseller')});
act.appendChild(kelola);
var terjual=ce('button','rekap-btn','Lihat Terjual');terjual.type='button';
terjual.addEventListener('click',function(){
var inp=document.getElementById('rekapSoldSearch');if(inp)inp.value=r.app_name||'';
if(soldApi){soldApi.st.search=r.app_name||'';soldApi.load(true)}
var lst=document.getElementById('rekapSoldList');if(lst&&lst.closest){var pn=lst.closest('.rekap-panel');if(pn)pn.scrollIntoView({behavior:'smooth',block:'start'})}
});
act.appendChild(terjual);
c.appendChild(act);
return c;
}
function loadStock(){
var box=document.getElementById('rekapStockSummary');if(!box)return Promise.resolve();
clear(box);box.appendChild(ce('div','rekap-loading','Memuat...'));
return Sec.json('/api/admin/rekap/stock-summary').then(function(rows){
clear(box);rows=rows||[];
if(!rows.length){box.appendChild(ce('div','rekap-empty','Belum ada aplikasi reseller.'));return}
rows.forEach(function(r){box.appendChild(stockCard(r))});
}).catch(function(){clear(box);box.appendChild(ce('div','rekap-error','Gagal memuat pintasan stok.'))});
}
function loadFinance(){
var box=document.getElementById('rekapFinanceSummary');if(!box)return Promise.resolve();
clear(box);box.appendChild(ce('div','rekap-loading','Memuat...'));
return Sec.json('/api/admin/rekap/finance-summary').then(function(s){
clear(box);s=s||{};
var kpis=[['settle','SETTLE',fmtRpShort(s.settle||0),fmtRp(s.settle||0)],['refund','REFUND',fmtRpShort(s.refund||0),fmtRp(s.refund||0)],['net','BERSIH',fmtRpShort(s.net||0),fmtRp(s.net||0)],['pending','PENDING',fmtRpShort(s.pending||0),fmtRp(s.pending||0)]];
kpis.forEach(function(k){
var d=ce('div','rekap-kpi '+k[0]);d.appendChild(ce('span',null,k[1]));d.appendChild(ce('strong',null,k[2]));d.appendChild(ce('small',null,k[3]));box.appendChild(d);
});
}).catch(function(){clear(box);box.appendChild(ce('div','rekap-error','Gagal memuat ringkasan keuangan.'))});
}
function renderSold(r){
var c=card();
c.appendChild(head((r.app_name||'-')+' • '+(r.category||'-')+' • '+(r.duration||'-'),(r.order_code||('#'+r.order_id))+' • '+(r.username||'?'),orderChip(r.order_status)));
c.appendChild(kv('Terjual',fmtDT(r.sold_at)));
c.appendChild(kv('Qty',String(r.qty||1)));
c.appendChild(kv('Total Order',fmtRp(r.total_amount),true));
if(r.display_name&&r.display_name!==r.username)c.appendChild(kv('Reseller',r.display_name));
if(r.buyer_note){var n=ce('p','rekap-note','↳ '+r.buyer_note);c.appendChild(n)}
var act=ce('div','rekap-stock-actions');
var det=ce('button','rekap-btn','Detail Order');det.type='button';
det.addEventListener('click',function(){gotoModule({type:'openOrder',id:r.order_id},'pesanan')});
act.appendChild(det);c.appendChild(act);
return c;
}
function renderPay(r){
var c=card();
c.appendChild(head((r.provider||'-')+' • '+String(r.status||'-').toUpperCase(),(r.order_code||('#'+r.order_id))+' • '+(r.username||'?'),payChip(r.status)));
c.appendChild(kv('Nominal',fmtRp(r.gross_amount),true));
if(r.provider_tx_id)c.appendChild(kv('TX ID',r.provider_tx_id,true));
c.appendChild(kv('Waktu',fmtDT(r.created_at)));
if(r.raw_status)c.appendChild(kv('Raw',r.raw_status));
return c;
}
function renderOrder(r){
var c=card();
var items=(r.items_summary||[]).map(function(i){return i.app_name+' ×'+i.qty}).join(', ');
c.appendChild(head(r.order_code||('#'+r.id),(r.username||'?')+(r.display_name&&r.display_name!==r.username?(' • '+r.display_name):''),orderChip(r.status)));
c.appendChild(kv('Total',fmtRp(r.total_amount),true));
c.appendChild(kv('Dibuat',fmtDT(r.created_at)));
if(items)c.appendChild(ce('p','rekap-note',items));
var act=ce('div','rekap-stock-actions');
var det=ce('button','rekap-btn','Detail Order');det.type='button';
det.addEventListener('click',function(){gotoModule({type:'openOrder',id:r.id},'pesanan')});
act.appendChild(det);c.appendChild(act);
return c;
}
function renderAudit(r){
var c=card();
c.appendChild(head(r.action||'-',(r.actor_type||'-')+(r.actor_id!=null?('#'+r.actor_id):'')+' • '+(r.entity_type||'-')+(r.entity_id!=null?('#'+r.entity_id):''),actorChip(r.actor_type)));
c.appendChild(kv('Waktu',fmtDT(r.created_at)));
if(r.ip)c.appendChild(kv('IP',r.ip,true));
if(r.meta){var mt=String(r.meta);if(mt.length>180)mt=mt.slice(0,180)+'…';c.appendChild(ce('p','rekap-note',mt))}
return c;
}
function renderRev(r){
var c=card();
c.appendChild(head((r.app_name||'-')+' • '+(r.category||'-')+' • '+(r.duration||'-'),(r.order_code||('#'+r.order_id))+' • oleh '+(r.created_by||'-')));
c.appendChild(kv('Waktu',fmtDT(r.created_at)));
if(r.note)c.appendChild(ce('p','rekap-note','“'+r.note+'”'));
var act=ce('div','rekap-stock-actions');
var det=ce('button','rekap-btn','Detail Order');det.type='button';
det.addEventListener('click',function(){gotoModule({type:'openOrder',id:r.order_id},'pesanan')});
act.appendChild(det);c.appendChild(act);
return c;
}
function buildApis(){
soldApi=makeList({list:'rekapSoldList',more:'rekapSoldMore',limit:20,empty:'Belum ada stok terjual.',fetch:function(st,limit,offset){return qs('/api/admin/rekap/sold',st,limit,offset,['range'])},render:renderSold});
payApi=makeList({list:'rekapPaymentsList',more:'rekapPaymentsMore',limit:20,empty:'Belum ada transaksi.',fetch:function(st,limit,offset){return qs('/api/admin/rekap/payments',st,limit,offset,['status','range'])},render:renderPay});
ordersApi=makeList({list:'rekapOrdersList',more:'rekapOrdersMore',limit:20,empty:'Belum ada pesanan.',fetch:function(st,limit,offset){return qs('/api/admin/orders',st,limit,offset,['status','range'])},render:renderOrder});
auditApi=makeList({list:'rekapAuditList',more:'rekapAuditMore',limit:30,empty:'Belum ada jejak audit.',fetch:function(st,limit,offset){return qs('/api/admin/rekap/audit',st,limit,offset,['actor_type','range'])},render:renderAudit});
revApi=makeList({list:'rekapRevisionsList',more:'rekapRevisionsMore',limit:20,empty:'Belum ada revisi kredensial.',fetch:function(st,limit,offset){return qs('/api/admin/rekap/revisions',st,limit,offset,['range'])},render:renderRev});
}
function bindAll(){
buildDD('rekapSoldRangeSlot',RANGE,soldApi,'range','');
buildDD('rekapPayStatusSlot',PAY_STATUS,payApi,'status','');
buildDD('rekapPayRangeSlot',RANGE,payApi,'range','');
buildDD('rekapOrderStatusSlot',ORDER_STATUS,ordersApi,'status','');
buildDD('rekapOrderRangeSlot',RANGE,ordersApi,'range','');
buildDD('rekapAuditActorSlot',ACTOR_TYPE,auditApi,'actor_type','');
buildDD('rekapAuditRangeSlot',RANGE,auditApi,'range','');
buildDD('rekapRevRangeSlot',RANGE,revApi,'range','');
bindSearch('rekapSoldSearch',soldApi);bindMore('rekapSoldMore',soldApi);
bindSearch('rekapPaySearch',payApi);bindMore('rekapPaymentsMore',payApi);
bindSearch('rekapOrderSearch',ordersApi);bindMore('rekapOrdersMore',ordersApi);
bindSearch('rekapAuditSearch',auditApi);bindMore('rekapAuditMore',auditApi);
bindSearch('rekapRevSearch',revApi);bindMore('rekapRevisionsMore',revApi);
var rf=document.getElementById('rekapRefresh');if(rf)rf.addEventListener('click',function(){loadAll()});
var rs=document.getElementById('rekapStockReload');if(rs)rs.addEventListener('click',function(){loadStock()});
var rfn=document.getElementById('rekapFinanceReload');if(rfn)rfn.addEventListener('click',function(){loadFinance()});
}
function stampUpdated(){var el=document.getElementById('rekapUpdated');if(el)el.textContent='Diperbarui '+fmtDT(new Date().toISOString().replace('T',' ').slice(0,19))}
function loadAll(){
return Promise.all([loadStock(),loadFinance(),soldApi.load(true),payApi.load(true),ordersApi.load(true),auditApi.load(true),revApi.load(true)]).then(stampUpdated).catch(function(){});
}
function init(host){
root=host;
root.appendChild(M.view());
buildApis();
bindAll();
return loadAll();
}
function destroy(){
soldApi=null;payApi=null;ordersApi=null;auditApi=null;revApi=null;
root=null;
}
M.init=init;
M.destroy=destroy;
})(AdminModules.rekapan=AdminModules.rekapan||{});
