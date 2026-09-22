var stockTemplates=[],stockMgrVariant=null,stockCtx=null;
function maskVal(v){v=String(v==null?'':v);if(!v)return'';if(v.length<=4)return'•'.repeat(v.length);return v.slice(0,2)+'•'.repeat(Math.min(8,v.length-4))+v.slice(-2)}
function stockHeaders(){return{'Content-Type':'application/json','x-admin-password':sessionPass}}
function openModal(id){var m=document.getElementById(id);if(!m)return;m.classList.remove('hidden');var bd=m.querySelector('.modal-backdrop');var bx=m.querySelector('.modal-box');setTimeout(function(){if(bd)bd.classList.add('show');if(bx)bx.classList.add('show')},10)}
function closeModal(id){var m=document.getElementById(id);if(!m)return;var bd=m.querySelector('.modal-backdrop');var bx=m.querySelector('.modal-box');if(bd)bd.classList.remove('show');if(bx)bx.classList.remove('show');setTimeout(function(){m.classList.add('hidden')},300)}
function okJson(r){
if(!r.ok){
return r.text().then(function(tx){var msg='HTTP '+r.status;try{var d=JSON.parse(tx);if(d&&d.error)msg=d.error}catch(e){}throw new Error(msg)});
}
return r.json();
}
function loadTemplates(){
fetch('/api/admin/cred-templates',{headers:{'x-admin-password':sessionPass}})
.then(function(r){return r.json()})
.then(function(rows){stockTemplates=Array.isArray(rows)?rows:[]})
.catch(function(){stockTemplates=[]});
}
function memoryFields(appName){
if(!Array.isArray(stockTemplates))stockTemplates=[];
var t=stockTemplates.find(function(x){return String(x.app_name||'').toLowerCase()===String(appName||'').toLowerCase()});
if(!t)return[];
try{var a=JSON.parse(t.fields);return Array.isArray(a)?a.slice(0,30):[]}catch(e){return[]}
}
function closeAllKebab(){var ws=document.querySelectorAll('.kebab-wrap.open');for(var i=0;i<ws.length;i++)ws[i].classList.remove('open')}
function stockPill(st){
if(st==='available')return{cls:'green',txt:'Tersedia'};
if(st==='disabled')return{cls:'gray',txt:'Nonaktif'};
return{cls:'red',txt:'Terjual'};
}
function stockOpenManager(variant){
stockMgrVariant=variant;
var sub=document.getElementById('stockMgrSub');
if(sub&&variant)sub.textContent=variant.app_name+' • '+variant.category+' • '+variant.duration;
openModal('stockManagerModal');
stockRenderManager();
}
function stockRenderManager(){
var list=document.getElementById('stockMgrList');
if(!list)return;
while(list.firstChild)list.removeChild(list.firstChild);
if(!stockMgrVariant){list.appendChild(ce('div','empty-state','Varian tidak dipilih.'));return}
list.appendChild(ce('div','loading-state','Memuat stok...'));
fetch('/api/admin/stock/'+stockMgrVariant.id+'?limit=100',{headers:{'x-admin-password':sessionPass}})
.then(okJson)
.then(function(data){
while(list.firstChild)list.removeChild(list.firstChild);
var sub=document.getElementById('stockMgrSub');
if(sub&&stockMgrVariant)sub.textContent=stockMgrVariant.app_name+' • '+stockMgrVariant.category+' • '+stockMgrVariant.duration+' — '+data.available+' tersedia';
if(!data.items||!data.items.length){list.appendChild(ce('div','empty-state','Belum ada stok untuk varian ini.'));return}
data.items.forEach(function(it){list.appendChild(buildStockRow(it))});
})
.catch(function(err){
while(list.firstChild)list.removeChild(list.firstChild);
var box=ce('div','empty-state');
box.appendChild(ce('p',null,'Gagal memuat stok.'+(err&&err.message?(' ('+err.message+')'):'')));
var retry=ce('button','tool-btn sky','↻ Coba Lagi');
retry.type='button';
retry.style.marginTop='.5rem';
retry.addEventListener('click',function(){stockRenderManager()});
box.appendChild(retry);
list.appendChild(box);
});
}
function buildStockRow(it){
var row=ce('div','fs-item');
var info=ce('div','fs-item-info');
var preview='';
try{var obj=JSON.parse(it.fields);preview=Object.keys(obj).map(function(k){return k+': '+(it.status==='available'?maskVal(obj[k]):'•••')}).join(' | ')}catch(e){preview='(data tidak valid)'}
info.appendChild(ce('p','fs-item-name','#'+it.id+' — '+preview));
var metaP=ce('p','fs-item-price');
var pl=stockPill(it.status);
metaP.appendChild(ce('span','pill '+pl.cls,pl.txt));
if(it.sold_at)metaP.appendChild(document.createTextNode(' • terjual '+it.sold_at));
info.appendChild(metaP);
row.appendChild(info);
var act=ce('div','fs-item-actions');
var viewBtn=ce('button','fs-edit-btn stk-inline','Lihat');
viewBtn.type='button';
viewBtn.addEventListener('click',function(){viewStockItem(it)});
act.appendChild(viewBtn);
if(it.status!=='sold'){
var editBtn=ce('button','fs-edit-btn stk-inline','Edit');
editBtn.type='button';
editBtn.addEventListener('click',function(){stockOpenEdit(it)});
act.appendChild(editBtn);
var togBtn=ce('button','fs-edit-btn stk-inline',it.status==='available'?'Nonaktif':'Aktifkan');
togBtn.type='button';
togBtn.addEventListener('click',function(){toggleStockItem(it)});
act.appendChild(togBtn);
}
if(it.status==='available'){
var delBtn=ce('button','fs-remove-btn stk-inline','Hapus');
delBtn.type='button';
delBtn.addEventListener('click',function(){deleteStockItem(it)});
act.appendChild(delBtn);
}
var kw=ce('div','kebab-wrap stk-kebab');
var kb=ce('button','kebab-btn','⋮');
kb.type='button';
kb.setAttribute('aria-label','Menu aksi');
kb.addEventListener('click',function(e){
e.stopPropagation();
var wasOpen=kw.classList.contains('open');
closeAllKebab();
if(!wasOpen)kw.classList.add('open');
});
kw.appendChild(kb);
var menu=ce('div','kebab-menu');
menu.appendChild(kebabItem('Lihat',false,function(){viewStockItem(it)}));
if(it.status!=='sold'){
menu.appendChild(kebabItem('Edit',false,function(){stockOpenEdit(it)}));
menu.appendChild(kebabItem(it.status==='available'?'Nonaktifkan':'Aktifkan',false,function(){toggleStockItem(it)}));
}
if(it.status==='available'){
menu.appendChild(kebabItem('Hapus',true,function(){deleteStockItem(it)}));
}
kw.appendChild(menu);
act.appendChild(kw);
row.appendChild(act);
return row;
}
function kebabItem(label,danger,fn){
var b=ce('button','kebab-item'+(danger?' danger':''),label);
b.type='button';
b.addEventListener('click',function(){closeAllKebab();fn()});
return b;
}
function viewStockItem(it){
try{var o=JSON.parse(it.fields);uiAlert(Object.keys(o).map(function(k){return k+': '+o[k]}).join('\n'),'Kredensial #'+it.id)}catch(e){uiAlert('Data tidak valid','Kesalahan')}
}
function toggleStockItem(it){
if(it.status==='available'){
uiConfirm('Nonaktifkan stok #'+it.id+' sementara?\nItem tidak bisa dijual sampai diaktifkan kembali.','Nonaktifkan Stok',function(){
fetch('/api/admin/stock/'+it.id+'/disable',{method:'POST',headers:stockHeaders()}).then(okJson).then(function(){uiToast('Stok dinonaktifkan.');stockAfterChange()}).catch(function(e){uiAlert(e.message||'Gagal menonaktifkan stok.','Kesalahan')});
});
}else if(it.status==='disabled'){
uiConfirm('Aktifkan kembali stok #'+it.id+'?\nItem akan kembali bisa dijual.','Aktifkan Stok',function(){
fetch('/api/admin/stock/'+it.id+'/enable',{method:'POST',headers:stockHeaders()}).then(okJson).then(function(){uiToast('Stok diaktifkan.');stockAfterChange()}).catch(function(e){uiAlert(e.message||'Gagal mengaktifkan stok.','Kesalahan')});
});
}
}
function deleteStockItem(it){
uiConfirm('Hapus permanen stok #'+it.id+'?\nTindakan tidak dapat dibatalkan.','Hapus Stok',function(){
fetch('/api/admin/stock/'+it.id,{method:'DELETE',headers:{'x-admin-password':sessionPass}}).then(okJson).then(function(){uiToast('Stok dihapus.');stockAfterChange()}).catch(function(e){uiAlert(e.message||'Gagal menghapus stok.','Kesalahan')});
},{danger:true,okText:'Hapus'});
}
function stockAfterChange(){stockRenderManager();if(typeof loadResellerPricelist==='function')loadResellerPricelist()}
function stockOpenAdd(){
if(!stockMgrVariant)return;
var names=memoryFields(stockMgrVariant.app_name);
var rows=names.length?names.map(function(n){return{name:n,value:''}}):[{name:'',value:''}];
stockCtx={variant:stockMgrVariant,mode:'add',stockId:null,rows:rows};
var t=document.getElementById('stockAddTitle');if(t)t.textContent='Tambah Stok';
var sub=document.getElementById('stockAddVariantName');
if(sub)sub.textContent=stockMgrVariant.app_name+' • '+stockMgrVariant.category+' • '+stockMgrVariant.duration;
renderBuilder();
openModal('stockAddModal');
}
function stockOpenEdit(it){
if(!stockMgrVariant)return;
var rows=[];
try{var o=JSON.parse(it.fields);for(var k in o){if(Object.prototype.hasOwnProperty.call(o,k))rows.push({name:k,value:String(o[k])})}}catch(e){rows=[]}
if(!rows.length)rows=[{name:'',value:''}];
stockCtx={variant:stockMgrVariant,mode:'edit',stockId:it.id,rows:rows};
var t=document.getElementById('stockAddTitle');if(t)t.textContent='Edit Stok #'+it.id;
var sub=document.getElementById('stockAddVariantName');
if(sub)sub.textContent=stockMgrVariant.app_name+' • '+stockMgrVariant.category+' • '+stockMgrVariant.duration;
renderBuilder();
openModal('stockAddModal');
}
function renderBuilder(){
var wrap=document.getElementById('stockAddFieldsContainer');
if(!wrap||!stockCtx)return;
while(wrap.firstChild)wrap.removeChild(wrap.firstChild);
if(!stockCtx.rows.length){wrap.appendChild(ce('div','empty-state','Belum ada baris. Klik ＋ Tambah Baris.'));return}
stockCtx.rows.forEach(function(rowItem,idx){
var r=ce('div','sf-row');
var nm=ce('input','sf-name');
nm.type='text';
nm.placeholder='Nama field (mis. email)';
nm.value=rowItem.name;
nm.addEventListener('input',function(){stockCtx.rows[idx].name=this.value});
var vl=ce('input','sf-val');
vl.type='text';
vl.placeholder='Isi / nilai';
vl.value=rowItem.value;
vl.addEventListener('input',function(){stockCtx.rows[idx].value=this.value});
var del=ce('button','sf-del');
del.type='button';
del.title='Hapus baris';
del.appendChild(admSvg('M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16','.875rem','.875rem'));
del.addEventListener('click',function(){stockCtx.rows.splice(idx,1);renderBuilder()});
r.appendChild(nm);r.appendChild(vl);r.appendChild(del);
wrap.appendChild(r);
});
}
function submitStock(){
if(!stockCtx)return;
var obj={};
for(var i=0;i<stockCtx.rows.length;i++){
var name=String(stockCtx.rows[i].name||'').trim();
var val=String(stockCtx.rows[i].value||'').trim();
if(!name||!val)return uiAlert('Baris '+(i+1)+': nama field dan isi wajib diisi.','Data Belum Lengkap');
if(Object.prototype.hasOwnProperty.call(obj,name))return uiAlert('Nama field duplikat: '+name,'Data Belum Lengkap');
obj[name]=val;
}
if(!Object.keys(obj).length)return uiAlert('Minimal satu baris diperlukan.','Data Belum Lengkap');
var btn=document.getElementById('btnSubmitStockAdd');
if(btn){btn.disabled=true;btn.textContent='Menyimpan...'}
var isEdit=stockCtx.mode==='edit';
var url=isEdit?('/api/admin/stock/'+stockCtx.stockId):('/api/admin/stock/'+stockCtx.variant.id);
fetch(url,{method:isEdit?'PUT':'POST',headers:stockHeaders(),body:JSON.stringify({fields:obj})})
.then(okJson)
.then(function(){closeModal('stockAddModal');uiToast(isEdit?'Stok diperbarui.':'Stok ditambahkan.');stockCtx=null;stockAfterChange()})
.catch(function(e){uiAlert(e.message||'Gagal menyimpan stok.','Kesalahan')})
.finally(function(){if(btn){btn.disabled=false;btn.textContent='Simpan Stok'}});
}
function healthCheck(){
var checks={
'uiAlert':typeof uiAlert==='function',
'uiConfirm':typeof uiConfirm==='function',
'uiToast':typeof uiToast==='function',
'uiAct':typeof uiAct==='function',
'admSvg':typeof admSvg==='function',
'ce':typeof ce==='function',
'sessionPass':typeof sessionPass==='string'
};
var missing=[];
for(var k in checks){if(!checks[k])missing.push(k)}
if(!missing.length){try{uiToast('✓ Modul siap ['+window.uiVersion+']')}catch(e){}}
else{try{uiToast('✗ Hilang: '+missing.join(', ')+' ['+window.uiVersion+']',true)}catch(e){}}
}
(function(){
loadTemplates();
if(typeof uiAct==='function'){
uiAct('mgr:add',function(){stockOpenAdd()});
uiAct('add:row',function(){if(stockCtx){stockCtx.rows.push({name:'',value:''});renderBuilder()}});
uiAct('add:submit',function(){submitStock()});
uiAct('close:stockMgr',function(){closeAllKebab();closeModal('stockManagerModal')});
uiAct('close:stockAdd',function(){closeModal('stockAddModal');stockCtx=null});
}
document.addEventListener('click',function(e){
var t=e.target;
var inside=t.closest?t.closest('.kebab-wrap'):null;
if(!inside)closeAllKebab();
},true);
setTimeout(healthCheck,1000);
})();
