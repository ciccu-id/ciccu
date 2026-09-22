var RPRICE_DATA=[],RPRICE_EXPANDED={},RPRICE_SEARCH='',RVAR_EDIT_ID=null;
function rpriceHeaders(){return{'Content-Type':'application/json','x-admin-password':sessionPass}}
function flashSaved(){var ind=document.getElementById('savingIndicator');if(ind){ind.classList.remove('hidden');setTimeout(function(){ind.classList.add('hidden')},1500)}}
function loadLowStock(){}
function loadResellerPricelist(){
var wrap=document.getElementById('rpriceAccordion');
if(!wrap)return;
while(wrap.firstChild)wrap.removeChild(wrap.firstChild);
wrap.appendChild(ce('div','loading-state','Memuat pricelist reseller...'));
fetch('/api/admin/rpricelist',{headers:{'x-admin-password':sessionPass}}).then(function(r){return r.json()}).then(function(rows){
RPRICE_DATA=rows||[];
renderResellerPricelist();
}).catch(function(){while(wrap.firstChild)wrap.removeChild(wrap.firstChild);wrap.appendChild(ce('div','empty-state','Gagal memuat pricelist reseller.'))});
}
function renderResellerPricelist(){
var wrap=document.getElementById('rpriceAccordion');
if(!wrap)return;
while(wrap.firstChild)wrap.removeChild(wrap.firstChild);
var q=RPRICE_SEARCH;
var rows=RPRICE_DATA.filter(function(r){return!q||r.app_name.toLowerCase().includes(q)||r.category.toLowerCase().includes(q)||r.duration.toLowerCase().includes(q)});
var grouped={},appOrder={},appFirst={};
rows.forEach(function(r){
if(!grouped[r.app_name])grouped[r.app_name]=[];
grouped[r.app_name].push(r);
var o=(r.app_sort_order&&r.app_sort_order>0&&r.app_sort_order<9999)?r.app_sort_order:9999;
if(!appOrder[r.app_name]||o<appOrder[r.app_name])appOrder[r.app_name]=o;
if(!appFirst[r.app_name]||r.id<appFirst[r.app_name])appFirst[r.app_name]=r.id;
});
var apps=Object.keys(grouped).sort(function(a,b){return(appOrder[a]-appOrder[b])||(appFirst[a]-appFirst[b])});
if(!apps.length){wrap.appendChild(ce('div','empty-state','Belum ada paket reseller. Klik "＋ Tambah Paket" untuk membuat, atau salin dari publik via console D1.'));return}
apps.forEach(function(app){
var isOpen=!!RPRICE_EXPANDED[app];
var group=ce('div','app-group');
var header=ce('div','app-header app-header-pink'+(isOpen?' open':''));
var hinfo=ce('div','app-header-info');
hinfo.appendChild(ce('h3','app-header-name',app));
hinfo.appendChild(ce('p','app-header-form',grouped[app].length+' paket reseller'));
header.appendChild(hinfo);
var hact=ce('div','app-header-actions');
var addBtn=ce('button','add-pkg-btn','＋ Paket');
addBtn.setAttribute('type','button');
addBtn.addEventListener('click',function(e){e.stopPropagation();openRvarEdit(null,app)});
hact.appendChild(addBtn);
var tplBtn=ce('button','tool-btn purple','🧩');
tplBtn.setAttribute('type','button');
tplBtn.title='Template field '+app;
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
var content=ce('div','app-body-content');
var cats={};
grouped[app].forEach(function(r){if(!cats[r.category])cats[r.category]=[];cats[r.category].push(r)});
Object.keys(cats).forEach(function(cat){
content.appendChild(ce('div','pkg-section-label',cat));
var list=ce('div','pkg-list');
cats[cat].forEach(function(r){list.appendChild(buildRow(r))});
content.appendChild(list);
});
inner.appendChild(content);
body.appendChild(inner);
group.appendChild(body);
wrap.appendChild(group);
});
}
function buildRow(r){
var row=ce('div','pkg-row'+(String(r.status).toLowerCase()==='sold'?' sold':''));
var main=ce('div','pkg-main');
var info=ce('div','pkg-info');
var line=ce('p','pkg-info-line');
line.appendChild(document.createTextNode(r.category+' • '+r.duration+' '));
line.appendChild(ce('span','price',r.price));
if(String(r.status).toLowerCase()==='sold')line.appendChild(ce('span','pkg-flash-badge','SOLD'));
info.appendChild(line);
info.appendChild(ce('p','pkg-note','Stok tersedia '+r.stock_available+(r.notes?(' • '+r.notes):'')));
main.appendChild(info);
row.appendChild(main);
var actions=ce('div','pkg-actions');
var badge=ce('span','status-badge '+(r.stock_available>0?'ready':'sold'),'Stok '+r.stock_available);
actions.appendChild(badge);
var tw=ce('label','toggle-wrap');
var cb=ce('input','toggle-cb');cb.setAttribute('type','checkbox');if(String(r.status).toLowerCase()==='ready')cb.checked=true;
var track=ce('span','toggle-track');
var circle=ce('span','toggle-circle');
tw.appendChild(cb);tw.appendChild(track);tw.appendChild(circle);
cb.addEventListener('change',function(){
saveVariant(Object.assign({},r,{status:cb.checked?'Ready':'Sold'}),function(){loadResellerPricelist()});
});
actions.appendChild(tw);
var dataBtn=ce('button','tool-btn sky','📦 Data');
dataBtn.setAttribute('type','button');
dataBtn.addEventListener('click',function(){if(typeof stockOpenManager==='function')stockOpenManager(r)});
actions.appendChild(dataBtn);
var grp=ce('div','pkg-btn-group');
var editBtn=ce('button','pkg-edit-btn');
editBtn.setAttribute('type','button');
editBtn.title='Edit paket';
editBtn.appendChild(admSvg('M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z','.75rem','.75rem'));
editBtn.addEventListener('click',function(){openRvarEdit(r)});
grp.appendChild(editBtn);
grp.appendChild(ce('span','pkg-btn-sep'));
var delBtn=ce('button','pkg-del-btn');
delBtn.setAttribute('type','button');
delBtn.title='Hapus paket';
delBtn.appendChild(admSvg('M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16','.75rem','.75rem'));
delBtn.addEventListener('click',function(){
if(!confirm('Hapus '+r.app_name+' '+r.category+' '+r.duration+' dari pricelist reseller? Stok available akan ikut dibersihkan.'))return;
fetch('/api/admin/rpricelist/'+r.id,{method:'DELETE',headers:{'x-admin-password':sessionPass}})
.then(handleResponseStatus)
.then(function(){flashSaved();loadResellerPricelist()})
.catch(function(){alert('Gagal menghapus paket.')});
});
grp.appendChild(delBtn);
actions.appendChild(grp);
row.appendChild(actions);
return row;
}
function saveVariant(payload,done){
var isEdit=payload.id!=null;
var url=isEdit?('/api/admin/rpricelist/'+payload.id):'/api/admin/rpricelist';
fetch(url,{method:isEdit?'PUT':'POST',headers:rpriceHeaders(),body:JSON.stringify(payload)})
.then(handleResponseStatus)
.then(function(){flashSaved();if(done)done()})
.catch(function(){alert('Gagal menyimpan paket reseller.')});
}
function openRvarEdit(variant,appPrefill){
RVAR_EDIT_ID=variant?variant.id:null;
var title=document.getElementById('rvarEditTitle');
if(title)title.textContent=variant?'Edit Paket Reseller':'Tambah Paket Reseller';
var sub=document.getElementById('rvarEditSub');
if(sub)sub.textContent=variant?(variant.app_name+' • '+variant.category+' • '+variant.duration):(appPrefill||'');
var f={app_name:variant?variant.app_name:(appPrefill||''),category:variant?variant.category:'',duration:variant?variant.duration:'',price:variant?variant.price:'',status:variant?variant.status:'Ready',notes:variant?(variant.notes||''):''};
var set=function(id,v){var el=document.getElementById(id);if(el)el.value=v};
set('rvarAppName',f.app_name);set('rvarCategory',f.category);set('rvarDuration',f.duration);set('rvarPrice',f.price);set('rvarStatus',f.status);set('rvarNotes',f.notes);
openModal('rvarEditModal');
}
function submitRvarEdit(e){
e.preventDefault();
var payload={
app_name:(document.getElementById('rvarAppName').value||'').trim(),
category:(document.getElementById('rvarCategory').value||'').trim(),
duration:(document.getElementById('rvarDuration').value||'').trim(),
price:(document.getElementById('rvarPrice').value||'').trim(),
status:document.getElementById('rvarStatus').value,
notes:(document.getElementById('rvarNotes').value||'').trim()
};
if(!payload.app_name||!payload.category||!payload.duration||!payload.price)return alert('Nama aplikasi, kategori, durasi, dan harga wajib diisi.');
if(RVAR_EDIT_ID)payload.id=RVAR_EDIT_ID;
saveVariant(payload,function(){closeModal('rvarEditModal');loadResellerPricelist()});
}
document.addEventListener('DOMContentLoaded',function(){
var bExp=document.getElementById('btnExpandAllR');
if(bExp)bExp.addEventListener('click',function(){RPRICE_DATA.forEach(function(r){RPRICE_EXPANDED[r.app_name]=true});renderResellerPricelist()});
var bCol=document.getElementById('btnCollapseAllR');
if(bCol)bCol.addEventListener('click',function(){RPRICE_EXPANDED={};renderResellerPricelist()});
var bAdd=document.getElementById('btnAddRVariant');
if(bAdd)bAdd.addEventListener('click',function(){openRvarEdit(null,'')});
var search=document.getElementById('rpriceSearch');
if(search)search.addEventListener('input',function(){RPRICE_SEARCH=this.value.toLowerCase().trim();renderResellerPricelist()});
var form=document.getElementById('rvarEditForm');
if(form)form.addEventListener('submit',submitRvarEdit);
[['rvarEditModal','rvarEditClose','rvarEditBackdrop','rvarEditCancel']].forEach(function(cfg){
[cfg[1],cfg[2],cfg[3]].forEach(function(id){var el=document.getElementById(id);if(el)el.addEventListener('click',function(){closeModal(cfg[0])})});
});
});

