(function(M){
var templates=[],mgrVariant=null,ctx=null,mgrModal=null,mgrListWrap=null;
function loadTemplates(){return Sec.json('/api/admin/cred-templates').then(function(rows){templates=Array.isArray(rows)?rows:[]}).catch(function(){templates=[]})}
function memoryFields(appName){
if(!Array.isArray(templates))templates=[];
var t=templates.find(function(x){return String(x.app_name||'').toLowerCase()===String(appName||'').toLowerCase()});
if(!t)return[];
try{var a=JSON.parse(t.fields);return Array.isArray(a)?a.slice(0,30):[]}catch(e){return[]}
}
function stockPill(st){
if(st==='available')return{cls:'green',txt:'Tersedia'};
if(st==='reserved')return{cls:'amber',txt:'Dipesan'};
if(st==='disabled')return{cls:'gray',txt:'Nonaktif'};
return{cls:'red',txt:'Terjual'};
}
function kebabItem(label,danger,fn){
var b=ce('button','kebab-item'+(danger?' danger':''),label);
b.type='button';
b.addEventListener('click',function(){document.querySelectorAll('.kebab-wrap.open').forEach(function(w){w.classList.remove('open')});fn()});
return b;
}
function buildStockRow(it){
var card=ce('div','stk-card');
var head=ce('div','stk-card-head');
var idgrp=ce('div','stk-card-idgrp');
idgrp.appendChild(ce('span','stk-card-id','#'+it.id));
var pl=stockPill(it.status);
idgrp.appendChild(ce('span','pill '+pl.cls,pl.txt));
head.appendChild(idgrp);
var kw=null,menu=null;
if(it.status==='available'||it.status==='disabled'){
kw=ce('div','kebab-wrap');
var kb=ce('button','kebab-btn','⋮');
kb.type='button';
kb.setAttribute('aria-label','Menu aksi');
kb.addEventListener('click',function(e){
e.stopPropagation();
var wasOpen=kw.classList.contains('open');
document.querySelectorAll('.kebab-wrap.open').forEach(function(w){w.classList.remove('open')});
if(!wasOpen)kw.classList.add('open');
});
kw.appendChild(kb);
head.appendChild(kw);
menu=ce('div','kebab-menu');
menu.appendChild(kebabItem('Edit',false,function(){openEdit(it)}));
menu.appendChild(kebabItem(it.status==='available'?'Nonaktifkan':'Aktifkan',false,function(){toggleStockItem(it)}));
if(it.status==='available')menu.appendChild(kebabItem('Hapus',true,function(){deleteStockItem(it)}));
}
card.appendChild(head);
var fields=ce('div','stk-fields');
var obj={};
try{obj=JSON.parse(it.fields)||{}}catch(e){obj={}}
var keys=Object.keys(obj);
if(!keys.length)fields.appendChild(ce('div','empty-state','Data tidak valid'));
keys.forEach(function(k){
var f=ce('div','stk-field');
f.appendChild(ce('span','stk-field-label',k));
f.appendChild(ce('span','stk-field-val',String(obj[k])));
fields.appendChild(f);
});
card.appendChild(fields);
if(it.status==='reserved'){
var rn=ce('div','stk-note');
rn.appendChild(ce('span','stk-note-ico','⏳'));
rn.appendChild(ce('span','stk-note-txt','Stok sedang dikunci pesanan dan akan kembali otomatis jika belum dibayar.'));
card.appendChild(rn);
}
if(it.buyer_note&&String(it.buyer_note).trim()!==''){
var note=ce('div','stk-note');
note.appendChild(ce('span','stk-note-ico','📝'));
note.appendChild(ce('span','stk-note-txt',String(it.buyer_note)));
card.appendChild(note);
}
if(menu)card.appendChild(menu);
var dateTxt;
if(it.status==='sold'&&it.sold_at)dateTxt='terjual '+String(it.sold_at).slice(0,16);
else if(it.status==='reserved'&&it.reservation_expires_at)dateTxt='dikunci sampai '+fmtDT(it.reservation_expires_at);
else if(it.status==='reserved')dateTxt='sedang dipesan';
else dateTxt='dibuat '+String(it.created_at||'').slice(0,16);
card.appendChild(ce('span','stk-card-date',dateTxt));
return card;
}
function renderManager(){
var list=mgrListWrap;
if(!list)return;
while(list.firstChild)list.removeChild(list.firstChild);
if(!mgrVariant){list.appendChild(ce('div','empty-state','Varian tidak dipilih.'));return}
list.appendChild(ce('div','loading-state','Memuat stok...'));
Sec.json('/api/admin/stock/'+mgrVariant.id+'?limit=100').then(function(d){
while(list.firstChild)list.removeChild(list.firstChild);
if(!d.items||!d.items.length){list.appendChild(ce('div','empty-state','Belum ada stok untuk varian ini.'));return}
d.items.forEach(function(it){list.appendChild(buildStockRow(it))});
}).catch(function(err){
while(list.firstChild)list.removeChild(list.firstChild);
var box=ce('div','empty-state');
box.appendChild(ce('p',null,'Gagal memuat stok.'+(err&&err.message?(' ('+err.message+')'):'')));
var retry=ce('button','tool-btn sky','↻ Coba Lagi');
retry.type='button';
retry.addEventListener('click',function(){renderManager()});
box.appendChild(retry);
list.appendChild(box);
});
}
function openManager(variant){
mgrVariant=variant;
Promise.resolve(loadTemplates()).then(function(){
var s=ModalKit.shell({title:'Kelola Stok',sub:variant.app_name+' • '+variant.category+' • '+variant.duration,scroll:true,wide:true});
mgrModal=s;
var listWrap=ce('div');
listWrap.id='stockMgrList';
s.body.appendChild(listWrap);
mgrListWrap=listWrap;
var head=s.box.querySelector('.modal-head');
var addBtn=ce('button','modal-head-action','＋ Tambah Stok');
addBtn.type='button';
addBtn.addEventListener('click',function(){openAdd()});
var closeBtn=head.querySelector('.modal-close-btn');
head.insertBefore(addBtn,closeBtn);
document.body.appendChild(s.overlay);
renderManager();
});
}
function toggleStockItem(it){
if(it.status==='available'){
uiConfirm('Nonaktifkan stok #'+it.id+' sementara?\nItem tidak bisa dijual sampai diaktifkan kembali.','Nonaktifkan Stok',function(){
Sec.raw('/api/admin/stock/'+it.id+'/disable',{method:'POST'}).then(function(){uiToast('Stok dinonaktifkan.');afterChange()}).catch(function(e){uiAlert(e.message||'Gagal menonaktifkan stok.','Kesalahan')});
});
}else if(it.status==='disabled'){
uiConfirm('Aktifkan kembali stok #'+it.id+'?\nItem akan kembali bisa dijual.','Aktifkan Stok',function(){
Sec.raw('/api/admin/stock/'+it.id+'/enable',{method:'POST'}).then(function(){uiToast('Stok diaktifkan.');afterChange()}).catch(function(e){uiAlert(e.message||'Gagal mengaktifkan stok.','Kesalahan')});
});
}
}
function deleteStockItem(it){
uiConfirm('Hapus permanen stok #'+it.id+'?\nTindakan tidak dapat dibatalkan.','Hapus Stok',function(){
Sec.raw('/api/admin/stock/'+it.id,{method:'DELETE'}).then(function(){uiToast('Stok dihapus.');afterChange()}).catch(function(e){uiAlert(e.message||'Gagal menghapus stok.','Kesalahan')});
},{danger:true,okText:'Hapus'});
}
function afterChange(){renderManager();if(M.loadGroups)M.loadGroups()}
function renderBuilder(){
var wrap=ctx?ctx.fieldsWrap:null;
if(!wrap||!ctx)return;
while(wrap.firstChild)wrap.removeChild(wrap.firstChild);
if(!ctx.rows.length){wrap.appendChild(ce('div','empty-state','Belum ada baris. Klik ＋ Tambah Baris.'));return}
ctx.rows.forEach(function(rowItem,idx){
var r=ce('div','sf-row');
var nm=ce('input','sf-name');
nm.type='text';
nm.placeholder='Nama field (mis. email)';
nm.value=rowItem.name;
nm.addEventListener('input',function(){ctx.rows[idx].name=this.value});
var vl=ce('input','sf-val');
vl.type='text';
vl.placeholder='Isi / nilai';
vl.value=rowItem.value;
vl.addEventListener('input',function(){ctx.rows[idx].value=this.value});
var del=ce('button','sf-del');
del.type='button';
del.title='Hapus baris';
del.appendChild(admSvg('M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16','.875rem','.875rem'));
del.addEventListener('click',function(){ctx.rows.splice(idx,1);renderBuilder()});
r.appendChild(nm);r.appendChild(vl);r.appendChild(del);
wrap.appendChild(r);
});
}
function openStockForm(){
if(!ctx)return;
var isEdit=ctx.mode==='edit';
var s=ModalKit.shell({title:isEdit?'Edit Stok #'+ctx.stockId:'Tambah Stok',sub:ctx.variant.app_name+' • '+ctx.variant.category+' • '+ctx.variant.duration,scroll:true});
var fieldsWrap=ce('div','form-fields');
s.body.appendChild(fieldsWrap);
ctx.fieldsWrap=fieldsWrap;
renderBuilder();
var addRow=ce('button','add-field-btn','＋ Tambah Baris');
addRow.type='button';
addRow.addEventListener('click',function(){ctx.rows.push({name:'',value:''});renderBuilder()});
s.body.appendChild(addRow);
var noteWrap=ce('div','adm-field');
noteWrap.appendChild(ce('label',null,'CATATAN PEMBELI (OPSIONAL)'));
var noteBox=ce('div','adm-input');
var noteTa=ce('textarea','form-input');
noteTa.rows=2;
noteTa.placeholder='Mis. untuk akun utama pembeli';
noteTa.value=ctx.buyerNote||'';
noteBox.appendChild(noteTa);
noteWrap.appendChild(noteBox);
s.body.appendChild(noteWrap);
ctx.noteTa=noteTa;
var save=ModalKit.btn('Simpan Stok','submit-btn',function(){submitStock(save)});
s.foot.appendChild(ModalKit.btn('Batal','cancel-btn',s.close));
s.foot.appendChild(save);
ctx.modal=s;
document.body.appendChild(s.overlay);
}
function openAdd(){
if(!mgrVariant)return;
var names=memoryFields(mgrVariant.app_name);
var rows=names.length?names.map(function(n){return{name:n,value:''}}):[{name:'',value:''}];
ctx={variant:mgrVariant,mode:'add',stockId:null,rows:rows,buyerNote:''};
openStockForm();
}
function openEdit(it){
if(!mgrVariant)return;
var rows=[];
try{var o=JSON.parse(it.fields);for(var k in o){if(Object.prototype.hasOwnProperty.call(o,k))rows.push({name:k,value:String(o[k])})}}catch(e){rows=[]}
if(!rows.length)rows=[{name:'',value:''}];
ctx={variant:mgrVariant,mode:'edit',stockId:it.id,rows:rows,buyerNote:it.buyer_note||''};
openStockForm();
}
function submitStock(saveBtn){
if(!ctx)return;
var obj={};
for(var i=0;i<ctx.rows.length;i++){
var name=String(ctx.rows[i].name||'').trim();
var val=String(ctx.rows[i].value||'').trim();
if(!name||!val)return uiAlert('Baris '+(i+1)+': nama field dan isi wajib diisi.','Data Belum Lengkap');
if(Object.prototype.hasOwnProperty.call(obj,name))return uiAlert('Nama field duplikat: '+name,'Data Belum Lengkap');
obj[name]=val;
}
if(!Object.keys(obj).length)return uiAlert('Minimal satu baris diperlukan.','Data Belum Lengkap');
var buyerNote=ctx.noteTa?ctx.noteTa.value:'';
var isEdit=ctx.mode==='edit';
var url=isEdit?('/api/admin/stock/'+ctx.stockId):('/api/admin/stock/'+ctx.variant.id);
if(saveBtn){saveBtn.disabled=true;saveBtn.textContent='Menyimpan...'}
Sec.raw(url,{method:isEdit?'PUT':'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({fields:obj,buyer_note:buyerNote})})
.then(function(){
if(ctx.modal)ctx.modal.close();
uiToast(isEdit?'Stok diperbarui.':'Stok ditambahkan.');
ctx=null;
afterChange();
})
.catch(function(e){uiAlert(e.message||'Gagal menyimpan stok.','Kesalahan')})
.finally(function(){if(saveBtn){saveBtn.disabled=false;saveBtn.textContent='Simpan Stok'}});
}
M.stockInit=function(){return loadTemplates()};
M.openStock=openManager;
})(AdminModules.reseller=AdminModules.reseller||{});
