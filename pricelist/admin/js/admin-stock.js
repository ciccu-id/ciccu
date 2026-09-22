var stockTemplates=[],stockCtxVariant=null,stockMgrVariant=null,credTplFields=[],credTplApp='';
function maskVal(v){v=String(v==null?'':v);if(!v)return'';if(v.length<=4)return'•'.repeat(v.length);return v.slice(0,2)+'•'.repeat(Math.min(8,v.length-4))+v.slice(-2)}
function stockHeaders(){return{'Content-Type':'application/json','x-admin-password':sessionPass}}
function openModal(id){var m=document.getElementById(id);if(!m)return;m.classList.remove('hidden');var bd=m.querySelector('.modal-backdrop');var bx=m.querySelector('.modal-box');setTimeout(function(){if(bd)bd.classList.add('show');if(bx)bx.classList.add('show')},10)}
function closeModal(id){var m=document.getElementById(id);if(!m)return;var bd=m.querySelector('.modal-backdrop');var bx=m.querySelector('.modal-box');if(bd)bd.classList.remove('show');if(bx)bx.classList.remove('show');setTimeout(function(){m.classList.add('hidden')},300)}
function loadTemplates(){
fetch('/api/admin/cred-templates',{headers:{'x-admin-password':sessionPass}}).then(function(r){return r.json()}).then(function(rows){stockTemplates=rows||[]}).catch(function(){});
}
function currentTemplateFields(appName){
var t=stockTemplates.find(function(x){return x.app_name.toLowerCase()===String(appName||'').toLowerCase()});
if(!t)return[];
try{var a=JSON.parse(t.fields);return Array.isArray(a)?a:[]}catch(e){return[]}
}
function stockOpenManager(variant){
stockMgrVariant=variant;
var sub=document.getElementById('stockMgrSub');
if(sub)sub.textContent=variant.app_name+' • '+variant.category+' • '+variant.duration;
openModal('stockManagerModal');
stockRenderManager();
}
function stockRenderManager(){
var list=document.getElementById('stockMgrList');
if(!list||!stockMgrVariant)return;
while(list.firstChild)list.removeChild(list.firstChild);
list.appendChild(ce('div','loading-state','Memuat stok...'));
fetch('/api/admin/stock/'+stockMgrVariant.id+'?limit=100',{headers:{'x-admin-password':sessionPass}}).then(function(r){return r.json()}).then(function(data){
while(list.firstChild)list.removeChild(list.firstChild);
var sub=document.getElementById('stockMgrSub');
if(sub&&stockMgrVariant)sub.textContent=stockMgrVariant.app_name+' • '+stockMgrVariant.category+' • '+stockMgrVariant.duration+' — '+data.available+' tersedia';
if(!data.items.length){list.appendChild(ce('div','empty-state','Belum ada stok untuk varian ini.'));return}
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
viewBtn.addEventListener('click',function(){try{var obj=JSON.parse(it.fields);alert(Object.keys(obj).map(function(k){return k+': '+obj[k]}).join('\n'))}catch(e){alert('Data tidak valid')}});
act.appendChild(viewBtn);
if(it.status==='available'){
var disBtn=ce('button','fs-edit-btn','Nonaktif');
disBtn.setAttribute('type','button');
disBtn.addEventListener('click',function(){if(!confirm('Nonaktifkan stok #'+it.id+'?'))return;fetch('/api/admin/stock/'+it.id+'/disable',{method:'POST',headers:stockHeaders()}).then(handleResponseStatus).then(function(){stockAfterChange()}).catch(function(){})});
act.appendChild(disBtn);
var delBtn=ce('button','fs-remove-btn','Hapus');
delBtn.setAttribute('type','button');
delBtn.addEventListener('click',function(){if(!confirm('Hapus stok #'+it.id+'?'))return;fetch('/api/admin/stock/'+it.id,{method:'DELETE',headers:{'x-admin-password':sessionPass}}).then(handleResponseStatus).then(function(){stockAfterChange()}).catch(function(){})});
act.appendChild(delBtn);
}
row.appendChild(act);
list.appendChild(row);
});
}).catch(function(){while(list.firstChild)list.removeChild(list.firstChild);list.appendChild(ce('div','empty-state','Gagal memuat stok.'))});
}
function stockAfterChange(){
stockRenderManager();
if(typeof loadResellerPricelist==='function')loadResellerPricelist();
}
function stockOpenAdd(variant){
var fields=currentTemplateFields(variant.app_name);
if(!fields.length)return alert('Buat template field dulu lewat tombol 🧩 pada header aplikasi '+variant.app_name+'.');
stockCtxVariant=variant;
var sub=document.getElementById('stockAddVariantName');
if(sub)sub.textContent=variant.app_name+' • '+variant.category+' • '+variant.duration;
var wrap=document.getElementById('stockAddFieldsContainer');
while(wrap.firstChild)wrap.removeChild(wrap.firstChild);
fields.forEach(function(f){
var field=ce('div','field');
field.appendChild(ce('label',null,f));
var inp=ce('input','form-input');
inp.setAttribute('type','text');
inp.setAttribute('data-field',f);
inp.placeholder='Isi '+f;
field.appendChild(inp);
wrap.appendChild(field);
});
openModal('stockAddModal');
}
function submitStockAdd(){
if(!stockCtxVariant)return;
var fields=currentTemplateFields(stockCtxVariant.app_name);
var obj={};var ok=true;
fields.forEach(function(f){
var inp=document.querySelector('#stockAddFieldsContainer input[data-field="'+f+'"]');
var v=inp?inp.value.trim():'';
if(!v)ok=false;
obj[f]=v;
});
if(!ok)return alert('Semua field wajib diisi.');
var btn=document.getElementById('btnSubmitStockAdd');
if(btn){btn.disabled=true;btn.textContent='Menyimpan...'}
fetch('/api/admin/stock/'+stockCtxVariant.id,{method:'POST',headers:stockHeaders(),body:JSON.stringify({fields:obj})})
.then(handleResponseStatus)
.then(function(){closeModal('stockAddModal');stockAfterChange()})
.catch(function(){alert('Gagal menambah stok.')})
.finally(function(){if(btn){btn.disabled=false;btn.textContent='Simpan Stok'}});
}
function stockOpenBulk(variant){
var fields=currentTemplateFields(variant.app_name);
if(!fields.length)return alert('Buat template field dulu lewat tombol 🧩 pada header aplikasi '+variant.app_name+'.');
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
if(!ta||!ta.value.trim())return alert('Isi data CSV dulu.');
var lines=ta.value.split(/\r?\n/);
var items=[];
for(var i=0;i<lines.length;i++){
var line=lines[i].trim();
if(!line)continue;
var cols=line.split(',').map(function(c){return c.trim()});
var obj={};var valid=true;
for(var f=0;f<fields.length;f++){var v=cols[f]||'';if(!v)valid=false;obj[fields[f]]=v}
if(valid)items.push(obj);
}
if(!items.length)return alert('Tidak ada baris valid sesuai template.');
if(!confirm('Import '+items.length+' item stok?'))return;
var btn=document.getElementById('btnSubmitStockBulk');
if(btn){btn.disabled=true;btn.textContent='Mengimport...'}
fetch('/api/admin/stock/'+stockCtxVariant.id+'/bulk',{method:'POST',headers:stockHeaders(),body:JSON.stringify({items:items})})
.then(handleResponseStatus)
.then(function(){closeModal('stockBulkModal');stockAfterChange()})
.catch(function(){alert('Gagal import bulk.')})
.finally(function(){if(btn){btn.disabled=false;btn.textContent='Import'}});
}
function renderCredTplFields(){
var wrap=document.getElementById('credTplFieldsContainer');
if(!wrap)return;
while(wrap.firstChild)wrap.removeChild(wrap.firstChild);
if(!credTplFields.length){wrap.appendChild(ce('div','empty-state','Belum ada field.'));return}
credTplFields.forEach(function(f,i){
var row=ce('div','form-field-row');
row.appendChild(ce('span','form-field-num',String(i+1)));
var inp=ce('input','form-field-input');
inp.setAttribute('type','text');
inp.placeholder='mis. email / password / profile_pin';
inp.value=f;
inp.addEventListener('input',function(){credTplFields[i]=this.value});
row.appendChild(inp);
var del=ce('button','form-field-del');
del.setAttribute('type','button');
del.appendChild(admSvg('M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16','1rem','1rem'));
del.addEventListener('click',function(){credTplFields.splice(i,1);renderCredTplFields()});
row.appendChild(del);
wrap.appendChild(row);
});
}
function stockOpenTemplate(appName){
credTplApp=appName;
credTplFields=currentTemplateFields(appName).slice();
var sub=document.getElementById('credTplAppName');
if(sub)sub.textContent=credTplApp;
renderCredTplFields();
openModal('credTemplateModal');
}
function saveCredTemplate(){
var arr=credTplFields.map(function(f){return String(f||'').trim()}).filter(Boolean);
fetch('/api/admin/cred-templates/'+encodeURIComponent(credTplApp),{method:'PUT',headers:stockHeaders(),body:JSON.stringify({fields:arr})})
.then(handleResponseStatus)
.then(function(){closeModal('credTemplateModal');loadTemplates()})
.catch(function(){alert('Gagal menyimpan template.')});
}
document.addEventListener('DOMContentLoaded',function(){
loadTemplates();
var bMgrAdd=document.getElementById('btnMgrAdd');
if(bMgrAdd)bMgrAdd.addEventListener('click',function(){if(stockMgrVariant)stockOpenAdd(stockMgrVariant)});
var bMgrBulk=document.getElementById('btnMgrBulk');
if(bMgrBulk)bMgrBulk.addEventListener('click',function(){if(stockMgrVariant)stockOpenBulk(stockMgrVariant)});
var bMgrTpl=document.getElementById('btnMgrTpl');
if(bMgrTpl)bMgrTpl.addEventListener('click',function(){if(stockMgrVariant)stockOpenTemplate(stockMgrVariant.app_name)});
var bAddF=document.getElementById('btnAddCredField');
if(bAddF)bAddF.addEventListener('click',function(){credTplFields.push('');renderCredTplFields()});
var bSaveTpl=document.getElementById('btnSaveCredTemplate');
if(bSaveTpl)bSaveTpl.addEventListener('click',saveCredTemplate);
var bSubmitAdd=document.getElementById('btnSubmitStockAdd');
if(bSubmitAdd)bSubmitAdd.addEventListener('click',submitStockAdd);
var bSubmitBulk=document.getElementById('btnSubmitStockBulk');
if(bSubmitBulk)bSubmitBulk.addEventListener('click',submitStockBulk);
[['credTemplateModal','credTplClose','credTplBackdrop','credTplCancel'],['stockAddModal','stockAddClose','stockAddBackdrop','stockAddCancel'],['stockBulkModal','stockBulkClose','stockBulkBackdrop','stockBulkCancel'],['stockManagerModal','stockMgrClose','stockMgrBackdrop',null]].forEach(function(cfg){
[cfg[1],cfg[2],cfg[3]].forEach(function(id){if(!id)return;var el=document.getElementById(id);if(el)el.addEventListener('click',function(){closeModal(cfg[0])})});
});
});
