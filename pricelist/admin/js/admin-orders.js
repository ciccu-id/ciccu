var ORD_OFFSET=0,ORD_LIMIT=20,ORD_LOADED=[],ORD_SEARCH='',ORD_SEARCH_TIMER=null;
function ordHeaders(){return{'x-admin-password':sessionPass}}
function ordMask(v){v=String(v==null?'':v);if(!v)return'';if(v.length<=4)return'•'.repeat(v.length);return v.slice(0,2)+'•'.repeat(Math.min(8,v.length-4))+v.slice(-2)}
function ordFmtRp(n){return'Rp '+Number(n||0).toLocaleString('id-ID')}
function ordFmtDT(s){
if(!s)return'-';
var t=Date.parse(String(s).replace(' ','T')+'Z');
if(isNaN(t))return s;
return new Date(t).toLocaleString('id-ID',{day:'2-digit',month:'short',hour:'2-digit',minute:'2-digit'});
}
function ordParse(s){try{var o=JSON.parse(s);return(o&&typeof o==='object'&&!Array.isArray(o))?o:{}}catch(e){return{}}}
function ordStatusPill(st){
if(st==='pending_payment')return{cls:'pill amber',txt:'Menunggu'};
if(st==='delivered')return{cls:'pill green',txt:'Terkirim'};
if(st==='needs_attention')return{cls:'pill red',txt:'Perhatian'};
if(st==='cancelled')return{cls:'pill gray',txt:'Dibatalkan'};
if(st==='refunded')return{cls:'pill red',txt:'Refund'};
return{cls:'pill gray',txt:st||'-'};
}
function ordUrg(st){
if(st==='needs_attention')return'urg-red';
if(st==='pending_payment')return'urg-amber';
if(st==='delivered')return'urg-green';
return'';
}
function ordCopy(text,btn){
function done(){if(!btn)return;var old=btn.textContent;btn.textContent='✓ Tersalin';setTimeout(function(){btn.textContent=old},1200)}
if(navigator.clipboard&&navigator.clipboard.writeText){navigator.clipboard.writeText(text).then(done).catch(function(){done()})}else{done()}
}
function ordConfirm(msg,fn){
if(typeof uiConfirm==='function')uiConfirm(msg,'Konfirmasi',function(){fn()});
else if(confirm(msg))fn();
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
var card=ce('div','ord-card '+ordUrg(o.status));
card.setAttribute('data-id',o.id);
var top=ce('div','ord-top');
top.appendChild(ce('span','ord-code',o.order_code||('#'+o.id)));
var sp=ordStatusPill(o.status);
top.appendChild(ce('span',sp.cls,sp.txt));
card.appendChild(top);
card.appendChild(ce('p','ord-res',(o.username||'?')+(o.display_name?(' • '+o.display_name):'')));
var sum=(o.items_summary||[]).map(function(i){return i.app_name+' ×'+i.qty}).join(', ');
card.appendChild(ce('p','ord-sum',sum||'Tidak ada item'));
var bot=ce('div','ord-bot');
bot.appendChild(ce('span','ord-date',ordFmtDT(o.created_at)));
bot.appendChild(ce('span','ord-total',ordFmtRp(o.total_amount)));
card.appendChild(bot);
if(o.status==='delivered'&&o.expires_at){
var cdw=ce('div','ord-cd');
var t=ce('span','cd-tag');
t.setAttribute('data-cd',o.expires_at);
cdw.appendChild(t);
card.appendChild(cdw);
}
card.addEventListener('click',function(){openOrderDetail(o.id)});
return card;
}
function rcpRow(l,v){
var r=ce('div','rcp-row');
r.appendChild(ce('span','rcp-lbl',l));
r.appendChild(ce('span','rcp-val',String(v)));
return r;
}
function rcpTitle(t){return ce('p','rcp-title',t)}
function credRow(k,v,maskable){
var row=ce('div','rcp-cred-row');
row.appendChild(ce('span','rcp-cred-lbl',k));
var val=ce('span','rcp-cred-val',maskable?ordMask(v):String(v));
row.appendChild(val);
if(maskable){
var shown=false;
var eye=ce('button','rcp-mini','Lihat');
eye.type='button';
eye.addEventListener('click',function(){shown=!shown;val.textContent=shown?String(v):ordMask(v);eye.textContent=shown?'Tutup':'Lihat'});
row.appendChild(eye);
var cp=ce('button','rcp-mini','Salin');
cp.type='button';
cp.addEventListener('click',function(){ordCopy(String(v),cp)});
row.appendChild(cp);
}
return row;
}
function buildReceiptItem(o,it){
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
var fd=ordParse(it.form_data);
var fk=Object.keys(fd);
if(fk.length){
var sub=ce('div','rcp-sub');
sub.appendChild(rcpTitle('Data Pesanan'));
fk.forEach(function(k){sub.appendChild(credRow(k,fd[k],false))});
box.appendChild(sub);
}
var creds=(o.credentials||[]).filter(function(c){return c.order_item_id===it.id&&c.fields});
if(creds.length){
var sub2=ce('div','rcp-sub');
sub2.appendChild(rcpTitle('Kredensial Terkirim'));
creds.forEach(function(c){
var obj=ordParse(c.fields);
Object.keys(obj).forEach(function(k){sub2.appendChild(credRow(k,obj[k],true))});
if(c.buyer_note)sub2.appendChild(credRow('Info Pembeli',c.buyer_note,false));
});
box.appendChild(sub2);
}
if(it.revisions&&it.revisions.length){
var sub3=ce('div','rcp-sub');
sub3.appendChild(rcpTitle('Catatan Revisi'));
it.revisions.forEach(function(rv,idx){
var rev=ce('div','rcp-rev');
rev.appendChild(ce('p','rcp-rev-head','Revisi '+(idx+1)+' • '+ordFmtDT(rv.created_at)+' • '+rv.created_by));
var ro=ordParse(rv.fields);
Object.keys(ro).forEach(function(k){rev.appendChild(credRow(k,ro[k],false))});
rev.appendChild(ce('p','rcp-rev-note','“'+rv.note+'”'));
sub3.appendChild(rev);
});
box.appendChild(sub3);
}
var rvBtn=ce('button','rcp-mini','＋ Catat Revisi');
rvBtn.type='button';
rvBtn.style.alignSelf='flex-start';
rvBtn.addEventListener('click',function(){openRevisionModal(o,it)});
box.appendChild(rvBtn);
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
s2.appendChild(rcpRow(py.provider+' • '+py.status,ordFmtRp(py.gross_amount)+(py.provider_tx_id?(' • '+py.provider_tx_id):'')));
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
var waRow=ce('div','rcp-row');
waRow.appendChild(ce('span','rcp-lbl','WhatsApp'));
var waVal=ce('span','rcp-val',rs.whatsapp);
waRow.appendChild(waVal);
var waCp=ce('button','rcp-mini','Salin');
waCp.type='button';
waCp.addEventListener('click',function(){ordCopy(rs.whatsapp,waCp)});
waRow.appendChild(waCp);
s3.appendChild(waRow);
}
if(rs&&rs.x_username)s3.appendChild(rcpRow('Akun X',rs.x_username));
wrap.appendChild(s3);
var s4=ce('div','rcp-sec');
s4.appendChild(rcpTitle('Item'));
(o.items||[]).forEach(function(it){s4.appendChild(buildReceiptItem(o,it))});
if(!(o.items&&o.items.length))s4.appendChild(rcpRow('Item','Tidak ada'));
wrap.appendChild(s4);
var s5=ce('div','rcp-sec');
var totalQty=(o.items||[]).reduce(function(a,b){return a+(b.qty||0)},0);
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
});
