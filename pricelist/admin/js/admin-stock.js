var stockCatalog=[],stockTemplates=[],stockCurrentVariant=null,stockCurrentFields=[];
function maskVal(v){v=String(v==null?'':v);if(!v)return'';if(v.length<=4)return'•'.repeat(v.length);return v.slice(0,2)+'•'.repeat(Math.min(8,v.length-4))+v.slice(-2)}
function stockHeaders(){return{'Content-Type':'application/json','x-admin-password':sessionPass}}
function loadStockCatalog(){
fetch('/api/admin/reseller-prices',{headers:{'x-admin-password':sessionPass}}).then(function(r){return r.json()}).then(function(rows){
stockCatalog=rows;
var sel=document.getElementById('stockVariantSelect');
if(!sel)return;
while(sel.firstChild)sel.removeChild(sel.firstChild);
rows.forEach(function(r){
if(r.reseller_price==='')return;
var op=document.createElement('option');
op.value=r.id;
op.textContent=r.app_name+' • '+r.category+' • '+r.duration+' ('+r.price+' → '+r.reseller_price+')';
sel.appendChild(op);
});
}).catch(function(e){console.error('Gagal memuat katalog stok',e)});
}
function loadTemplates(){
fetch('/api/admin/cred-templates',{headers:{'x-admin-password':sessionPass}}).then(function(r){return r.json()}).then(function(rows){stockTemplates=rows;refreshStockTemplate()}).catch(function(){});
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
if(info)info.textContent=stockCurrentFields.length?('Template '+v.app_name+': '+stockCurrentFields.join(', ')):('Belum ada template untuk '+v.app_name+'. Isi di card Template Field.');
renderStockAddFields();
}
function renderStockAddFields(){
var wrap=document.getElementById('stockAddFields');
if(!wrap)return;
while(wrap.firstChild)wrap.removeChild(wrap.firstChild);
if(!stockCurrentFields.length){wrap.appendChild(ce('p','field-hint','Setel template dulu untuk menambah stok.'));return}
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
try{var obj=JSON.parse(it.fields);var keys=Object.keys(obj);preview=keys.map(function(k){return k+': '+(it.status==='available'?maskVal(obj[k]):'•••')}).join(' | ')}catch(e){preview='(data tidak valid)'}
info.appendChild(ce('p','fs-item-name','#'+it.id+' — '+preview));
info.appendChild(ce('p','fs-item-price',it.status+(it.sold_at?(' • terjual '+it.sold_at):'')));
row.appendChild(info);
var act=ce('div','fs-item-actions');
var viewBtn=ce('button','fs-edit-btn','Lihat');
viewBtn.setAttribute('type','button');
viewBtn.addEventListener('click',function(){
try{var obj=JSON.parse(it.fields);alert(Object.keys(obj).map(function(k){return k+': '+obj[k]}).join('\n'))}catch(e){alert('Data tidak valid')}
});
act.appendChild(viewBtn);
if(it.status==='available'){
var disBtn=ce('button','fs-edit-btn','Nonaktif');
disBtn.setAttribute('type','button');
disBtn.addEventListener('click',function(){
if(!confirm('Nonaktifkan stok #'+it.id+'?'))return;
fetch('/api/admin/stock/'+it.id+'/disable',{method:'POST',headers:stockHeaders()}).then(handleResponseStatus).then(function(){loadStockList();loadLowStock()}).catch(function(){});
});
act.appendChild(disBtn);
var delBtn=ce('button','fs-remove-btn','Hapus');
delBtn.setAttribute('type','button');
delBtn.addEventListener('click',function(){
if(!confirm('Hapus stok #'+it.id+'?'))return;
fetch('/api/admin/stock/'+it.id,{method:'DELETE',headers:{'x-admin-password':sessionPass}}).then(handleResponseStatus).then(function(){loadStockList();loadLowStock()}).catch(function(){});
});
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
openBtn.addEventListener('click',function(){
var sel=document.getElementById('stockVariantSelect');
if(sel){sel.value=String(r.id);refreshStockTemplate();loadStockList()}
});
act.appendChild(openBtn);
row.appendChild(act);
list.appendChild(row);
});
}).catch(function(){});
}
function submitStockAdd(e){
e.preventDefault();
var sel=document.getElementById('stockVariantSelect');
if(!sel||!sel.value)return alert('Pilih varian dulu.');
if(!stockCurrentFields.length)return alert('Setel template field dulu.');
var fields={};
var ok=true;
stockCurrentFields.forEach(function(f){
var inp=document.querySelector('#stockAddFields input[data-field="'+f+'"]');
var v=inp?inp.value.trim():'';
if(!v)ok=false;
fields[f]=v;
});
if(!ok)return alert('Semua field template wajib diisi.');
fetch('/api/admin/stock/'+sel.value,{method:'POST',headers:stockHeaders(),body:JSON.stringify({fields:fields})})
.then(handleResponseStatus)
.then(function(){e.target.reset();loadStockList();loadLowStock()})
.catch(function(){alert('Gagal menambah stok.')});
}
function submitStockBulk(e){
e.preventDefault();
var sel=document.getElementById('stockVariantSelect');
if(!sel||!sel.value)return alert('Pilih varian dulu.');
if(!stockCurrentFields.length)return alert('Setel template field dulu.');
var ta=document.getElementById('stockBulkText');
if(!ta||!ta.value.trim())return alert('Isi data CSV dulu.');
var lines=ta.value.split(/\r?\n/);
var items=[];
for(var i=0;i<lines.length;i++){
var line=lines[i].trim();
if(!line)continue;
var cols=line.split(',').map(function(c){return c.trim()});
var obj={};var valid=true;
for(var f=0;f<stockCurrentFields.length;f++){
var v=cols[f]||'';
if(!v)valid=false;
obj[stockCurrentFields[f]]=v;
}
if(valid)items.push(obj);
}
if(!items.length)return alert('Tidak ada baris valid sesuai template.');
if(!confirm('Import '+items.length+' item stok?'))return;
fetch('/api/admin/stock/'+sel.value+'/bulk',{method:'POST',headers:stockHeaders(),body:JSON.stringify({items:items})})
.then(handleResponseStatus)
.then(function(){ta.value='';loadStockList();loadLowStock()})
.catch(function(){alert('Gagal import bulk.')});
}
function saveTemplate(e){
e.preventDefault();
var app=document.getElementById('templateAppName').value.trim();
if(!app)return alert('Nama aplikasi wajib diisi.');
var raw=document.getElementById('templateFields').value;
var arr=raw.split(',').map(function(s){return s.trim()}).filter(Boolean);
fetch('/api/admin/cred-templates/'+encodeURIComponent(app),{method:'PUT',headers:stockHeaders(),body:JSON.stringify({fields:arr})})
.then(handleResponseStatus)
.then(function(){loadTemplates()})
.catch(function(){alert('Gagal menyimpan template.')});
}
function loadStockTab(){loadStockCatalog();loadTemplates();loadLowStock()}
document.addEventListener('DOMContentLoaded',function(){
var btnLoad=document.getElementById('btnLoadStock');
if(btnLoad)btnLoad.addEventListener('click',function(){refreshStockTemplate();loadStockList()});
var sel=document.getElementById('stockVariantSelect');
if(sel)sel.addEventListener('change',function(){refreshStockTemplate();loadStockList()});
var addForm=document.getElementById('stockAddForm');
if(addForm)addForm.addEventListener('submit',submitStockAdd);
var bulkForm=document.getElementById('stockBulkForm');
if(bulkForm)bulkForm.addEventListener('submit',submitStockBulk);
var tplForm=document.getElementById('templateForm');
if(tplForm)tplForm.addEventListener('submit',saveTemplate);
});

