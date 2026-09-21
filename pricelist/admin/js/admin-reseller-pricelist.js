var RPRICE_DATA=[],RPRICE_EXPANDED={},RPRICE_STOCK_OPEN={};
var ADDVAR_ROWS=[],IMPORT_ROWS=[];
function rpriceHeaders(){return{'Content-Type':'application/json','x-admin-password':sessionPass}}
function flashSaved(){var ind=document.getElementById('savingIndicator');if(ind){ind.classList.remove('hidden');setTimeout(function(){ind.classList.add('hidden')},1500)}}
function loadLowStock(){}
function parsePubPrice(str){if(!str)return 0;var s=String(str).toUpperCase();var n=parseInt(s.replace(/[^0-9]/g,''),10)||0;return s.includes('K')?n*1000:n}
function formatPrice(n){n=Math.round(n)||0;if(n<=0)return'';if(n%1000===0)return(n/1000)+'K';return String(n)}
function soldIds(){var m={};RPRICE_DATA.forEach(function(r){if(r.reseller_price!=='')m[r.id]=true});return m}
function loadResellerPricelist(){
var wrap=document.getElementById('rpriceAccordion');
if(!wrap)return;
while(wrap.firstChild)wrap.removeChild(wrap.firstChild);
wrap.appendChild(ce('div','loading-state','Memuat pricelist reseller...'));
fetch('/api/admin/reseller-prices',{headers:{'x-admin-password':sessionPass}}).then(function(r){return r.json()}).then(function(rows){
RPRICE_DATA=rows||[];
renderResellerPricelist();
}).catch(function(){while(wrap.firstChild)wrap.removeChild(wrap.firstChild);wrap.appendChild(ce('div','empty-state','Gagal memuat pricelist.'))});
}
function renderResellerPricelist(){
var wrap=document.getElementById('rpriceAccordion');
if(!wrap)return;
while(wrap.firstChild)wrap.removeChild(wrap.firstChild);
var grouped={},appOrder={},appFirst={};
RPRICE_DATA.forEach(function(r){
if(r.reseller_price==='')return;
if(!grouped[r.app_name])grouped[r.app_name]=[];
grouped[r.app_name].push(r);
var o=(r.app_sort_order&&r.app_sort_order>0)?r.app_sort_order:9999;
if(!appOrder[r.app_name]||o<appOrder[r.app_name])appOrder[r.app_name]=o;
if(!appFirst[r.app_name]||r.id<appFirst[r.app_name])appFirst[r.app_name]=r.id;
});
var apps=Object.keys(grouped).sort(function(a,b){return(appOrder[a]-appOrder[b])||(appFirst[a]-appFirst[b])});
if(!apps.length){wrap.appendChild(ce('div','empty-state','Belum ada varian yang dijual ke reseller. Gunakan "＋ Tambah Varian" atau "⬆ Import dari Publik".'));return}
apps.forEach(function(app){
var rows=grouped[app].sort(function(a,b){var ap=(a.sort_order&&a.sort_order>0)?a.sort_order:9999,bp=(b.sort_order&&b.sort_order>0)?b.sort_order:9999;return(ap-bp)||(a.id-b.id)});
var isOpen=!!RPRICE_EXPANDED[app];
var group=ce('div','app-group');
var header=ce('div','app-header app-header-pink'+(isOpen?' open':''));
var hinfo=ce('div','app-header-info');
hinfo.appendChild(ce('h3','app-header-name',app));
hinfo.appendChild(ce('p','app-header-form',rows.length+' varian dijual ke reseller'));
header.appendChild(hinfo);
var hact=ce('div','app-header-actions');
var tplBtn=ce('button','tool-btn purple','🧩 Template');
tplBtn.setAttribute('type','button');
tplBtn.addEventListener('click',function(e){e.stopPropagation();if(typeof stockOpenTemplate==='function')stockOpenTemplate(app)});
hact.appendChild(tplBtn);
var arrow=ce('div','app-header-arrow');
arrow.appendChild(admSvg('M19 9l-7 7-7-7','1.125rem','1.125rem'));
hact.appendChild(arrow);
header.appendChild(hact);
header.addEventListener('click',function(){
RPRICE_EXPANDED[app]=!RPRICE_EXPANDED[app];
var body=group.querySelector('.app-body');
if(RPRICE_EXPANDED[app]){header.classList.add('open');body.classList.remove('closed');body.classList.add('open')}
else{header.classList.remove('open');body.classList.remove('open');body.classList.add('closed')}
});
group.appendChild(header);
var body=ce('div','app-body '+(isOpen?'open':'closed'));
var inner=ce('div','app-body-inner');
var content=ce('div','app-body-content rp-cards');
rows.forEach(function(r){content.appendChild(buildVariantCard(r))});
inner.appendChild(content);
body.appendChild(inner);
group.appendChild(body);
wrap.appendChild(group);
});
}
function buildVariantCard(r){
var card=ce('div','rp-card');
card.setAttribute('data-variant',r.id);
var top=ce('div','rp-top');
var left=ce('div','rp-id');
left.appendChild(ce('p','rp-name',r.category+' • '+r.duration));
left.appendChild(ce('p','rp-meta','Harga publik '+r.price));
top.appendChild(left);
var right=ce('div','rp-right');
var badge=ce('span','status-badge rp-stockbadge '+(r.stock_available>0?(r.stock_available<=4?'sold':'ready'):'sold'),'Stok '+r.stock_available);
right.appendChild(badge);
var sold=r.reseller_price!=='';
var tw=ce('label','toggle-wrap');
var cb=ce('input','toggle-cb');cb.setAttribute('type','checkbox');if(sold)cb.checked=true;
var track=ce('span','toggle-track');
var circle=ce('span','toggle-circle');
tw.appendChild(cb);tw.appendChild(track);tw.appendChild(circle);
right.appendChild(tw);
var delBtn=ce('button','icon-btn');
delBtn.setAttribute('type','button');
delBtn.title='Hapus dari pricelist reseller';
delBtn.appendChild(admSvg('M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16','.875rem','.875rem'));
delBtn.addEventListener('click',function(){
if(!confirm('Hapus '+r.app_name+' '+r.category+' '+r.duration+' dari pricelist reseller?'))return;
fetch('/api/admin/reseller-prices/'+r.id,{method:'PUT',headers:rpriceHeaders(),body:JSON.stringify({reseller_price:''})})
.then(handleResponseStatus)
.then(function(){flashSaved();loadResellerPricelist()})
.catch(function(){alert('Gagal menghapus.')});
});
right.appendChild(delBtn);
top.appendChild(right);
card.appendChild(top);
var ctrl=ce('div','rp-controls');
var inp=ce('input','form-input rp-input');
inp.setAttribute('type','text');
inp.placeholder='Harga reseller';
inp.value=r.reseller_price||'';
if(!sold){inp.disabled=true;inp.style.opacity='.5'}
cb.addEventListener('change',function(){
if(cb.checked){inp.disabled=false;inp.style.opacity='1'}
else{inp.disabled=true;inp.style.opacity='.5';inp.value=''}
});
var stockBtn=ce('button','tool-btn sky','Stok ('+r.stock_available+')');
stockBtn.setAttribute('type','button');
var save=ce('button','tool-btn green','Simpan');
save.setAttribute('type','button');
save.addEventListener('click',function(){
var val=cb.checked?inp.value.trim():'';
save.disabled=true;save.textContent='...';
fetch('/api/admin/reseller-prices/'+r.id,{method:'PUT',headers:rpriceHeaders(),body:JSON.stringify({reseller_price:val})})
.then(handleResponseStatus)
.then(function(){flashSaved();loadResellerPricelist()})
.catch(function(){alert('Gagal menyimpan harga reseller.')})
.finally(function(){save.disabled=false;save.textContent='Simpan'});
});
ctrl.appendChild(inp);ctrl.appendChild(stockBtn);ctrl.appendChild(save);
card.appendChild(ctrl);
var panel=ce('div','rp-panel hidden');
var phead=ce('div','rp-panel-head');
var addBtn=ce('button','tool-btn green','＋ Tambah Stok');
addBtn.setAttribute('type','button');
addBtn.addEventListener('click',function(){if(typeof stockOpenAdd==='function')stockOpenAdd(r)});
var bulkBtn=ce('button','tool-btn sky','⬆ Import Bulk');
bulkBtn.setAttribute('type','button');
bulkBtn.addEventListener('click',function(){if(typeof stockOpenBulk==='function')stockOpenBulk(r)});
phead.appendChild(addBtn);phead.appendChild(bulkBtn);
panel.appendChild(phead);
var list=ce('div','rp-list');
panel.appendChild(list);
card.appendChild(panel);
stockBtn.addEventListener('click',function(){
var open=panel.classList.toggle('hidden');
stockBtn.textContent=(open?'Stok':'Tutup')+' ('+r.stock_available+')';
if(!open&&!RPRICE_STOCK_OPEN[r.id]){
RPRICE_STOCK_OPEN[r.id]=true;
if(typeof stockLoadListFor==='function')stockLoadListFor(r,list,card);
}
});
return card;
}
function openAddVariant(){
ADDVAR_ROWS=RPRICE_DATA.filter(function(r){return r.reseller_price===''});
var search=document.getElementById('addVarSearch');
if(search)search.value='';
renderAddVarList();
openModal('addVariantModal');
}
function renderAddVarList(){
var list=document.getElementById('addVarList');
if(!list)return;
while(list.firstChild)list.removeChild(list.firstChild);
var q=(document.getElementById('addVarSearch').value||'').toLowerCase().trim();
var rows=ADDVAR_ROWS.filter(function(r){return!q||r.app_name.toLowerCase().includes(q)||r.category.toLowerCase().includes(q)||r.duration.toLowerCase().includes(q)});
if(!rows.length){list.appendChild(ce('div','empty-state','Tidak ada varian publik yang belum dijual.'));return}
rows.forEach(function(r){
var row=ce('div','fs-item');
var info=ce('div','fs-item-info');
info.appendChild(ce('p','fs-item-name',r.app_name+' • '+r.category+' • '+r.duration));
info.appendChild(ce('p','fs-item-price','Harga publik '+r.price));
row.appendChild(info);
var inp=ce('input','form-input');
inp.setAttribute('type','text');
inp.placeholder='Harga reseller';
inp.value=r.price;
inp.style.width='6rem';
inp.style.flex='none';
var addBtn=ce('button','tool-btn green','Tambah');
addBtn.setAttribute('type','button');
addBtn.addEventListener('click',function(){
var val=inp.value.trim();
if(!val)return alert('Isi harga reseller dulu.');
addBtn.disabled=true;addBtn.textContent='...';
fetch('/api/admin/reseller-prices/'+r.id,{method:'PUT',headers:rpriceHeaders(),body:JSON.stringify({reseller_price:val})})
.then(handleResponseStatus)
.then(function(){flashSaved();loadResellerPricelist();openAddVariantRefresh()})
.catch(function(){alert('Gagal menambah varian.')})
.finally(function(){addBtn.disabled=false;addBtn.textContent='Tambah'});
});
row.appendChild(inp);row.appendChild(addBtn);
list.appendChild(row);
});
}
function openAddVariantRefresh(){
ADDVAR_ROWS=RPRICE_DATA.filter(function(r){return r.reseller_price===''});
renderAddVarList();
}
function openImportPublic(){
IMPORT_ROWS=RPRICE_DATA.filter(function(r){return r.reseller_price===''});
renderImportList();
openModal('importPublicModal');
}
function renderImportList(){
var list=document.getElementById('importPubList');
if(!list)return;
while(list.firstChild)list.removeChild(list.firstChild);
if(!IMPORT_ROWS.length){list.appendChild(ce('div','empty-state','Semua varian publik sudah dijual ke reseller.'));return}
IMPORT_ROWS.forEach(function(r){
var row=ce('div','fs-item');
var cb=ce('input','app-checkbox');
cb.setAttribute('type','checkbox');
cb.checked=true;
cb.setAttribute('data-imp',r.id);
row.appendChild(cb);
var info=ce('div','fs-item-info');
info.appendChild(ce('p','fs-item-name',r.app_name+' • '+r.category+' • '+r.duration));
info.appendChild(ce('p','fs-item-price','Harga publik '+r.price));
row.appendChild(info);
list.appendChild(row);
});
}
function confirmImportPublic(){
var rule=document.getElementById('importRule').value;
var disc=parseInt(document.getElementById('importDiscount').value,10)||0;
var boxes=document.querySelectorAll('#importPubList input[data-imp]');
var chosen=[];
boxes.forEach(function(b){if(b.checked)chosen.push(parseInt(b.getAttribute('data-imp'),10))});
if(!chosen.length)return alert('Pilih minimal satu varian.');
var btn=document.getElementById('btnConfirmImport');
if(btn){btn.disabled=true;btn.textContent='Mengimport...'}
var jobs=chosen.map(function(id){
var r=RPRICE_DATA.find(function(x){return x.id===id});
var val=r.price;
if(rule==='discount')val=formatPrice(parsePubPrice(r.price)*(100-disc)/100);
return fetch('/api/admin/reseller-prices/'+id,{method:'PUT',headers:rpriceHeaders(),body:JSON.stringify({reseller_price:val})}).then(handleResponseStatus);
});
Promise.all(jobs)
.then(function(){closeModal('importPublicModal');flashSaved();loadResellerPricelist()})
.catch(function(){alert('Sebagian import gagal.')})
.finally(function(){if(btn){btn.disabled=false;btn.textContent='Import Terpilih'}});
}
document.addEventListener('DOMContentLoaded',function(){
var bAdd=document.getElementById('btnAddVariant');
if(bAdd)bAdd.addEventListener('click',openAddVariant);
var bImp=document.getElementById('btnImportPublic');
if(bImp)bImp.addEventListener('click',openImportPublic);
var search=document.getElementById('addVarSearch');
if(search)search.addEventListener('input',renderAddVarList);
var rule=document.getElementById('importRule');
if(rule)rule.addEventListener('change',function(){var d=document.getElementById('importDiscount');if(d)d.disabled=(this.value!=='discount')});
var bConf=document.getElementById('btnConfirmImport');
if(bConf)bConf.addEventListener('click',confirmImportPublic);
[['addVariantModal','addVarClose','addVarBackdrop',null],['importPublicModal','importPubClose','importPubBackdrop','importPubCancel']].forEach(function(cfg){
[cfg[1],cfg[2],cfg[3]].forEach(function(id){if(!id)return;var el=document.getElementById(id);if(el)el.addEventListener('click',function(){closeModal(cfg[0])})});
});
});
