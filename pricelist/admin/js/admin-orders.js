var ORD_OFFSET=0,ORD_LIMIT=20,ORD_LOADED=[],ORD_SEARCH='',ORD_SEARCH_TIMER=null;
var ORD_CD_REG={},ORD_CD_TIMER=null,ORD_CD_SEQ=0;
function ordHeaders(){return{'x-admin-password':sessionPass}}
function ordFmtRp(n){return'Rp '+Number(n||0).toLocaleString('id-ID')}
function ordFmtDT(s){
if(!s)return'-';
var t=Date.parse(String(s).replace(' ','T')+'Z');
if(isNaN(t))return s;
return new Date(t).toLocaleString('id-ID',{day:'2-digit',month:'short',hour:'2-digit',minute:'2-digit'});
}
function ordParse(s){try{var o=JSON.parse(s);return(o&&typeof o==='object'&&!Array.isArray(o))?o:{}}catch(e){return{}}}
function ordParseForm(s){
if(!s)return[];
try{
var o=JSON.parse(s);
if(Array.isArray(o))return o.filter(function(x){return x&&typeof x==='object'&&!Array.isArray(x)});
if(o&&typeof o==='object')return[o];
}catch(e){}
return[];
}
function ordStatusPill(st){
if(st==='pending_payment')return{cls:'pill amber',txt:'Menunggu'};
if(st==='delivered')return{cls:'pill green',txt:'Terkirim'};
if(st==='needs_attention')return{cls:'pill red',txt:'Perhatian'};
if(st==='cancelled')return{cls:'pill gray',txt:'Dibatalkan'};
if(st==='refunded')return{cls:'pill red',txt:'Refund'};
return{cls:'pill gray',txt:st||'-'};
}
function ordBadgeMod(st){
if(st==='delivered')return'ok';
if(st==='pending_payment')return'amber';
if(st==='needs_attention')return'bad';
if(st==='cancelled')return'gray';
if(st==='refunded')return'bad';
return'gray';
}
function ordBadgeTxt(st){
if(st==='delivered')return'TERKIRIM';
if(st==='pending_payment')return'MENUNGGU';
if(st==='needs_attention')return'PERHATIAN';
if(st==='cancelled')return'BATAL';
if(st==='refunded')return'REFUND';
return String(st||'-').toUpperCase();
}
function ordBadgeSvg(mod){
var ns='http://www.w3.org/2000/svg';
var s=document.createElementNS(ns,'svg');
s.setAttribute('viewBox','0 0 24 24');
var c=document.createElementNS(ns,'circle');
c.setAttribute('cx','12');c.setAttribute('cy','12');c.setAttribute('r','10');
c.setAttribute('fill','#432f2e');
s.appendChild(c);
var p=document.createElementNS(ns,'path');
var d;
if(mod==='ok')d='M8 12.5l2.6 2.6L16 9.5';
else if(mod==='amber')d='M12 7.5V12l3 1.8';
else if(mod==='bad')d='M12 8v5M12 16h.01';
else d='M9 9l6 6M15 9l-6 6';
p.setAttribute('d',d);
p.setAttribute('fill','none');
p.setAttribute('stroke','#feefb8');
p.setAttribute('stroke-width','2.4');
p.setAttribute('stroke-linecap','round');
p.setAttribute('stroke-linejoin','round');
s.appendChild(p);
return s;
}
function ordCdTick(){
var now=Date.now();
for(var k in ORD_CD_REG){
var rec=ORD_CD_REG[k];
var el=document.getElementById(k);
if(!el||!document.body.contains(el)){delete ORD_CD_REG[k];continue}
var rem=rec.end-now;
if(rem<0)rem=0;
var d=Math.floor(rem/86400000);
var h=Math.floor((rem%86400000)/3600000);
var m=Math.floor((rem%3600000)/60000);
var ns=el.querySelectorAll('.n');
if(ns.length>=3){ns[0].textContent=d;ns[1].textContent=h;ns[2].textContent=m}
el.classList.toggle('warn',rem>0&&rem<86400000);
if(rem<=0)el.classList.add('exp');
}
if(!Object.keys(ORD_CD_REG).length&&ORD_CD_TIMER){clearInterval(ORD_CD_TIMER);ORD_CD_TIMER=null}
}
function ordCdStart(){
if(ORD_CD_TIMER)return;
ORD_CD_TIMER=setInterval(ordCdTick,1000);
}
function ordCdAdd(el,endIso){
var t=Date.parse(String(endIso).replace(' ','T')+'Z');
if(isNaN(t))return;
var id='ordcd_'+(ORD_CD_SEQ++);
el.id=id;
ORD_CD_REG[id]={end:t};
ordCdTick();
ordCdStart();
}
function ordCdBuild(){
var wrap=ce('span','ord-cd');
['h','j','m'].forEach(function(u){
var i=document.createElement('i');
i.appendChild(ce('span','n','0'));
var b=document.createElement('b');
b.textContent=u;
i.appendChild(b);
wrap.appendChild(i);
});
return wrap;
}
function ordConfirm(msg,fn){
if(typeof uiConfirm==='function')uiConfirm(msg,'Konfirmasi',function(){fn()});
else if(confirm(msg))fn();
}
function ordSyncFilterIcons(){
var pairs=[['orderStatusDD','orderStatusFilter'],['orderRangeDD','orderRangeFilter']];
pairs.forEach(function(pr){
var dd=document.getElementById(pr[0]);
var hid=document.getElementById(pr[1]);
if(dd&&hid)dd.classList.toggle('dd-active',!!hid.value);
});
}
function refreshOrdersBadge(){
fetch('/api/admin/orders/needs-count',{headers:ordHeaders()}).then(function(r){return r.json()}).then(function(d){
var b=document.getElementById('ordersBadge');
if(!b)return;
var n=(d&&d.count)||0;
b.textContent=String(n);
b.classList.toggle('hidden',n===0);
}).catch(function(){});
}
function ordersQuery(){
var st=document.getElementById('orderStatusFilter');
var rg=document.getElementById('orderRangeFilter');
var u='/api/admin/orders?limit='+ORD_LIMIT+'&offset='+ORD_OFFSET;
if(st&&st.value)u+='&status='+encodeURIComponent(st.value);
if(rg&&rg.value)u+='&range='+encodeURIComponent(rg.value);
if(ORD_SEARCH)u+='&q='+encodeURIComponent(ORD_SEARCH);
return u;
}
function loadOrders(){
ORD_OFFSET=0;ORD_LOADED=[];
ordSyncFilterIcons();
var list=document.getElementById('orderList');
if(!list)return;
while(list.firstChild)list.removeChild(list.firstChild);
list.appendChild(ce('div','loading-state','Memuat pesanan...'));
fetchOrders(true);
refreshOrdersBadge();
}
function fetchOrders(reset){
var list=document.getElementById('orderList');
if(!list)return;
fetch(ordersQuery(),{headers:ordHeaders()}).then(function(r){return r.json()}).then(function(rows){
if(reset){while(list.firstChild)list.removeChild(list.firstChild);ORD_LOADED=[]}
rows=rows||[];
rows.forEach(function(o){ORD_LOADED.push(o);list.appendChild(buildOrderCard(o))});
var more=document.getElementById('btnOrdersMore');
if(more){more.classList.toggle('hidden',rows.length<ORD_LIMIT);more.disabled=false;more.textContent='Muat Lebih Banyak'}
if(!ORD_LOADED.length)list.appendChild(ce('div','empty-state','Tidak ada pesanan yang cocok.'));
if(typeof uiTickCountdowns==='function')uiTickCountdowns();
}).catch(function(){
if(reset){while(list.firstChild)list.removeChild(list.firstChild);list.appendChild(ce('div','empty-state','Gagal memuat pesanan.'))}
var more=document.getElementById('btnOrdersMore');
if(more){more.disabled=false;more.textContent='Muat Lebih Banyak'}
});
}
function buildOrderCard(o){
var card=ce('div','ord-card');
card.setAttribute('data-id',o.id);
var chead=ce('div','ord-chead');
var doc=ce('span','ord-doc');
doc.appendChild(admSvg('M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z M14 2v6h6 M8 13h5 M8 17h5','1.3rem','1.3rem'));
chead.appendChild(doc);
chead.appendChild(ce('div','ord-code',o.order_code||('#'+o.id)));
var cside=ce('span','ord-cside');
var mod=ordBadgeMod(o.status);
var badge=ce('span','ord-badge '+mod);
var tick=ce('span','tick');
tick.appendChild(ordBadgeSvg(mod));
badge.appendChild(tick);
badge.appendChild(document.createTextNode(ordBadgeTxt(o.status)));
cside.appendChild(badge);
if(o.status==='delivered'&&o.expires_at){
var cd=ordCdBuild();
ordCdAdd(cd,o.expires_at);
cside.appendChild(cd);
}
chead.appendChild(cside);
card.appendChild(chead);
var meta=ce('div','ord-meta');
var m1=ce('span','ord-m');
m1.appendChild(admSvg('M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2 M12 3a4 4 0 1 0 0 8 4 4 0 0 0 0-8z','.92rem','.92rem'));
m1.appendChild(document.createTextNode((o.username||'?')+(o.display_name?(' • '+o.display_name):'')));
meta.appendChild(m1);
var m2=ce('span','ord-m');
m2.appendChild(admSvg('M3 4.5h18v17H3z M3 9.5h18 M8 2.5v4 M16 2.5v4','.92rem','.92rem'));
m2.appendChild(document.createTextNode(ordFmtDT(o.created_at)));
meta.appendChild(m2);
card.appendChild(meta);
var items=o.items_summary||[];
if(items.length){
var it=items[0];
var row=ce('div','ord-item');
row.appendChild(ce('span','ord-nf',String(it.app_name||'?').charAt(0).toUpperCase()));
row.appendChild(ce('span','ord-name',it.app_name+' ×'+it.qty));
card.appendChild(row);
if(items.length>1)card.appendChild(ce('div','ord-extra','+'+(items.length-1)+' item lainnya'));
}else{
card.appendChild(ce('div','ord-extra','Tidak ada item'));
}
var trow=ce('div','ord-trow');
trow.appendChild(ce('span',null,'TOTAL'));
trow.appendChild(ce('strong',null,ordFmtRp(o.total_amount)));
card.appendChild(trow);
var det=ce('button','ord-detail','KETUK UNTUK DETAIL');
det.type='button';
det.appendChild(admSvg('M9 5l7 7-7 7','.85rem','.85rem'));
card.appendChild(det);
card.addEventListener('click',function(){openOrderDetail(o.id)});
return card;
}
function rcpRow(l,v,mono){
var r=ce('div','rcp-row');
r.appendChild(ce('span','rcp-lbl',l));
var val=ce('span','rcp-val',String(v));
if(mono)val.classList.add('mono');
r.appendChild(val);
return r;
}
function rcpLinkRow(l,href,text){
var r=ce('div','rcp-row');
r.appendChild(ce('span','rcp-lbl',l));
var val=ce('span','rcp-val');
var a=document.createElement('a');
a.href=href;
a.target='_blank';
a.rel='noopener';
a.textContent=text;
val.appendChild(a);
r.appendChild(val);
return r;
}
function rcpTitle(t){return ce('p','rcp-title',t)}
function credRow(k,v){
var row=ce('div','rcp-cred-row');
row.appendChild(ce('span','rcp-cred-lbl',k));
row.appendChild(ce('span','rcp-cred-val',String(v)));
return row;
}
function buildReceiptItem(o,it,autoOpen){
var box=ce('div','rcp-item');
var head=ce('div','rcp-item-head');
head.appendChild(ce('span','rcp-item-name',it.app_name));
head.appendChild(ce('span','rcp-item-sum',ordFmtRp(it.line_total)));
box.appendChild(head);
box.appendChild(ce('p','rcp-item-meta',it.category+' • '+it.duration+' • '+it.qty+' × '+ordFmtRp(it.unit_price)));
if(it.expires_at){
var cw=ce('p','rcp-item-meta');
cw.appendChild(document.createTextNode('Masa aktif: '));
var ct=ce('span','cd-tag');
ct.setAttribute('data-cd',it.expires_at);
cw.appendChild(ct);
box.appendChild(cw);
}
var farr=ordParseForm(it.form_data);
var creds=(o.credentials||[]).filter(function(c){return c.order_item_id===it.id&&c.fields});
var revs=(it.revisions&&it.revisions.length)?it.revisions:[];
var details=document.createElement('details');
if(autoOpen)details.setAttribute('open','');
var summary=document.createElement('summary');
summary.className='rcp-collapse-head';
summary.appendChild(ce('span','rcp-collapse-title','Data Pesanan & Kredensial'));
var badges=ce('span','rcp-collapse-badges');
if(farr.length)badges.appendChild(ce('span','rcp-badge-sum','Form'));
if(creds.length)badges.appendChild(ce('span','rcp-badge-sum',creds.length+' Kredensial'));
if(revs.length)badges.appendChild(ce('span','rcp-badge-sum',revs.length+' Revisi'));
summary.appendChild(badges);
details.appendChild(summary);
var cbody=ce('div','rcp-collapse-body');
if(farr.length){
var fsec=ce('div','rcp-sub');
fsec.appendChild(rcpTitle('Form Order'));
farr.forEach(function(obj,ai){
if(farr.length>1)fsec.appendChild(ce('p','rcp-acct-label','↳ AKUN #'+(ai+1)));
Object.keys(obj).forEach(function(k){fsec.appendChild(credRow(k,obj[k]))});
});
cbody.appendChild(fsec);
}
if(creds.length){
var ksec=ce('div','rcp-sub');
ksec.appendChild(rcpTitle('Kredensial Terkirim'));
creds.forEach(function(c){
var obj=ordParse(c.fields);
Object.keys(obj).forEach(function(k){ksec.appendChild(credRow(k,obj[k]))});
if(c.buyer_note)ksec.appendChild(credRow('Info Pembeli',c.buyer_note));
});
cbody.appendChild(ksec);
}
if(revs.length){
var rsec=ce('div','rcp-sub');
rsec.appendChild(rcpTitle('Catatan Revisi'));
revs.forEach(function(rv,idx){
var rev=ce('div','rcp-rev');
rev.appendChild(ce('p','rcp-rev-head','Revisi '+(idx+1)+' • '+ordFmtDT(rv.created_at)+' • '+rv.created_by));
var ro=ordParse(rv.fields);
Object.keys(ro).forEach(function(k){rev.appendChild(credRow(k,ro[k]))});
rev.appendChild(ce('p','rcp-rev-note','“'+rv.note+'”'));
rsec.appendChild(rev);
});
cbody.appendChild(rsec);
}
var rvBtn=ce('button','rcp-mini','＋ Catat Revisi');
rvBtn.type='button';
rvBtn.style.alignSelf='flex-start';
rvBtn.addEventListener('click',function(){openRevisionModal(o,it)});
cbody.appendChild(rvBtn);
details.appendChild(cbody);
box.appendChild(details);
return box;
}
function tkBtn(label,cls,fn){
var b=ce('button',cls,label);
b.type='button';
b.addEventListener('click',fn);
return b;
}
function ordPost(path,body,after){
fetch('/api/admin/orders/'+path,{method:'POST',headers:{'Content-Type':'application/json','x-admin-password':sessionPass},body:JSON.stringify(body||{})})
.then(function(r){return r.json().then(function(d){return{ok:r.ok,d:d}})})
.then(function(res){
if(!res.ok){throw new Error(res.d.error||'Gagal')}
if(typeof uiToast==='function')uiToast('Tindakan berhasil.');
loadOrders();
if(after)after();
})
.catch(function(e){if(typeof uiAlert==='function')uiAlert(e.message||'Gagal menjalankan aksi.','Kesalahan');else alert(e.message)});
}
function addTakeover(act,o,reloadDetail){
if(o.status==='pending_payment'){
act.appendChild(tkBtn('Lunas & Proses','tool-btn green',function(){ordConfirm('Tandai pembayaran lunas lalu proses order ini?',function(){ordPost(o.id+'/settle',{},reloadDetail)})}));
act.appendChild(tkBtn('Proses Manual','tool-btn sky',function(){ordConfirm('Alokasikan stok dan tandai terkirim tanpa menunggu pembayaran?',function(){ordPost(o.id+'/process',{},reloadDetail)})}));
act.appendChild(tkBtn('Batalkan','tool-btn',function(){ordConfirm('Batalkan order ini?',function(){ordPost(o.id+'/set-status',{status:'cancelled'},reloadDetail)})}));
}
if(o.status==='needs_attention'){
act.appendChild(tkBtn('Proses Ulang','tool-btn green',function(){ordConfirm('Proses ulang fulfillment order ini?',function(){ordPost(o.id+'/fulfill',{},reloadDetail)})}));
act.appendChild(tkBtn('Jadikan Pending','tool-btn sky',function(){ordConfirm('Kembalikan order ke status menunggu pembayaran?',function(){ordPost(o.id+'/set-status',{status:'pending_payment'},reloadDetail)})}));
act.appendChild(tkBtn('Refund','tool-btn',function(){ordConfirm('Refund order ini?',function(){ordPost(o.id+'/refund',{return_stock:false},reloadDetail)})}));
}
if(o.status==='delivered'){
act.appendChild(tkBtn('Refund','tool-btn',function(){ordConfirm('Refund order ini?',function(){ordPost(o.id+'/refund',{return_stock:false},reloadDetail)})}));
}
}
function openOrderDetail(id){
fetch('/api/admin/orders/'+id,{headers:ordHeaders()}).then(function(r){return r.json()}).then(function(o){
if(!o||o.error){if(typeof uiAlert==='function')uiAlert((o&&o.error)||'Order tidak ditemukan.','Kesalahan');return}
var sub=document.getElementById('orderDetailSub');
if(sub)sub.textContent=o.order_code||('#'+o.id);
var body=document.getElementById('orderDetailBody');
while(body.firstChild)body.removeChild(body.firstChild);
body.appendChild(renderReceipt(o));
var modal=document.getElementById('orderDetailModal');
if(modal)modal.classList.remove('hidden');
if(typeof uiTickCountdowns==='function')uiTickCountdowns();
}).catch(function(){if(typeof uiAlert==='function')uiAlert('Gagal memuat detail pesanan.','Kesalahan')});
}
function renderReceipt(o){
var wrap=ce('div','rcp');
var s1=ce('div','rcp-sec');
s1.appendChild(ce('p','rcp-center',o.order_code||('#'+o.id)));
s1.appendChild(rcpRow('Tanggal',ordFmtDT(o.created_at)));
var sp=ordStatusPill(o.status);
var stRow=ce('div','rcp-row');
stRow.appendChild(ce('span','rcp-lbl','Status'));
stRow.appendChild(ce('span',sp.cls,sp.txt));
s1.appendChild(stRow);
wrap.appendChild(s1);
var s2=ce('div','rcp-sec');
s2.appendChild(rcpTitle('Pembayaran'));
if(o.payments&&o.payments.length){
o.payments.forEach(function(py){
s2.appendChild(rcpRow(py.provider+' • '+py.status,ordFmtRp(py.gross_amount)));
if(py.provider_tx_id)s2.appendChild(rcpRow('ID Pembayaran',py.provider_tx_id,true));
});
}else{
s2.appendChild(rcpRow('Pembayaran','Belum ada'));
}
wrap.appendChild(s2);
var s3=ce('div','rcp-sec');
s3.appendChild(rcpTitle('Reseller'));
var rs=o.reseller;
s3.appendChild(rcpRow('Username',rs?rs.username:'-'));
s3.appendChild(rcpRow('Nama',rs&&rs.display_name?rs.display_name:'-'));
if(rs&&rs.whatsapp){
var waDigits=String(rs.whatsapp).replace(/^0/,'');
s3.appendChild(rcpLinkRow('WhatsApp','https://wa.me/62'+waDigits,rs.whatsapp));
}
if(rs&&rs.x_username)s3.appendChild(rcpLinkRow('Akun X','https://x.com/'+encodeURIComponent(rs.x_username),rs.x_username));
wrap.appendChild(s3);
var s4=ce('div','rcp-sec');
s4.appendChild(rcpTitle('Item'));
var items=o.items||[];
var autoOpen=items.length<=1;
items.forEach(function(it){s4.appendChild(buildReceiptItem(o,it,autoOpen))});
if(!items.length)s4.appendChild(rcpRow('Item','Tidak ada'));
wrap.appendChild(s4);
var s5=ce('div','rcp-sec');
var totalQty=items.reduce(function(a,b){return a+(b.qty||0)},0);
s5.appendChild(rcpRow('Total Item',String(totalQty)));
var totRow=ce('div','rcp-row');
totRow.appendChild(ce('span','rcp-lbl','Total'));
var totVal=ce('span','rcp-val',ordFmtRp(o.total_amount));
totVal.style.fontSize='.8125rem';
totRow.appendChild(totVal);
s5.appendChild(totRow);
wrap.appendChild(s5);
var act=ce('div','rcp-actions');
addTakeover(act,o,function(){openOrderDetail(o.id)});
if(act.childNodes.length)wrap.appendChild(act);
return wrap;
}
function openRevisionModal(o,it){
var overlay=ce('div','modal-overlay');
var backdrop=ce('div','modal-backdrop');
var box=ce('div','modal-box');
var head=ce('div','modal-head');
var ht=ce('div');
ht.appendChild(ce('h3',null,'Catat Revisi Kredensial'));
ht.appendChild(ce('p','modal-sub',it.app_name+' • '+it.category+' • '+it.duration));
head.appendChild(ht);
var closeBtn=ce('button','modal-close-btn','×');
closeBtn.type='button';
head.appendChild(closeBtn);
box.appendChild(head);
var bodyScroll=ce('div','modal-body-scroll');
bodyScroll.appendChild(ce('p','field-hint','Isi kredensial pengganti dan alasan revisi. Data asli tidak ditimpa; revisi tersimpan sebagai catatan riwayat.'));
var fieldsWrap=ce('div','form-fields');
var rows=[{name:'',value:''}];
function renderRows(){
while(fieldsWrap.firstChild)fieldsWrap.removeChild(fieldsWrap.firstChild);
rows.forEach(function(rw,idx){
var r=ce('div','sf-row');
var nm=ce('input','sf-name');
nm.type='text';nm.placeholder='Nama field';nm.value=rw.name;
nm.addEventListener('input',function(){rows[idx].name=this.value});
var vl=ce('input','sf-val');
vl.type='text';vl.placeholder='Isi / nilai baru';vl.value=rw.value;
vl.addEventListener('input',function(){rows[idx].value=this.value});
var del=ce('button','sf-del');
del.type='button';del.title='Hapus baris';
del.appendChild(admSvg('M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16','.875rem','.875rem'));
del.addEventListener('click',function(){rows.splice(idx,1);renderRows()});
r.appendChild(nm);r.appendChild(vl);r.appendChild(del);
fieldsWrap.appendChild(r);
});
}
renderRows();
bodyScroll.appendChild(fieldsWrap);
var addRow=ce('button','add-field-btn','＋ Tambah Baris');
addRow.type='button';
addRow.addEventListener('click',function(){rows.push({name:'',value:''});renderRows()});
bodyScroll.appendChild(addRow);
var noteWrap=ce('div','field');
noteWrap.style.marginTop='.875rem';
var noteLbl=ce('label',null,'CATATAN REVISI (WAJIB)');
noteLbl.setAttribute('for','revNoteInput');
var noteTa=ce('textarea','form-input');
noteTa.id='revNoteInput';
noteTa.rows=2;
noteTa.placeholder='Mis. password lama error, berikut data pengganti...';
noteWrap.appendChild(noteLbl);
noteWrap.appendChild(noteTa);
bodyScroll.appendChild(noteWrap);
box.appendChild(bodyScroll);
var foot=ce('div','modal-actions');
var cancelBtn=ce('button','cancel-btn','Batal');
cancelBtn.type='button';
var saveBtn=ce('button','submit-btn','Simpan Revisi');
saveBtn.type='button';
foot.appendChild(cancelBtn);foot.appendChild(saveBtn);
box.appendChild(foot);
overlay.appendChild(backdrop);overlay.appendChild(box);
document.body.appendChild(overlay);
function shut(){overlay.remove()}
closeBtn.addEventListener('click',shut);
cancelBtn.addEventListener('click',shut);
backdrop.addEventListener('click',shut);
saveBtn.addEventListener('click',function(){
var obj={};
for(var i=0;i<rows.length;i++){
var nm=String(rows[i].name||'').trim();
var vl=String(rows[i].value||'').trim();
if(!nm&&!vl)continue;
if(!nm||!vl){if(typeof uiAlert==='function')uiAlert('Baris '+(i+1)+': nama field dan isi wajib diisi.','Data Belum Lengkap');return}
obj[nm]=vl;
}
if(!Object.keys(obj).length){if(typeof uiAlert==='function')uiAlert('Minimal satu baris kredensial diperlukan.','Data Belum Lengkap');return}
var note=String(noteTa.value||'').trim();
if(!note){if(typeof uiAlert==='function')uiAlert('Catatan revisi wajib diisi.','Data Belum Lengkap');return}
saveBtn.disabled=true;saveBtn.textContent='Menyimpan...';
fetch('/api/admin/orders/'+o.id+'/items/'+it.id+'/revisions',{method:'POST',headers:{'Content-Type':'application/json','x-admin-password':sessionPass},body:JSON.stringify({fields:obj,note:note})})
.then(function(r){return r.json().then(function(d){return{ok:r.ok,d:d}})})
.then(function(res){
if(!res.ok)throw new Error(res.d.error||'Gagal menyimpan revisi');
shut();
if(typeof uiToast==='function')uiToast('Revisi tercatat.');
openOrderDetail(o.id);
})
.catch(function(e){if(typeof uiAlert==='function')uiAlert(e.message||'Gagal menyimpan revisi.','Kesalahan')})
.finally(function(){saveBtn.disabled=false;saveBtn.textContent='Simpan Revisi'});
});
}
function closeOrderDetail(){
var modal=document.getElementById('orderDetailModal');
if(modal)modal.classList.add('hidden');
}
document.addEventListener('DOMContentLoaded',function(){
var search=document.getElementById('orderSearchInput');
if(search)search.addEventListener('input',function(){
var v=this.value;
clearTimeout(ORD_SEARCH_TIMER);
ORD_SEARCH_TIMER=setTimeout(function(){
ORD_SEARCH=String(v||'').trim();
loadOrders();
},300);
});
var st=document.getElementById('orderStatusFilter');
if(st)st.addEventListener('change',function(){loadOrders()});
var rg=document.getElementById('orderRangeFilter');
if(rg)rg.addEventListener('change',function(){loadOrders()});
var rf=document.getElementById('btnRefreshOrders');
if(rf)rf.addEventListener('click',function(){loadOrders()});
var more=document.getElementById('btnOrdersMore');
if(more)more.addEventListener('click',function(){
more.disabled=true;more.textContent='Memuat...';
ORD_OFFSET+=ORD_LIMIT;
fetchOrders(false);
});
var dc=document.getElementById('orderDetailClose');
if(dc)dc.addEventListener('click',closeOrderDetail);
var db=document.getElementById('orderDetailBackdrop');
if(db)db.addEventListener('click',closeOrderDetail);
ordSyncFilterIcons();
});
