var stockTemplates=[],stockCtxVariant=null,stockMgrVariant=null,credTplFields=[],credTplApp='';
function maskVal(v){v=String(v==null?'':v);if(!v)return'';if(v.length<=4)return'•'.repeat(v.length);return v.slice(0,2)+'•'.repeat(Math.min(8,v.length-4))+v.slice(-2)}
function stockHeaders(){return{'Content-Type':'application/json','x-admin-password':sessionPass}}
function openModal(id){var m=document.getElementById(id);if(!m)return;m.classList.remove('hidden');var bd=m.querySelector('.modal-backdrop');var bx=m.querySelector('.modal-box');setTimeout(function(){if(bd)bd.classList.add('show');if(bx)bx.classList.add('show')},10)}
function closeModal(id){var m=document.getElementById(id);if(!m)return;var bd=m.querySelector('.modal-backdrop');var bx=m.querySelector('.modal-box');if(bd)bd.classList.remove('show');if(bx)bx.classList.remove('show');setTimeout(function(){m.classList.add('hidden')},300)}
function loadTemplates(){fetch('/api/admin/cred-templates',{headers:{'x-admin-password':sessionPass}}).then(function(r){return r.json()}).then(function(rows){stockTemplates=rows||[]}).catch(function(){})}
function currentTemplateFields(appName){var t=stockTemplates.find(function(x){return x.app_name.toLowerCase()===String(appName||'').toLowerCase()});if(!t)return[];try{var a=JSON.parse(t.fields);return Array.isArray(a)?a:[]}catch(e){return[]}}
function stockOpenManager(variant){
stockMgrVariant=variant;
var sub=document.getElementById('stockMgrSub');
if(sub&&variant)sub.textContent=variant.app_name+' • '+variant.category+' • '+variant.duration;
setupStockHandlers();
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
.then(function(r){
if(!r.ok)throw new Error('HTTP '+r.status);
return r.json();
})
.then(function(data){
while(list.firstChild)list.removeChild(list.firstChild);
var sub=document.getElementById('stockMgrSub');
if(sub&&stockMgrVariant)sub.textContent=stockMgrVariant.app_name+' • '+stockMgrVariant.category+' • '+stockMgrVariant.duration+' — '+data.available+' tersedia';
if(!data.items||!data.items.length){list.appendChild(ce('div','empty-state','Belum ada stok untuk varian ini.'));return}
data.items.forEach(function(it){
var row=ce('div','fs-item');
var info=ce('div','fs-item-info');
var preview='';
try{var obj=JSON.parse(it.fields);preview=Object.keys(obj).map(function(k){return k+': '+(it.status==='available'?maskVal(obj[k]):'•••')}).join(' | ')}catch(e){preview='(data tidak valid)'}
info.appendChild(ce('p','fs-item-name','#'+it.id+' — '+preview));
info.appendChild(ce('p','fs-item-price',it.status+(it.sold_at?(' • terjual '+it.sold_at):'')));
row.appendChild(info);
var act=ce('div','fs-item-actions');
var viewBtn=ce('button','fs-edit-btn','Lihat');
viewBtn.setAttribute('type','button');
viewBtn.addEventListener('click',function(){
try{var obj=JSON.parse(it.fields);uiAlert(Object.keys(obj).map(function(k){return k+': '+obj[k]}).join('\n'),'Kredensial #'+it.id)}catch(e){uiAlert('Data tidak valid','Kesalahan')}
});
act.appendChild(viewBtn);
if(it.status==='available'){
var disBtn=ce('button','fs-edit-btn','Nonaktif');
disBtn.setAttribute('type','button');
disBtn.addEventListener('click',function(){
uiConfirm('Nonaktifkan stok #'+it.id+'? Item tidak akan bisa dijual lagi.','Nonaktifkan Stok',function(){
fetch('/api/admin/stock/'+it.id+'/disable',{method:'POST',headers:stockHeaders()}).then(function(r){if(!r.ok)throw new Error('HTTP '+r.status);return r.json()}).then(function(){uiToast('Stok dinonaktifkan.');stockAfterChange()}).catch(function(){uiAlert('Gagal menonaktifkan stok.','Kesalahan')});
});
});
act.appendChild(disBtn);
var delBtn=ce('button','fs-remove-btn','Hapus');
delBtn.setAttribute('type','button');
delBtn.addEventListener('click',function(){
uiConfirm('Hapus permanen stok #'+it.id+'? Tindakan tidak dapat dibatalkan.','Hapus Stok',function(){
fetch('/api/admin/stock/'+it.id,{method:'DELETE',headers:{'x-admin-password':sessionPass}}).then(function(r){if(!r.ok)throw new Error('HTTP '+r.status);return r.json()}).then(function(){uiToast('Stok dihapus.');stockAfterChange()}).catch(function(){uiAlert('Gagal menghapus stok.','Kesalahan')});
},{danger:true,okText:'Hapus'});
});
act.appendChild(delBtn);
}
row.appendChild(act);
list.appendChild(row);
});
})
.catch(function(err){
while(list.firstChild)list.removeChild(list.firstChild);
var box=ce('div','empty-state');
box.appendChild(ce('p',null,'Gagal memuat stok.'+(err&&err.message?(' ('+err.message+')'):'')));
var retry=ce('button','tool-btn sky','↻ Coba Lagi');
retry.setAttribute('type','button');
retry.style.marginTop='.5rem';
retry.addEventListener('click',function(){stockRenderManager()});
box.appendChild(retry);
list.appendChild(box);
});
}
function stockAfterChange(){stockRenderManager();if(typeof loadResellerPricelist==='function')loadResellerPricelist()}
function stockOpenAdd(variant){
var fields=currentTemplateFields(variant.app_name);
if(!fields.length)return uiAlert('Buat template field dulu lewat tombol 🧩 Template pada aplikasi '+variant.app_name+'.','Template Belum Ada');
stockCtxVariant=variant;
var sub=document.getElementById('stockAddVariantName');
if(sub)sub.textContent=variant.app_name+' • '+variant.category+' • '+variant.duration;
var wrap=document.getElementById('stockAddFieldsContainer');
while(wrap.firstChild)wrap.removeChild(wrap.firstChild);
fields.forEach(function(f){
var field=ce('div','field');field.appendChild(ce('label',null,f));
var inp=ce('input','form-input');inp.setAttribute('type','text');inp.setAttribute('data-field',f);inp.placeholder='Isi '+f;
field.appendChild(inp);wrap.appendChild(field);
});
openModal('stockAddModal');
}
function submitStockAdd(){
if(!stockCtxVariant)return;
var fields=currentTemplateFields(stockCtxVariant.app_name);
var obj={};var ok=true;
fields.forEach(function(f){var inp=document.querySelector('#stockAddFieldsContainer input[data-field="'+f+'"]');var v=inp?inp.value.trim():'';if(!v)ok=false;obj[f]=v});
if(!ok)return uiAlert('Semua field wajib diisi.','Data Belum Lengkap');
var btn=document.getElementById('btnSubmitStockAdd');
if(btn){btn.disabled=true;btn.textContent='Menyimpan...'}
fetch('/api/admin/stock/'+stockCtxVariant.id,{method:'POST',headers:stockHeaders(),body:JSON.stringify({fields:obj})})
.then(function(r){if(!r.ok)throw new Error('HTTP '+r.status);return r.json()})
.then(function(){closeModal('stockAddModal');uiToast('Stok ditambahkan.');stockAfterChange()})
.catch(function(){uiAlert('Gagal menambah stok.','Kesalahan')})
.finally(function(){if(btn){btn.disabled=false;btn.textContent='Simpan Stok'}});
}
function stockOpenBulk(variant){
var fields=currentTemplateFields(variant.app_name);
if(!fields.length)return uiAlert('Buat template field dulu lewat tombol 🧩 Template pada aplikasi '+variant.app_name+'.','Template Belum Ada');
stockCtxVariant=variant;
var sub=document.getElementById('stockBulkVariantName');
if(sub)sub.textContent=variant.app_name+' • '+variant.category+' • '+variant.duration+' (urutan: '+fields.join(', ')+')';
var ta=document.getElementById('stockBulkText');
if(ta)ta.value='';
openModal('stockBulkModal');
}
function submitStockBulk(){
if(!stockCtxVariant)return;
var fields=currentTemplateFields(stockCtxVariant.app_name);
var ta=document.getElementById('stockBulkText');
if(!ta||!ta.value.trim())return uiAlert('Isi data CSV dulu.','Data Kosong');
var lines=ta.value.split(/\r?\n/);var items=[];
for(var i=0;i<lines.length;i++){var line=lines[i].trim();if(!line)continue;var cols=line.split(',').map(function(c){return c.trim()});var obj={};var valid=true;for(var f=0;f<fields.length;f++){var v=cols[f]||'';if(!v)valid=false;obj[fields[f]]=v}if(valid)items.push(obj)}
if(!items.length)return uiAlert('Tidak ada baris valid sesuai template.','Format Salah');
var count=items.length;
uiConfirm('Import '+count+' item stok ke varian ini?','Import Bulk',function(){
var btn=document.getElementById('btnSubmitStockBulk');
if(btn){btn.disabled=true;btn.textContent='Mengimport...'}
fetch('/api/admin/stock/'+stockCtxVariant.id+'/bulk',{method:'POST',headers:stockHeaders(),body:JSON.stringify({items:items})})
.then(function(r){if(!r.ok)throw new Error('HTTP '+r.status);return r.json()})
.then(function(){closeModal('stockBulkModal');uiToast(count+' item stok ditambahkan.');stockAfterChange()})
.catch(function(){uiAlert('Gagal import bulk.','Kesalahan')})
.finally(function(){if(btn){btn.disabled=false;btn.textContent='Import'}});
});
}
function renderCredTplFields(){
var wrap=document.getElementById('credTplFieldsContainer');
if(!wrap)return;
while(wrap.firstChild)wrap.removeChild(wrap.firstChild);
if(!credTplFields.length){wrap.appendChild(ce('div','empty-state','Belum ada field.'));return}
credTplFields.forEach(function(f,i){
var row=ce('div','form-field-row');
row.appendChild(ce('span','form-field-num',String(i+1)));
var inp=ce('input','form-field-input');inp.setAttribute('type','text');inp.placeholder='mis. email / password / profile_pin';inp.value=f;
inp.addEventListener('input',function(){credTplFields[i]=this.value});
row.appendChild(inp);
var del=ce('button','form-field-del');del.setAttribute('type','button');
del.appendChild(admSvg('M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16','1rem','1rem'));
del.addEventListener('click',function(){credTplFields.splice(i,1);renderCredTplFields()});
row.appendChild(del);
wrap.appendChild(row);
});
}
function stockOpenTemplate(appName){
credTplApp=appName;credTplFields=currentTemplateFields(appName).slice();
var sub=document.getElementById('credTplAppName');
if(sub)sub.textContent=credTplApp;
renderCredTplFields();
openModal('credTemplateModal');
}
function saveCredTemplate(){
var arr=credTplFields.map(function(f){return String(f||'').trim()}).filter(Boolean);
if(!arr.length)return uiAlert('Minimal satu field diperlukan.','Template Kosong');
fetch('/api/admin/cred-templates/'+encodeURIComponent(credTplApp),{method:'PUT',headers:stockHeaders(),body:JSON.stringify({fields:arr})})
.then(function(r){if(!r.ok)throw new Error('HTTP '+r.status);return r.json()})
.then(function(){closeModal('credTemplateModal');uiToast('Template disimpan.');loadTemplates()})
.catch(function(){uiAlert('Gagal menyimpan template.','Kesalahan')});
}
function setupStockHandlers(){
var map={
'btnMgrAdd':function(){if(stockMgrVariant)stockOpenAdd(stockMgrVariant)},
'btnMgrBulk':function(){if(stockMgrVariant)stockOpenBulk(stockMgrVariant)},
'btnMgrTpl':function(){if(stockMgrVariant)stockOpenTemplate(stockMgrVariant.app_name)},
'btnAddCredField':function(){credTplFields.push('');renderCredTplFields()},
'btnSaveCredTemplate':saveCredTemplate,
'btnSubmitStockAdd':submitStockAdd,
'btnSubmitStockBulk':submitStockBulk,
'stockMgrClose':function(){closeModal('stockManagerModal')},
'stockMgrBackdrop':function(){closeModal('stockManagerModal')},
'credTplClose':function(){closeModal('credTemplateModal')},
'credTplBackdrop':function(){closeModal('credTemplateModal')},
'credTplCancel':function(){closeModal('credTemplateModal')},
'stockAddClose':function(){closeModal('stockAddModal')},
'stockAddBackdrop':function(){closeModal('stockAddModal')},
'stockAddCancel':function(){closeModal('stockAddModal')},
'stockBulkClose':function(){closeModal('stockBulkModal')},
'stockBulkBackdrop':function(){closeModal('stockBulkModal')},
'stockBulkCancel':function(){closeModal('stockBulkModal')}
};
Object.keys(map).forEach(function(id){
var el=document.getElementById(id);
if(el&&!el._bound){el._bound=true;el.addEventListener('click',function(e){e.preventDefault();map[id]()})}
});
}
(function(){
loadTemplates();
if(document.readyState==='loading'){document.addEventListener('DOMContentLoaded',setupStockHandlers)}
else{setupStockHandlers()}
var pollCount=0;
var poll=setInterval(function(){
pollCount++;if(pollCount>50){clearInterval(poll);return}
setupStockHandlers();
var btn=document.getElementById('btnMgrAdd');
if(btn&&btn._bound)clearInterval(poll);
},100);
})();
