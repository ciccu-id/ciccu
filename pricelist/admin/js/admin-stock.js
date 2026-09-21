var stockCatalog=[],stockTemplates=[],stockCurrentVariant=null,stockCurrentFields=[],credTplFields=[],credTplApp='';
function maskVal(v){v=String(v==null?'':v);if(!v)return'';if(v.length<=4)return'•'.repeat(v.length);return v.slice(0,2)+'•'.repeat(Math.min(8,v.length-4))+v.slice(-2)}
function stockHeaders(){return{'Content-Type':'application/json','x-admin-password':sessionPass}}
function openModal(id){var m=document.getElementById(id);if(!m)return;m.classList.remove('hidden');var bd=m.querySelector('.modal-backdrop');var bx=m.querySelector('.modal-box');setTimeout(function(){if(bd)bd.classList.add('show');if(bx)bx.classList.add('show')},10)}
function closeModal(id){var m=document.getElementById(id);if(!m)return;var bd=m.querySelector('.modal-backdrop');var bx=m.querySelector('.modal-box');if(bd)bd.classList.remove('show');if(bx)bx.classList.remove('show');setTimeout(function(){m.classList.add('hidden')},300)}
function loadStockCatalog(){
fetch('/api/admin/reseller-prices',{headers:{'x-admin-password':sessionPass}}).then(function(r){return r.json()}).then(function(rows){
stockCatalog=rows||[];
var sel=document.getElementById('stockVariantSelect');
if(!sel)return;
while(sel.firstChild)sel.removeChild(sel.firstChild);
stockCatalog.forEach(function(r){
if(r.reseller_price==='')return;
var op=document.createElement('option');
op.value=r.id;
op.textContent=r.app_name+' • '+r.category+' • '+r.duration+' ('+r.reseller_price+')';
sel.appendChild(op);
});
}).catch(function(e){console.error('Gagal memuat katalog stok',e)});
}
function loadTemplates(){
fetch('/api/admin/cred-templates',{headers:{'x-admin-password':sessionPass}}).then(function(r){return r.json()}).then(function(rows){stockTemplates=rows||[];refreshStockTemplate()}).catch(function(){});
}
function currentTemplateFields(appName){
var t=stockTemplates.find(function(x){return x.app_name.toLowerCase()===String(appName||'').toLowerCase()});
if(!t)return[];
try{var a=JSON.parse(t.fields);return Array.isArray(a)?a:[]}catch(e){return[]}
}
function refreshStockTemplate(){
var sel=document.getElementById('stockVariantSelect');
if(!sel||!sel.value)return;
var v=stockCatalog.find(function(c){return String(c.id)===sel.value});
if(!v)return;
stockCurrentVariant=v;
stockCurrentFields=currentTemplateFields(v.app_name);
var info=document.getElementById('stockTemplateInfo');
if(info)info.textContent=stockCurrentFields.length?('Template '+v.app_name+': '+stockCurrentFields.join(', ')):('Belum ada template untuk '+v.app_name+'. Buka "Template Field" untuk membuatnya.');
}
function loadStockList(){
var sel=document.getElementById('stockVariantSelect');
if(!sel||!sel.value)return;
var list=document.getElementById('stockList');
if(!list)return;
while(list.firstChild)list.removeChild(list.firstChild);
list.appendChild(ce('div','loading-state','Memuat stok...'));
fetch('/api/admin/stock/'+sel.value+'?limit=100',{headers:{'x-admin-password':sessionPass}}).then(function(r){return r.json()}).then(function(data){
while(list.firstChild)list.removeChild(list.firstChild);
var cnt=document.getElementById('stockAvailCount');
if(cnt)cnt.textContent=data.available+' tersedia';
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
disBtn.addEventListener('click',function(){if(!confirm('Nonaktifkan stok #'+it.id+'?'))return;fetch('/api/admin/stock/'+it.id+'/disable',{method:'POST',headers:stockHeaders()}).then(handleResponseStatus).then(function(){loadStockList();loadLowStock()}).catch(function(){})});
act.appendChild(disBtn);
var delBtn=ce('button','fs-remove-btn','Hapus');
delBtn.setAttribute('type','button');
delBtn.addEventListener('click',function(){if(!confirm('Hapus stok #'+it.id+'?'))return;fetch('/api/admin/stock/'+it.id,{method:'DELETE',headers:{'x-admin-password':sessionPass}}).then(handleResponseStatus).then(function(){loadStockList();loadLowStock()}).catch(function(){})});
act.appendChild(delBtn);
}
row.appendChild(act);
list.appendChild(row);
});
}).catch(function(){while(list.firstChild)list.removeChild(list.firstChild);list.appendChild(ce('div','empty-state','Gagal memuat stok.'))});
}
function loadLowStock(){
var list=document.getElementById('lowStockList');
if(!list)return;
fetch('/api/admin/low-stock?threshold=5',{headers:{'x-admin-password':sessionPass}}).then(function(r){return r.json()}).then(function(rows){
while(list.firstChild)list.removeChild(list.firstChild);
if(!rows.length){list.appendChild(ce('div','empty-state','Semua stok aman 👍'));return}
rows.forEach(function(r){
var row=ce('div','fs-item');
var info=ce('div','fs-item-info');
info.appendChild(ce('p','fs-item-name',r.app_name+' • '+r.category+' • '+r.duration));
info.appendChild(ce('p','fs-item-price','sisa '+r.avail));
row.appendChild(info);
var act=ce('div','fs-item-actions');
var openBtn=ce('button','fs-edit-btn','Buka');
openBtn.setAttribute('type','button');
openBtn.addEventListener('click',function(){var sel=document.getElementById('stockVariantSelect');if(sel){sel.value=String(r.id);refreshStockTemplate();loadStockList()}});
act.appendChild(openBtn);
row.appendChild(act);
list.appendChild(row);
});
}).catch(function(){});
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
function openTemplateModal(){
if(!stockCurrentVariant)return alert('Pilih varian dulu untuk menentukan aplikasi.');
credTplApp=stockCurrentVariant.app_name;
credTplFields=currentTemplateFields(credTplApp).slice();
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
function openStockAddModal(){
if(!stockCurrentVariant)return alert('Pilih varian dulu.');
if(!stockCurrentFields.length)return alert('Buat template field dulu lewat "Template Field".');
var sub=document.getElementById('stockAddVariantName');
if(sub)sub.textContent=stockCurrentVariant.app_name+' • '+stockCurrentVariant.category+' • '+stockCurrentVariant.duration;
var wrap=document.getElementById('stockAddFieldsContainer');
while(wrap.firstChild)wrap.removeChild(wrap.firstChild);
stockCurrentFields.forEach(function(f){
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
var fields={};var ok=true;
stockCurrentFields.forEach(function(f){
var inp=document.querySelector('#stockAddFieldsContainer input[data-field="'+f+'"]');
var v=inp?inp.value.trim():'';
if(!v)ok=false;
fields[f]=v;
});
if(!ok)return alert('Semua field wajib diisi.');
var btn=document.getElementById('btnSubmitStockAdd');
if(btn){btn.disabled=true;btn.textContent='Menyimpan...'}
fetch('/api/admin/stock/'+stockCurrentVariant.id,{method:'POST',headers:stockHeaders(),body:JSON.stringify({fields:fields})})
.then(handleResponseStatus)
.then(function(){closeModal('stockAddModal');loadStockList();loadLowStock()})
.catch(function(){alert('Gagal menambah stok.')})
.finally(function(){if(btn){btn.disabled=false;btn.textContent='Simpan Stok'}});
}
function openStockBulkModal(){
if(!stockCurrentVariant)return alert('Pilih varian dulu.');
if(!stockCurrentFields.length)return alert('Buat template field dulu lewat "Template Field".');
var sub=document.getElementById('stockBulkVariantName');
if(sub)sub.textContent=stockCurrentVariant.app_name+' • '+stockCurrentVariant.category+' • '+stockCurrentVariant.duration+' (urutan: '+stockCurrentFields.join(', ')+')';
var ta=document.getElementById('stockBulkText');
if(ta)ta.value='';
openModal('stockBulkModal');
}
function submitStockBulk(){
var ta=document.getElementById('stockBulkText');
if(!ta||!ta.value.trim())return alert('Isi data CSV dulu.');
var lines=ta.value.split(/\r?\n/);
var items=[];
for(var i=0;i<lines.length;i++){
var line=lines[i].trim();
if(!line)continue;
var cols=line.split(',').map(function(c){return c.trim()});
var obj={};var valid=true;
for(var f=0;f<stockCurrentFields.length;f++){var v=cols[f]||'';if(!v)valid=false;obj[stockCurrentFields[f]]=v}
if(valid)items.push(obj);
}
if(!items.length)return alert('Tidak ada baris valid sesuai template.');
if(!confirm('Import '+items.length+' item stok?'))return;
var btn=document.getElementById('btnSubmitStockBulk');
if(btn){btn.disabled=true;btn.textContent='Mengimport...'}
fetch('/api/admin/stock/'+stockCurrentVariant.id+'/bulk',{method:'POST',headers:stockHeaders(),body:JSON.stringify({items:items})})
.then(handleResponseStatus)
.then(function(){closeModal('stockBulkModal');loadStockList();loadLowStock()})
.catch(function(){alert('Gagal import bulk.')})
.finally(function(){if(btn){btn.disabled=false;btn.textContent='Import'}});
}
function loadStockTab(){loadStockCatalog();loadTemplates();loadLowStock()}
document.addEventListener('DOMContentLoaded',function(){
var btnLoad=document.getElementById('btnLoadStock');
if(btnLoad)btnLoad.addEventListener('click',function(){refreshStockTemplate();loadStockList()});
var sel=document.getElementById('stockVariantSelect');
if(sel)sel.addEventListener('change',function(){refreshStockTemplate();loadStockList()});
var bTpl=document.getElementById('btnOpenTpl');
if(bTpl)bTpl.addEventListener('click',openTemplateModal);
var bAdd=document.getElementById('btnOpenAddStock');
if(bAdd)bAdd.addEventListener('click',openStockAddModal);
var bBulk=document.getElementById('btnOpenBulk');
if(bBulk)bBulk.addEventListener('click',openStockBulkModal);
var bAddF=document.getElementById('btnAddCredField');
if(bAddF)bAddF.addEventListener('click',function(){credTplFields.push('');renderCredTplFields()});
var bSaveTpl=document.getElementById('btnSaveCredTemplate');
if(bSaveTpl)bSaveTpl.addEventListener('click',saveCredTemplate);
var bSubmitAdd=document.getElementById('btnSubmitStockAdd');
if(bSubmitAdd)bSubmitAdd.addEventListener('click',submitStockAdd);
var bSubmitBulk=document.getElementById('btnSubmitStockBulk');
if(bSubmitBulk)bSubmitBulk.addEventListener('click',submitStockBulk);
[['credTemplateModal','credTplClose','credTplBackdrop','credTplCancel'],['stockAddModal','stockAddClose','stockAddBackdrop','stockAddCancel'],['stockBulkModal','stockBulkClose','stockBulkBackdrop','stockBulkCancel']].forEach(function(cfg){
[ cfg[1],cfg[2],cfg[3] ].forEach(function(id){var el=document.getElementById(id);if(el)el.addEventListener('click',function(){closeModal(cfg[0])})});
});
});
