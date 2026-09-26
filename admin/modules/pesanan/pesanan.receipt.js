(function(M){
function parse(s){try{var o=JSON.parse(s);return(o&&typeof o==='object'&&!Array.isArray(o))?o:{}}catch(e){return{}}}
function parseForm(s){
if(!s)return[];
try{
var o=JSON.parse(s);
if(Array.isArray(o))return o.filter(function(x){return x&&typeof x==='object'&&!Array.isArray(x)});
if(o&&typeof o==='object')return[o];
}catch(e){}
return[];
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
a.href=href;a.target='_blank';a.rel='noopener';a.textContent=text;
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
function tkBtn(label,cls,fn){
var b=ce('button',cls,label);b.type='button';
b.addEventListener('click',fn);
return b;
}
function ordPost(path,body,after){
Sec.raw('/api/admin/orders/'+path,{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(body||{})})
.then(function(r){return r.json().then(function(d){return{ok:r.ok,d:d}})})
.then(function(res){
if(!res.ok)throw new Error(res.d.error||'Gagal');
uiToast('Tindakan berhasil.');
if(M.loadOrders)M.loadOrders();
if(after)after();
})
.catch(function(e){uiAlert(e.message||'Gagal menjalankan aksi.','Kesalahan')});
}
function addTakeover(act,o,reloadDetail){
if(o.status==='pending_payment'){
act.appendChild(tkBtn('Lunas & Proses','tool-btn green',function(){uiConfirm('Tandai pembayaran lunas lalu proses order ini?',function(){ordPost(o.id+'/settle',{},reloadDetail)})}));
act.appendChild(tkBtn('Proses Manual','tool-btn sky',function(){uiConfirm('Alokasikan stok dan tandai terkirim tanpa menunggu pembayaran?',function(){ordPost(o.id+'/process',{},reloadDetail)})}));
act.appendChild(tkBtn('Batalkan','tool-btn',function(){uiConfirm('Batalkan order ini?',function(){ordPost(o.id+'/set-status',{status:'cancelled'},reloadDetail)})}));
}
if(o.status==='needs_attention'){
act.appendChild(tkBtn('Proses Ulang','tool-btn green',function(){uiConfirm('Proses ulang fulfillment order ini?',function(){ordPost(o.id+'/fulfill',{},reloadDetail)})}));
act.appendChild(tkBtn('Jadikan Pending','tool-btn sky',function(){uiConfirm('Kembalikan order ke status menunggu pembayaran?',function(){ordPost(o.id+'/set-status',{status:'pending_payment'},reloadDetail)})}));
act.appendChild(tkBtn('Refund','tool-btn',function(){uiConfirm('Refund order ini?',function(){ordPost(o.id+'/refund',{return_stock:false},reloadDetail)})}));
}
if(o.status==='delivered'){
act.appendChild(tkBtn('Refund','tool-btn',function(){uiConfirm('Refund order ini?',function(){ordPost(o.id+'/refund',{return_stock:false},reloadDetail)})}));
}
}
function buildItem(o,it,autoOpen){
var box=ce('div','rcp-item');
var head=ce('div','rcp-item-head');
head.appendChild(ce('span','rcp-item-name',it.app_name));
head.appendChild(ce('span','rcp-item-sum',fmtRp(it.line_total)));
box.appendChild(head);
box.appendChild(ce('p','rcp-item-meta',it.category+' • '+it.duration+' • '+it.qty+' × '+fmtRp(it.unit_price)));
if(it.expires_at){
var cw=ce('p','rcp-item-meta');
cw.appendChild(document.createTextNode('Masa aktif: '));
var ct=ce('span','cd-tag');
ct.setAttribute('data-cd',it.expires_at);
cw.appendChild(ct);
box.appendChild(cw);
}
var farr=parseForm(it.form_data);
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
var obj=parse(c.fields);
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
rev.appendChild(ce('p','rcp-rev-head','Revisi '+(idx+1)+' • '+fmtDT(rv.created_at)+' • '+rv.created_by));
var ro=parse(rv.fields);
Object.keys(ro).forEach(function(k){rev.appendChild(credRow(k,ro[k]))});
rev.appendChild(ce('p','rcp-rev-note','“'+rv.note+'”'));
rsec.appendChild(rev);
});
cbody.appendChild(rsec);
}
var rvBtn=ce('button','rcp-mini','＋ Catat Revisi');
rvBtn.type='button';
rvBtn.addEventListener('click',function(){openRevision(o,it)});
cbody.appendChild(rvBtn);
details.appendChild(cbody);
box.appendChild(details);
return box;
}
function render(o){
var wrap=ce('div','rcp');
var s1=ce('div','rcp-sec');
s1.appendChild(ce('p','rcp-center',o.order_code||('#'+o.id)));
s1.appendChild(rcpRow('Tanggal',fmtDT(o.created_at)));
var sp=M.statusPill(o.status);
var stRow=ce('div','rcp-row');
stRow.appendChild(ce('span','rcp-lbl','Status'));
stRow.appendChild(ce('span',sp.cls,sp.txt));
s1.appendChild(stRow);
wrap.appendChild(s1);
var s2=ce('div','rcp-sec');
s2.appendChild(rcpTitle('Pembayaran'));
if(o.payments&&o.payments.length){
o.payments.forEach(function(py){
s2.appendChild(rcpRow(py.provider+' • '+py.status,fmtRp(py.gross_amount)));
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
items.forEach(function(it){s4.appendChild(buildItem(o,it,autoOpen))});
if(!items.length)s4.appendChild(rcpRow('Item','Tidak ada'));
wrap.appendChild(s4);
var s5=ce('div','rcp-sec');
var totalQty=items.reduce(function(a,b){return a+(b.qty||0)},0);
s5.appendChild(rcpRow('Total Item',String(totalQty)));
var totRow=ce('div','rcp-row');
totRow.appendChild(ce('span','rcp-lbl','Total'));
var totVal=ce('span','rcp-val',fmtRp(o.total_amount));
totRow.appendChild(totVal);
s5.appendChild(totRow);
wrap.appendChild(s5);
var act=ce('div','rcp-actions');
addTakeover(act,o,function(){M.openDetail(o.id)});
if(act.childNodes.length)wrap.appendChild(act);
return wrap;
}
function openDetail(id){
Sec.json('/api/admin/orders/'+id).then(function(o){
if(!o||o.error){uiAlert((o&&o.error)||'Order tidak ditemukan.','Kesalahan');return}
var s=ModalKit.shell({title:'Detail Order',sub:o.order_code||('#'+o.id),scroll:true,wide:true});
s.body.appendChild(render(o));
s.foot.appendChild(ModalKit.btn('Tutup','submit-btn',s.close));
document.body.appendChild(s.overlay);
if(M.tickCd&&s.body)M.tickCd(s.body);
}).catch(function(){uiAlert('Gagal memuat detail pesanan.','Kesalahan')});
}
function openRevision(o,it){
var s=ModalKit.shell({title:'Catat Revisi Kredensial',sub:it.app_name+' • '+it.category+' • '+it.duration,scroll:true});
s.body.appendChild(ce('p','field-hint','Isi kredensial pengganti dan alasan revisi. Data asli tidak ditimpa; revisi tersimpan sebagai catatan riwayat.'));
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
s.body.appendChild(fieldsWrap);
var addRow=ce('button','add-field-btn','＋ Tambah Baris');
addRow.type='button';
addRow.addEventListener('click',function(){rows.push({name:'',value:''});renderRows()});
s.body.appendChild(addRow);
var noteWrap=ce('div','field');
var noteLbl=ce('label',null,'CATATAN REVISI (WAJIB)');
var noteTa=ce('textarea','form-input');
noteTa.rows=2;
noteTa.placeholder='Mis. password lama error, berikut data pengganti...';
noteWrap.appendChild(noteLbl);
noteWrap.appendChild(noteTa);
s.body.appendChild(noteWrap);
var save=ModalKit.btn('Simpan Revisi','submit-btn',function(){
var obj={};
for(var i=0;i<rows.length;i++){
var nm=String(rows[i].name||'').trim();
var vl=String(rows[i].value||'').trim();
if(!nm&&!vl)continue;
if(!nm||!vl)return uiAlert('Baris '+(i+1)+': nama field dan isi wajib diisi.','Data Belum Lengkap');
obj[nm]=vl;
}
if(!Object.keys(obj).length)return uiAlert('Minimal satu baris kredensial diperlukan.','Data Belum Lengkap');
var note=String(noteTa.value||'').trim();
if(!note)return uiAlert('Catatan revisi wajib diisi.','Data Belum Lengkap');
save.disabled=true;save.textContent='Menyimpan...';
Sec.raw('/api/admin/orders/'+o.id+'/items/'+it.id+'/revisions',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({fields:obj,note:note})})
.then(function(r){return r.json().then(function(d){return{ok:r.ok,d:d}})})
.then(function(res){
if(!res.ok)throw new Error(res.d.error||'Gagal menyimpan revisi');
s.close();
uiToast('Revisi tercatat.');
openDetail(o.id);
})
.catch(function(e){uiAlert(e.message||'Gagal menyimpan revisi.','Kesalahan')})
.finally(function(){save.disabled=false;save.textContent='Simpan Revisi'});
});
s.foot.appendChild(ModalKit.btn('Batal','cancel-btn',s.close));
s.foot.appendChild(save);
document.body.appendChild(s.overlay);
}
M.buildReceipt=render;
M.openDetail=openDetail;
})(AdminModules.pesanan=AdminModules.pesanan||{});
