var RPRICE_DATA=[],RPRICE_META={},RPRICE_EXPANDED={},RPRICE_SEARCH='',RVAR_EDIT_ID=null;
function rpriceHeaders(){return{'Content-Type':'application/json','x-admin-password':sessionPass}}
function flashSaved(){var ind=document.getElementById('savingIndicator');if(ind){ind.classList.remove('hidden');setTimeout(function(){ind.classList.add('hidden')},1500)}}
function loadLowStock(){}
function getRslMeta(name){return RPRICE_META[String(name).toLowerCase().trim()]||null}
function rslLogoUrl(slug){return slug?'/api/logo/'+encodeURIComponent(slug):''}
function loadResellerPricelist(){
var wrap=document.getElementById('rpriceAccordion');
if(!wrap)return;
while(wrap.firstChild)wrap.removeChild(wrap.firstChild);
wrap.appendChild(ce('div','loading-state','Memuat pricelist reseller...'));
Promise.all([
fetch('/api/admin/rpricelist',{headers:{'x-admin-password':sessionPass}}).then(function(r){return r.json()}),
fetch('/api/admin/app-metadata',{headers:{'x-admin-password':sessionPass}}).then(function(r){return r.json()}).catch(function(){return[]})
]).then(function(res){
RPRICE_DATA=res[0]||[];
RPRICE_META={};
(res[1]||[]).forEach(function(m){RPRICE_META[String(m.app_name).toLowerCase().trim()]=m});
renderResellerPricelist();
}).catch(function(){while(wrap.firstChild)wrap.removeChild(wrap.firstChild);wrap.appendChild(ce('div','empty-state','Gagal memuat pricelist reseller.'))});
}
function renderResellerPricelist(){
var wrap=document.getElementById('rpriceAccordion');
if(!wrap)return;
while(wrap.firstChild)wrap.removeChild(wrap.firstChild);
var q=RPRICE_SEARCH.toLowerCase();
var rows=RPRICE_DATA.filter(function(r){return!q||r.app_name.toLowerCase().indexOf(q)>=0||r.category.toLowerCase().indexOf(q)>=0||r.duration.toLowerCase().indexOf(q)>=0});
var grouped={},appOrder={},appFirst={};
rows.forEach(function(r){
if(!grouped[r.app_name])grouped[r.app_name]=[];
grouped[r.app_name].push(r);
var o=(r.app_sort_order&&r.app_sort_order>0&&r.app_sort_order<9999)?r.app_sort_order:9999;
if(!appOrder[r.app_name]||o<appOrder[r.app_name])appOrder[r.app_name]=o;
if(!appFirst[r.app_name]||r.id<appFirst[r.app_name])appFirst[r.app_name]=r.id;
});
var kk=(RPRICE_SEARCH||'').toLowerCase();
for(var mk in RPRICE_META){
var mn=RPRICE_META[mk]?RPRICE_META[mk].app_name:'';
if(!mn||grouped[mn])continue;
if(kk&&mn.toLowerCase().indexOf(kk)<0)continue;
grouped[mn]=[];
if(appOrder[mn]===undefined)appOrder[mn]=9999;
if(appFirst[mn]===undefined)appFirst[mn]=999999999;
}
var apps=Object.keys(grouped).sort(function(a,b){return(appOrder[a]-appOrder[b])||(appFirst[a]-appFirst[b])});
if(!apps.length){wrap.appendChild(ce('div','empty-state','Belum ada paket reseller. Ketuk ＋ di atas untuk menambah aplikasi baru.'));return}
apps.forEach(function(app){
var isOpen=!!RPRICE_EXPANDED[app];
var packages=grouped[app];
var meta=getRslMeta(app);
var isAllSold=packages.length>0&&packages.every(function(p){return p.status&&String(p.status).toLowerCase()!=='ready'});
var group=ce('div','app-group');
group.setAttribute('data-app',app);
var header=ce('div','app-header '+(isAllSold?'app-header-gray':'app-header-pink')+(isOpen?' open':''));
if(meta&&meta.logo_path){var logo=ce('img','app-header-logo');logo.src=rslLogoUrl(meta.logo_path);logo.alt=app;header.appendChild(logo)}
var hinfo=ce('div','app-header-info');
var nameRow=ce('h3','app-header-name'+(isAllSold?' sold':''),app);
if(isAllSold){var sb=ce('span',null,'Habis');sb.style.cssText='font-size:.5rem;background:var(--brick-50);color:var(--brick-500);border:1px solid var(--brick-200);padding:.125rem .375rem;border-radius:.25rem;font-weight:900;text-transform:uppercase;margin-left:.25rem';nameRow.appendChild(sb)}
hinfo.appendChild(nameRow);
var countWrap=ce('div','app-header-count');
if(meta&&meta.app_type&&meta.app_type!=='lainnya'){var tb=ce('span',null,meta.app_type);tb.style.cssText='font-size:.4375rem;background:var(--butter-100);color:var(--choco-700);border:1px solid var(--butter-300);padding:.125rem .375rem;border-radius:.25rem;font-weight:900;text-transform:uppercase;letter-spacing:.05em';countWrap.appendChild(tb)}
countWrap.appendChild(ce('span',null,packages.length+' Paket'));
hinfo.appendChild(countWrap);
header.appendChild(hinfo);
var arrow=ce('div','app-header-arrow');
arrow.appendChild(admSvg('M19 9l-7 7-7-7','1.25rem','1.25rem'));
header.appendChild(arrow);
var hact=ce('div','app-header-actions');
var kebab=ce('div','kebab-wrap');
var kbtn=ce('button','kebab-btn','⋮');
kbtn.setAttribute('type','button');
kbtn.setAttribute('title','Menu aplikasi');
var kmenu=ce('div','kebab-menu');
var ki1=ce('button','kebab-item','✏️ Edit Aplikasi');
ki1.setAttribute('type','button');
ki1.addEventListener('click',function(e){e.stopPropagation();kebab.classList.remove('open');if(typeof openEditAppModal==='function')openEditAppModal(app)});
var ki2=ce('button','kebab-item','＋ Tambah Paket');
ki2.setAttribute('type','button');
ki2.addEventListener('click',function(e){e.stopPropagation();kebab.classList.remove('open');openRvarEdit(null,app)});
var ki3=ce('button','kebab-item danger','🗑 Hapus Aplikasi');
ki3.setAttribute('type','button');
ki3.addEventListener('click',function(e){e.stopPropagation();kebab.classList.remove('open');deleteRslApp(app,packages.map(function(p){return p.id}))});
kmenu.appendChild(ki1);kmenu.appendChild(ki2);kmenu.appendChild(ki3);
kebab.appendChild(kbtn);kebab.appendChild(kmenu);
kbtn.addEventListener('click',function(e){
e.stopPropagation();
var willOpen=!kebab.classList.contains('open');
if(typeof closeAllKebab==='function')closeAllKebab(null);
else document.querySelectorAll('.kebab-wrap.open').forEach(function(w){w.classList.remove('open')});
if(willOpen)kebab.classList.add('open');
});
hact.appendChild(kebab);
header.appendChild(hact);
header.addEventListener('click',function(e){if(e.target.closest('.kebab-wrap'))return;RPRICE_EXPANDED[app]=!RPRICE_EXPANDED[app];renderResellerPricelist()});
group.appendChild(header);
var body=ce('div','app-body '+(isOpen?'open':'closed'));
var inner=ce('div','app-body-inner');
var content=ce('div','app-body-content');
var pkgHeader=ce('div','pkg-section-header');
pkgHeader.appendChild(ce('span','pkg-section-label','📋 Daftar Paket'));
var addPkgBtn=ce('button','add-pkg-btn','＋ Tambah Paket');
addPkgBtn.setAttribute('type','button');
addPkgBtn.addEventListener('click',function(){openRvarEdit(null,app)});
pkgHeader.appendChild(addPkgBtn);
content.appendChild(pkgHeader);
var pkgList=ce('div','pkg-list');
packages.forEach(function(r){pkgList.appendChild(buildRslRow(r))});
content.appendChild(pkgList);
inner.appendChild(content);
body.appendChild(inner);
group.appendChild(body);
wrap.appendChild(group);
});
}
function buildRslRow(r){
var isReady=!r.status||String(r.status).toLowerCase()==='ready';
var row=ce('div','pkg-row'+(isReady?'':' sold'));
row.setAttribute('data-id',r.id);
var main=ce('div','pkg-main');
var info=ce('div','pkg-info');
var infoLine=ce('p','pkg-info-line');
infoLine.appendChild(ce('span',null,r.category+' • '));
infoLine.appendChild(ce('span','app-name',r.duration));
infoLine.appendChild(ce('span',null,' • '));
infoLine.appendChild(ce('span','price',r.price));
info.appendChild(infoLine);
var noteText='Stok tersedia '+(r.stock_available||0);
if(r.notes&&String(r.notes).toLowerCase()!=='nan')noteText+=' • '+r.notes;
info.appendChild(ce('p','pkg-note','↳ '+noteText));
main.appendChild(info);
row.appendChild(main);
var actionsCol=ce('div','pkg-actions');
var statusCol=ce('div','pkg-status-col');
statusCol.appendChild(ce('span','status-badge '+(isReady?'ready':'sold'),isReady?'READY':'SOLD'));
var tw=ce('div','toggle-wrap');
var cb=ce('input','toggle-cb');cb.setAttribute('type','checkbox');if(isReady)cb.checked=true;
var track=ce('span','toggle-track');var circle=ce('span','toggle-circle');
tw.appendChild(cb);tw.appendChild(track);tw.appendChild(circle);
cb.addEventListener('change',function(){saveVariant(Object.assign({},r,{status:cb.checked?'Ready':'Sold'}),function(){loadResellerPricelist()})});
statusCol.appendChild(tw);
actionsCol.appendChild(statusCol);
var btnGroup=ce('div','pkg-btn-group');
var dataBtn=ce('button','pkg-edit-btn');
dataBtn.setAttribute('type','button');dataBtn.title='Kelola Stok';
dataBtn.appendChild(admSvg('M5 8h14M5 8a2 2 0 110-4h14a2 2 0 110 4M5 8v10a2 2 0 002 2h10a2 2 0 002-2V8m-9 4h4','.875rem','.875rem'));
dataBtn.addEventListener('click',function(){if(typeof stockOpenManager==='function')stockOpenManager(r)});
btnGroup.appendChild(dataBtn);
btnGroup.appendChild(ce('span','pkg-btn-sep'));
var editBtn=ce('button','pkg-edit-btn');
editBtn.setAttribute('type','button');editBtn.title='Edit Paket';
editBtn.appendChild(admSvg('M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z','.875rem','.875rem'));
editBtn.addEventListener('click',function(){openRvarEdit(r)});
btnGroup.appendChild(editBtn);
btnGroup.appendChild(ce('span','pkg-btn-sep'));
var delBtn=ce('button','pkg-del-btn');
delBtn.setAttribute('type','button');delBtn.title='Hapus Paket';
delBtn.appendChild(admSvg('M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16','.875rem','.875rem'));
delBtn.addEventListener('click',function(){
if(!confirm('Hapus '+r.app_name+' '+r.category+' '+r.duration+' dari pricelist reseller?'))return;
fetch('/api/admin/rpricelist/'+r.id,{method:'DELETE',headers:{'x-admin-password':sessionPass}})
.then(handleResponseStatus).then(function(){flashSaved();loadResellerPricelist()}).catch(function(){alert('Gagal menghapus paket.')});
});
btnGroup.appendChild(delBtn);
actionsCol.appendChild(btnGroup);
row.appendChild(actionsCol);
return row;
}
function saveVariant(payload,done){
var isEdit=payload.id!=null;
var url=isEdit?('/api/admin/rpricelist/'+payload.id):'/api/admin/rpricelist';
fetch(url,{method:isEdit?'PUT':'POST',headers:rpriceHeaders(),body:JSON.stringify(payload)})
.then(handleResponseStatus).then(function(){flashSaved();if(done)done()}).catch(function(){alert('Gagal menyimpan paket reseller.')});
}
function deleteRslApp(app,ids){
if(!ids.length){
if(!confirm('Aplikasi "'+app+'" kosong. Hapus metadata?'))return;
fetch('/api/admin/app-metadata/'+encodeURIComponent(app),{method:'DELETE',headers:{'x-admin-password':sessionPass}}).catch(function(){}).then(function(){loadResellerPricelist()});
return;
}
if(!confirm('Hapus permanen "'+app+'" beserta '+ids.length+' paket reseller?'))return;
var promises=ids.map(function(id){return fetch('/api/admin/rpricelist/'+id,{method:'DELETE',headers:{'x-admin-password':sessionPass}}).catch(function(){})});
Promise.all(promises).then(function(){loadResellerPricelist()});
}
function openRvarEdit(variant,appPrefill){
RVAR_EDIT_ID=variant?variant.id:null;
var title=document.getElementById('rvarEditTitle');
if(title)title.textContent=variant?'Edit Paket Reseller':'Tambah Paket Reseller';
var sub=document.getElementById('rvarEditSub');
if(sub)sub.textContent=variant?(variant.app_name+' • '+variant.category+' • '+variant.duration):(appPrefill||'');
var f={app_name:variant?variant.app_name:(appPrefill||''),category:variant?variant.category:'',duration:variant?variant.duration:'',price:variant?variant.price:'',status:variant?variant.status:'Ready',notes:variant?(variant.notes||''):''};
var set=function(id,v){var el=document.getElementById(id);if(el)el.value=v};
set('rvarAppName',f.app_name);set('rvarCategory',f.category);set('rvarDuration',f.duration);set('rvarPrice',f.price);set('rvarNotes',f.notes);
if(typeof setDD==='function')setDD('rvarStatus',f.status);
else{var hid=document.getElementById('rvarStatus');if(hid)hid.value=f.status}
var m=document.getElementById('rvarEditModal');if(m)m.classList.remove('hidden');
}
function submitRvarEdit(e){
e.preventDefault();
var payload={
app_name:(document.getElementById('rvarAppName').value||'').trim(),
category:(document.getElementById('rvarCategory').value||'').trim(),
duration:(document.getElementById('rvarDuration').value||'').trim(),
price:(document.getElementById('rvarPrice').value||'').trim(),
status:(document.getElementById('rvarStatus').value||'Ready'),
notes:(document.getElementById('rvarNotes').value||'').trim()
};
if(!payload.app_name||!payload.category||!payload.duration||!payload.price)return alert('Nama aplikasi, kategori, durasi, dan harga wajib diisi.');
if(RVAR_EDIT_ID)payload.id=RVAR_EDIT_ID;
saveVariant(payload,function(){var m=document.getElementById('rvarEditModal');if(m)m.classList.add('hidden');loadResellerPricelist()});
}
function openRslReorderModal(){
var apps=[],seen={},appOrder={},appFirst={};
RPRICE_DATA.forEach(function(r){
if(!seen[r.app_name]){seen[r.app_name]=true;apps.push(r.app_name)}
var o=(r.app_sort_order&&r.app_sort_order>0&&r.app_sort_order<9999)?r.app_sort_order:9999;
if(!appOrder[r.app_name]||o<appOrder[r.app_name])appOrder[r.app_name]=o;
if(!appFirst[r.app_name]||r.id<appFirst[r.app_name])appFirst[r.app_name]=r.id;
});
apps.sort(function(a,b){return(appOrder[a]-appOrder[b])||(appFirst[a]-appFirst[b])});
var overlay=ce('div','modal-overlay');
var backdrop=ce('div','modal-backdrop');
var box=ce('div','modal-box');
var head=ce('div','modal-head');
var ht=ce('div');
ht.appendChild(ce('h3',null,'Urutan Aplikasi Reseller'));
ht.appendChild(ce('p','modal-sub','Seret untuk mengubah urutan tampil'));
head.appendChild(ht);
var closeBtn=ce('button','modal-close-btn','×');closeBtn.type='button';
head.appendChild(closeBtn);
box.appendChild(head);
var list=ce('div','modal-body-scroll reorder-list');
apps.forEach(function(app,idx){
var item=ce('div','reorder-item');item.setAttribute('data-app',app);
var left=ce('div','reorder-left');
left.appendChild(ce('span','reorder-num',String(idx+1)));
left.appendChild(ce('span','reorder-name',app));
item.appendChild(left);
var handle=ce('div','reorder-handle');
handle.appendChild(admSvg('M4 8h16M4 16h16','1rem','1rem'));
item.appendChild(handle);
list.appendChild(item);
});
box.appendChild(list);
var foot=ce('div','modal-actions');
var cancelBtn=ce('button','cancel-btn','Batal');cancelBtn.type='button';
var saveBtn=ce('button','submit-btn','Simpan Urutan');saveBtn.type='button';
foot.appendChild(cancelBtn);foot.appendChild(saveBtn);
box.appendChild(foot);
overlay.appendChild(backdrop);overlay.appendChild(box);
document.body.appendChild(overlay);
function shut(){if(sortable)sortable.destroy();overlay.remove()}
closeBtn.addEventListener('click',shut);
cancelBtn.addEventListener('click',shut);
backdrop.addEventListener('click',shut);
var sortable=null;
if(typeof Sortable!=='undefined'){
sortable=new Sortable(list,{animation:150,handle:'.reorder-handle',ghostClass:'sortable-ghost',onEnd:function(){
var items=list.querySelectorAll('.reorder-item');
items.forEach(function(el,i){el.querySelector('.reorder-num').textContent=String(i+1)});
}});
}
saveBtn.addEventListener('click',function(){
var items=list.querySelectorAll('.reorder-item');
var order=[];
items.forEach(function(el,i){order.push({app_name:el.getAttribute('data-app'),app_sort_order:i+1})});
saveBtn.disabled=true;var oldText=saveBtn.textContent;saveBtn.textContent='Menyimpan...';
fetch('/api/admin/rpricelist/reorder-apps',{method:'PUT',headers:rpriceHeaders(),body:JSON.stringify({order:order})})
.then(handleResponseStatus).then(function(){shut();flashSaved();loadResellerPricelist()})
.catch(function(){saveBtn.disabled=false;saveBtn.textContent=oldText});
});
}
document.addEventListener('DOMContentLoaded',function(){
var search=document.getElementById('rpriceSearch');
if(search)search.addEventListener('input',function(){RPRICE_SEARCH=this.value.toLowerCase().trim();renderResellerPricelist()});
var form=document.getElementById('rvarEditForm');
if(form)form.addEventListener('submit',submitRvarEdit);
var btnReorder=document.getElementById('btnRslReorder');
if(btnReorder)btnReorder.addEventListener('click',openRslReorderModal);
['rvarEditClose','rvarEditCancel'].forEach(function(id){var el=document.getElementById(id);if(el)el.addEventListener('click',function(){var m=document.getElementById('rvarEditModal');if(m)m.classList.add('hidden')})});
var bdrop=document.getElementById('rvarEditBackdrop');
if(bdrop)bdrop.addEventListener('click',function(){var m=document.getElementById('rvarEditModal');if(m)m.classList.add('hidden')});
});
