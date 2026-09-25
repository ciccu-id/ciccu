var selectedItems=new Set(),expandedApps={},currentEditId=null,builderCurrentApp='',builderFields=[],sortableReorder=null,globalAppMeta={};
var logoPickerState={target:null,currentUrl:'',currentSlug:'',isEdit:false};
var searchKeyword='';
function admSvg(d,w,h){var ns='http://www.w3.org/2000/svg',s=document.createElementNS(ns,'svg');s.setAttribute('viewBox','0 0 24 24');s.setAttribute('fill','none');s.setAttribute('stroke','currentColor');s.setAttribute('stroke-width','2');s.setAttribute('stroke-linecap','round');s.setAttribute('stroke-linejoin','round');if(w)s.style.width=w;if(h)s.style.height=h;var p=document.createElementNS(ns,'path');p.setAttribute('d',d);s.appendChild(p);return s}
function parseFormFields(str){
if(!str)return[];
try{if(str.trim().startsWith('['))return JSON.parse(str).map(function(i){return i.name||i})}catch(e){}
return str.split(',').map(function(s){return s.trim()}).filter(Boolean);
}
function slugify(s){return String(s).toLowerCase().replace(/[^a-z0-9]+/g,'-').replace(/^-+|-+$/g,'').slice(0,64)}
function getMeta(appName){return globalAppMeta[String(appName).toLowerCase().trim()]||null}
function logoUrl(slug){return slug?'/api/logo/'+encodeURIComponent(slug):''}
function setDD(prefix,value){
var hid=document.getElementById(prefix);
var lbl=document.getElementById(prefix+'Label');
var dd=document.getElementById(prefix+'DD');
if(hid)hid.value=value;
if(!dd)return;
var items=dd.querySelectorAll('.dd-item');
for(var i=0;i<items.length;i++){
var on=(items[i].getAttribute('data-value')===value);
items[i].classList.toggle('active',on);
if(on&&lbl){var sp=items[i].querySelector('span');if(sp)lbl.textContent=sp.textContent}
}
}
function setSearchKeyword(v){
searchKeyword=v;
var a=document.getElementById('adminSearchInput');
var b=document.getElementById('adminSearchInputTop');
if(a&&a.value!==v)a.value=v;
if(b&&b.value!==v)b.value=v;
filterAdminList();
}
function loadData(){
if(!sessionPass)return;
var list=document.getElementById('dataList');
if(!list)return;
while(list.firstChild)list.removeChild(list.firstChild);
var loading=ce('div','loading-state');
loading.appendChild(ce('div','loader'));
loading.appendChild(ce('p',null,'Memuat data...'));
list.appendChild(loading);
fetch('/api/admin/pricelist',{headers:{'x-admin-password':sessionPass}})
.then(function(r){if(!r.ok)throw new Error('Server: '+r.status);return r.json()})
.then(function(data){
if(!Array.isArray(data))throw new Error('Data bukan format tabel');
globalAdminData=data.sort(function(a,b){
var aA=(a.app_sort_order&&a.app_sort_order>0)?a.app_sort_order:9999,bA=(b.app_sort_order&&b.app_sort_order>0)?b.app_sort_order:9999;
var aP=(a.sort_order&&a.sort_order>0)?a.sort_order:9999,bP=(b.sort_order&&b.sort_order>0)?b.sort_order:9999;
return(aA-bA)||(aP-bP)||(a.id-b.id);
});
return fetch('/api/admin/forms',{headers:{'x-admin-password':sessionPass}});
})
.then(function(r){return r.json()})
.then(function(formData){
globalFormsData={};
if(Array.isArray(formData))formData.forEach(function(f){globalFormsData[f.app_name.toLowerCase().trim()]=f});
return fetch('/api/admin/app-metadata',{headers:{'x-admin-password':sessionPass}}).catch(function(){return{json:function(){return Promise.resolve([])}}});
})
.then(function(r){return r.json().catch(function(){return[]})})
.then(function(meta){
globalAppMeta={};
if(Array.isArray(meta))meta.forEach(function(m){globalAppMeta[String(m.app_name).toLowerCase().trim()]=m});
loadStoreSettings();
filterAdminList();
})
.catch(function(e){
while(list.firstChild)list.removeChild(list.firstChild);
list.appendChild(ce('div','empty-state','Gagal memuat data! '+e.message));
});
}
function filterAdminList(){
var keyword=searchKeyword.toLowerCase();
var filtered=globalAdminData.filter(function(item){
return item.app_name.toLowerCase().includes(keyword)||item.category.toLowerCase().includes(keyword)||item.status.toLowerCase().includes(keyword);
});
renderData(filtered,keyword);
}
function renderData(dataArray,keyword){
var list=document.getElementById('dataList');
if(!list)return;
while(list.firstChild)list.removeChild(list.firstChild);
var grouped={};
var appOrders={};
var appFirstIds={};
dataArray.forEach(function(item){
if(!grouped[item.app_name])grouped[item.app_name]=[];
grouped[item.app_name].push(item);
var order=(item.app_sort_order&&item.app_sort_order>0)?item.app_sort_order:9999;
if(!appOrders[item.app_name]||order<appOrders[item.app_name])appOrders[item.app_name]=order;
if(!appFirstIds[item.app_name]||item.id<appFirstIds[item.app_name])appFirstIds[item.app_name]=item.id;
});
var kk=(keyword||'').toLowerCase();
for(var mk in globalAppMeta){
var mn=globalAppMeta[mk]?globalAppMeta[mk].app_name:'';
if(!mn||grouped[mn])continue;
if(kk&&mn.toLowerCase().indexOf(kk)<0)continue;
grouped[mn]=[];
if(appOrders[mn]===undefined)appOrders[mn]=9999;
if(appFirstIds[mn]===undefined)appFirstIds[mn]=999999999;
}
var orderedApps=Object.keys(grouped).sort(function(a,b){return(appOrders[a]-appOrders[b])||(appFirstIds[a]-appFirstIds[b])});
if(!orderedApps.length){list.appendChild(ce('div','empty-state','Tidak ada paket aplikasi ditemukan 🥺'));return}
orderedApps.forEach(function(appName){
grouped[appName].sort(function(a,b){
var aP=(a.sort_order&&a.sort_order>0)?a.sort_order:9999,bP=(b.sort_order&&b.sort_order>0)?b.sort_order:9999;
return(aP-bP)||(a.id-b.id);
});
var packages=grouped[appName];
var appKey=appName.toLowerCase().trim();
var formObj=globalFormsData[appKey];
var rawFields=formObj?formObj.form_fields:'';
var parsedFields=parseFormFields(rawFields);
var exactAppName=formObj?formObj.app_name:appName;
var isExpanded=!!expandedApps[exactAppName];
var packageIds=packages.map(function(p){return p.id});
var isAllSold=packages.length>0&&packages.every(function(p){return p.status&&p.status.toLowerCase()!=='ready'});
var meta=getMeta(appName);
var group=ce('div','app-group');
group.setAttribute('data-app',exactAppName);
var header=ce('div','app-header '+(isAllSold?'app-header-gray':'app-header-pink')+(isExpanded?' open':''));
if(meta&&meta.logo_path){var logoImg=ce('img','app-header-logo');logoImg.src=logoUrl(meta.logo_path);logoImg.alt=appName;header.appendChild(logoImg)}
var headerInfo=ce('div','app-header-info');
var nameRow=ce('h3','app-header-name'+(isAllSold?' sold':''),appName);
if(isAllSold){var soldBadge=ce('span',null,'Habis');soldBadge.style.cssText='font-size:.5rem;background:var(--brick-50);color:var(--brick-500);border:1px solid var(--brick-200);padding:.125rem .375rem;border-radius:.25rem;font-weight:900;text-transform:uppercase;margin-left:.25rem';nameRow.appendChild(soldBadge)}
headerInfo.appendChild(nameRow);
headerInfo.appendChild(ce('p','app-header-form',parsedFields.length>0?'📋 Form Pembeli: '+parsedFields.join(', '):'🌸 Tidak memakai formulir khusus'));
var countWrap=ce('div','app-header-count');
if(meta&&meta.app_type&&meta.app_type!=='lainnya'){var typeBadge=ce('span',null,meta.app_type);typeBadge.style.cssText='font-size:.4375rem;background:var(--butter-100);color:var(--choco-700);border:1px solid var(--butter-300);padding:.125rem .375rem;border-radius:.25rem;font-weight:900;text-transform:uppercase;letter-spacing:.05em';countWrap.appendChild(typeBadge)}
countWrap.appendChild(ce('span',null,packages.length+' Paket'));
headerInfo.appendChild(countWrap);
header.appendChild(headerInfo);
var arrow=ce('div','app-header-arrow');
arrow.appendChild(admSvg('M19 9l-7 7-7-7','1.25rem','1.25rem'));
header.appendChild(arrow);
var actions=ce('div','app-header-actions');
var kebab=ce('div','kebab-wrap');
var kbtn=ce('button','kebab-btn');
kbtn.setAttribute('type','button');
kbtn.setAttribute('title','Menu aplikasi');
kbtn.textContent='⋮';
var kmenu=ce('div','kebab-menu');
var ki1=ce('button','kebab-item');
ki1.setAttribute('type','button');
ki1.textContent='✏️ Edit Aplikasi';
ki1.addEventListener('click',function(e){e.stopPropagation();kebab.classList.remove('open');openEditAppModal(appName)});
var kiPkg=ce('button','kebab-item');
kiPkg.setAttribute('type','button');
kiPkg.textContent='＋ Tambah Paket';
kiPkg.addEventListener('click',function(e){e.stopPropagation();kebab.classList.remove('open');openAddPackageModal(exactAppName)});
var ki2=ce('button','kebab-item');
ki2.setAttribute('type','button');
ki2.textContent='📋 Form Pembeli';
ki2.addEventListener('click',function(e){e.stopPropagation();kebab.classList.remove('open');openFormModal(exactAppName,encodeURIComponent(rawFields))});
var ki3=ce('button','kebab-item danger');
ki3.setAttribute('type','button');
ki3.textContent='🗑 Hapus Aplikasi';
ki3.addEventListener('click',function(e){e.stopPropagation();kebab.classList.remove('open');deleteApplication(exactAppName,packageIds)});
kmenu.appendChild(ki1);
kmenu.appendChild(kiPkg);
kmenu.appendChild(ki2);
kmenu.appendChild(ki3);
kebab.appendChild(kbtn);
kebab.appendChild(kmenu);
kbtn.addEventListener('click',function(e){
e.stopPropagation();
var willOpen=!kebab.classList.contains('open');
if(typeof closeAllKebab==='function')closeAllKebab(null);
if(willOpen)kebab.classList.add('open');
});
actions.appendChild(kebab);
header.appendChild(actions);
header.addEventListener('click',function(e){if(e.target.closest('.kebab-wrap')||e.target.tagName==='IMG')return;toggleExpand(exactAppName)});
group.appendChild(header);
var body=ce('div','app-body '+(isExpanded?'open':'closed'));
var bodyInner=ce('div','app-body-inner');
var content=ce('div','app-body-content');
var pkgHeader=ce('div','pkg-section-header');
pkgHeader.appendChild(ce('span','pkg-section-label','📋 Daftar Paket'));
var addPkgBtn=ce('button','add-pkg-btn');
addPkgBtn.setAttribute('type','button');
addPkgBtn.textContent='＋ Tambah Paket';
addPkgBtn.addEventListener('click',function(){openAddPackageModal(exactAppName)});
pkgHeader.appendChild(addPkgBtn);
content.appendChild(pkgHeader);
var pkgList=ce('div','pkg-list sortable-list');
pkgList.id='sort-'+exactAppName.replace(/\s+/g,'-');
packages.forEach(function(item){
var isReady=!item.status||item.status.toLowerCase()==='ready';
var isSelected=selectedItems.has(item.id);
var row=ce('div','pkg-row'+(isSelected?' selected':'')+(isReady?'':' sold'));
row.setAttribute('data-id',item.id);
row.id='row-item-'+item.id;
var drag=ce('div','pkg-drag drag-handle');
drag.appendChild(admSvg('M4 8h16M4 16h16','1rem','1rem'));
row.appendChild(drag);
var main=ce('div','pkg-main');
var cb=ce('input','pkg-cb');
cb.setAttribute('type','checkbox');
if(isSelected)cb.checked=true;
cb.addEventListener('change',function(){toggleSelect(item.id,this.checked)});
main.appendChild(cb);
var info=ce('div','pkg-info');
var infoLine=ce('p','pkg-info-line');
infoLine.appendChild(ce('span',null,item.category+' • '));
infoLine.appendChild(ce('span','app-name',item.duration));
infoLine.appendChild(ce('span',null,' • '));
infoLine.appendChild(ce('span','price',item.price));
if(item.flash_price&&item.flash_price.trim()!=='')infoLine.appendChild(ce('span','pkg-flash-badge','⚡FLASH'));
info.appendChild(infoLine);
if(item.notes&&item.notes.toLowerCase()!=='nan')info.appendChild(ce('p','pkg-note','↳ '+item.notes));
main.appendChild(info);
row.appendChild(main);
var actionsCol=ce('div','pkg-actions');
var statusCol=ce('div','pkg-status-col');
var statusBadge=ce('span','status-badge '+(isReady?'ready':'sold'),isReady?'READY':'SOLD');
statusBadge.id='status-text-'+item.id;
statusCol.appendChild(statusBadge);
var toggleWrap=ce('div','toggle-wrap');
var toggleCb=ce('input','toggle-cb');
toggleCb.setAttribute('type','checkbox');
toggleCb.id='toggle-'+item.id;
if(isReady)toggleCb.checked=true;
toggleCb.addEventListener('change',function(){toggleStatus(item.id,this.checked)});
var toggleTrack=ce('label','toggle-track');
toggleTrack.setAttribute('for','toggle-'+item.id);
var toggleCircle=ce('div','toggle-circle');
toggleWrap.appendChild(toggleCb);
toggleWrap.appendChild(toggleTrack);
toggleWrap.appendChild(toggleCircle);
statusCol.appendChild(toggleWrap);
actionsCol.appendChild(statusCol);
var btnGroup=ce('div','pkg-btn-group');
var editBtn=ce('button','pkg-edit-btn');
editBtn.setAttribute('type','button');
editBtn.appendChild(admSvg('M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z','.875rem','.875rem'));
editBtn.addEventListener('click',function(){editPackage(item.id)});
btnGroup.appendChild(editBtn);
btnGroup.appendChild(ce('div','pkg-btn-sep'));
var delBtn=ce('button','pkg-del-btn');
delBtn.setAttribute('type','button');
delBtn.appendChild(admSvg('M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16','.875rem','.875rem'));
delBtn.addEventListener('click',function(){deleteData(item.id)});
btnGroup.appendChild(delBtn);
actionsCol.appendChild(btnGroup);
row.appendChild(actionsCol);
pkgList.appendChild(row);
});
content.appendChild(pkgList);
bodyInner.appendChild(content);
body.appendChild(bodyInner);
group.appendChild(body);
list.appendChild(group);
});
initSortable();
}
function toggleExpand(appKey){expandedApps[appKey]=!expandedApps[appKey];filterAdminList()}
function expandAll(){
var apps={};
globalAdminData.forEach(function(item){apps[item.app_name]=true});
Object.keys(apps).forEach(function(app){expandedApps[app]=true});
filterAdminList();
}
function collapseAll(){expandedApps={};filterAdminList()}
function initSortable(){
if(typeof Sortable==='undefined')return;
document.querySelectorAll('.sortable-list').forEach(function(container){
new Sortable(container,{
animation:150,handle:'.drag-handle',delay:200,delayOnTouchOnly:true,ghostClass:'sortable-ghost',dragClass:'sortable-drag',
onEnd:function(){
var items=container.querySelectorAll('.pkg-row');
var newOrder=[];
items.forEach(function(el,index){newOrder.push({id:parseInt(el.getAttribute('data-id'),10),sort_order:index+1})});
newOrder.forEach(function(o){var d=globalAdminData.find(function(x){return x.id===o.id});if(d)d.sort_order=o.sort_order});
filterAdminList();
fetch('/api/admin/pricelist/reorder',{method:'PUT',headers:{'Content-Type':'application/json','x-admin-password':sessionPass},body:JSON.stringify({order:newOrder})})
.then(handleResponseStatus)
.then(function(){var ind=document.getElementById('savingIndicator');if(ind){ind.classList.remove('hidden');setTimeout(function(){ind.classList.add('hidden')},2000)}})
.catch(function(){loadData()});
}
});
});
}
function initReorderSortable(list,tries){
if(sortableReorder){sortableReorder.destroy();sortableReorder=null}
if(typeof Sortable!=='undefined'){
sortableReorder=new Sortable(list,{
animation:150,handle:'.reorder-handle',ghostClass:'sortable-ghost',dragClass:'sortable-drag',
onEnd:function(){
var items=list.querySelectorAll('.reorder-item');
items.forEach(function(el,idx){el.querySelector('.reorder-num').textContent=String(idx+1)});
}
});
return;
}
if((tries||0)<5){
setTimeout(function(){
var m=document.getElementById('reorderModal');
if(m&&!m.classList.contains('hidden'))initReorderSortable(list,(tries||0)+1);
},400);
}
}
function openReorderModal(){
var modal=document.getElementById('reorderModal');
var list=document.getElementById('reorderAppList');
if(!modal||!list)return;
while(list.firstChild)list.removeChild(list.firstChild);
var appOrders={},appFirstIds={};
globalAdminData.forEach(function(item){
var order=(item.app_sort_order&&item.app_sort_order>0)?item.app_sort_order:9999;
if(!appOrders[item.app_name]||order<appOrders[item.app_name])appOrders[item.app_name]=order;
if(!appFirstIds[item.app_name]||item.id<appFirstIds[item.app_name])appFirstIds[item.app_name]=item.id;
});
var uniqueApps=[],seen={};
globalAdminData.forEach(function(d){if(!seen[d.app_name]){seen[d.app_name]=true;uniqueApps.push(d.app_name)}});
uniqueApps.sort(function(a,b){return(appOrders[a]-appOrders[b])||(appFirstIds[a]-appFirstIds[b])});
uniqueApps.forEach(function(appName,index){
var item=ce('div','reorder-item');
item.setAttribute('data-app',appName);
var left=ce('div','reorder-left');
left.appendChild(ce('span','reorder-num',String(index+1)));
left.appendChild(ce('span','reorder-name',appName));
item.appendChild(left);
var handle=ce('div','reorder-handle');
handle.appendChild(admSvg('M4 8h16M4 16h16','1rem','1rem'));
item.appendChild(handle);
list.appendChild(item);
});
modal.classList.remove('hidden');
initReorderSortable(list,0);
}
function closeReorderModal(){
var modal=document.getElementById('reorderModal');
if(modal)modal.classList.add('hidden');
if(sortableReorder){sortableReorder.destroy();sortableReorder=null}
}
function saveReorderModal(){
var btn=document.getElementById('btnSaveReorder');
var oldText=btn?btn.textContent:'';
if(btn){btn.textContent='Menyimpan...';btn.disabled=true}
var items=document.querySelectorAll('.reorder-item');
var newOrder=[];
items.forEach(function(el,index){newOrder.push({app_name:el.getAttribute('data-app'),app_sort_order:index+1})});
fetch('/api/admin/reorder-apps',{method:'PUT',headers:{'Content-Type':'application/json','x-admin-password':sessionPass},body:JSON.stringify({order:newOrder})})
.then(handleResponseStatus)
.then(function(){closeReorderModal();loadData()})
.catch(function(){})
.finally(function(){if(btn){btn.textContent=oldText;btn.disabled=false}});
}
function openFormModal(appName,rawFieldsEnc){
builderCurrentApp=appName;
builderFields=parseFormFields(decodeURIComponent(rawFieldsEnc));
var nameEl=document.getElementById('builderAppName');
if(nameEl)nameEl.textContent=appName;
renderFormBuilderFields();
var modal=document.getElementById('formBuilderModal');
if(modal)modal.classList.remove('hidden');
}
function closeFormModal(){
var modal=document.getElementById('formBuilderModal');
if(modal)modal.classList.add('hidden');
}
function addFormFieldBuilder(){builderFields.push('');renderFormBuilderFields()}
function removeFormFieldBuilder(index){builderFields.splice(index,1);renderFormBuilderFields()}
function updateFormFieldBuilder(index,value){builderFields[index]=value}
function renderFormBuilderFields(){
var container=document.getElementById('formFieldsContainer');
if(!container)return;
while(container.firstChild)container.removeChild(container.firstChild);
if(!builderFields.length){container.appendChild(ce('div','empty-state','Belum ada kolom form 🌸'));return}
builderFields.forEach(function(f,i){
var row=ce('div','form-field-row');
row.appendChild(ce('span','form-field-num',String(i+1)));
var input=ce('input','form-field-input');
input.setAttribute('type','text');
input.setAttribute('placeholder','Misal: Nama Profil');
input.value=f;
input.addEventListener('input',function(){updateFormFieldBuilder(i,this.value)});
row.appendChild(input);
var delBtn=ce('button','form-field-del');
delBtn.setAttribute('type','button');
delBtn.appendChild(admSvg('M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16','1rem','1rem'));
delBtn.addEventListener('click',function(){removeFormFieldBuilder(i)});
row.appendChild(delBtn);
container.appendChild(row);
});
}
function saveFormBuilderConfig(){
var btn=document.getElementById('btnSaveForm');
var oldText=btn?btn.textContent:'';
if(btn){btn.textContent='Menyimpan...';btn.disabled=true}
var validFields=builderFields.map(function(f){return f.trim()}).filter(Boolean);
var promise;
if(!validFields.length){
promise=fetch('/api/admin/forms/'+encodeURIComponent(builderCurrentApp),{method:'DELETE',headers:{'x-admin-password':sessionPass}});
}else{
promise=fetch('/api/admin/forms',{method:'POST',headers:{'Content-Type':'application/json','x-admin-password':sessionPass},body:JSON.stringify({app_name:builderCurrentApp,form_fields:validFields.join(', ')})}).then(handleResponseStatus);
}
promise.then(function(){closeFormModal();expandedApps[builderCurrentApp]=true;loadData()})
.catch(function(){})
.finally(function(){if(btn){btn.textContent=oldText;btn.disabled=false}});
}
function openImportModal(){
var modal=document.getElementById('importModal');
var fileInput=document.getElementById('csvFileInput');
var progress=document.getElementById('csvProgress');
if(fileInput)fileInput.value='';
if(progress)progress.classList.add('hidden');
if(modal)modal.classList.remove('hidden');
}
function closeImportModal(){
var modal=document.getElementById('importModal');
if(modal)modal.classList.add('hidden');
}
function processCSV(){
var fileInput=document.getElementById('csvFileInput');
var progress=document.getElementById('csvProgress');
var btn=document.getElementById('btnSubmitImport');
if(!fileInput||!fileInput.files.length)return alert('Pilih file CSV dulu!');
var file=fileInput.files[0];
if(progress)progress.classList.remove('hidden');
if(btn){btn.disabled=true;btn.textContent='Menyimpan...'}
var reader=new FileReader();
reader.onload=function(e){
var text=e.target.result;
var rows=text.split(/\r?\n/).slice(1);
var successCount=0;
var i=0;
function processNext(){
if(i>=rows.length){
if(progress)progress.textContent='Selesai! '+successCount+' data berhasil diunggah.';
setTimeout(function(){closeImportModal();if(btn){btn.disabled=false;btn.textContent='Import Data'}loadData()},1500);
return;
}
var row=rows[i];
if(!row.trim()){i++;processNext();return}
var cols=row.split(',').map(function(c){return c.trim().replace(/^"|"$/g,'')});
if(cols.length<4){i++;processNext();return}
if(progress)progress.textContent='Mengirim baris '+(i+1)+' dari '+rows.length+'...';
fetch('/api/admin/pricelist',{method:'POST',headers:{'Content-Type':'application/json','x-admin-password':sessionPass},body:JSON.stringify({app_name:cols[0],category:cols[1],duration:cols[2],price:cols[3],notes:cols[4]||'',status:cols[5]||'Ready',flash_price:cols[6]||''})})
.then(handleResponseStatus)
.then(function(){successCount++;i++;processNext()})
.catch(function(){if(progress)progress.textContent='Error di baris '+(i+1);if(btn){btn.disabled=false;btn.textContent='Import Data'}});
}
processNext();
};
reader.readAsText(file);
}
function exportCSV(){
var keyword=searchKeyword.toLowerCase();
var dataToExport=globalAdminData.filter(function(item){
return item.app_name.toLowerCase().includes(keyword)||item.category.toLowerCase().includes(keyword)||item.status.toLowerCase().includes(keyword);
});
if(!dataToExport.length)return alert('Tidak ada data untuk diekspor.');
var csvContent='app_name,category,duration,price,status,notes,flash_price\n';
dataToExport.forEach(function(item){
var esc=function(str){return'"'+String(str).replace(/"/g,'""')+'"'};
csvContent+=[esc(item.app_name),esc(item.category),esc(item.duration),esc(item.price),esc(item.status),esc(item.notes||''),esc(item.flash_price||'')].join(',')+'\n';
});
var blob=new Blob([csvContent],{type:'text/csv;charset=utf-8'});
var url=URL.createObjectURL(blob);
var link=document.createElement('a');
link.setAttribute('href',url);
link.setAttribute('download','ciccu-pricelist.csv');
document.body.appendChild(link);
link.click();
document.body.removeChild(link);
}
function openAddPackageModal(appName){
var nameInput=document.getElementById('addPkgAppName');
var displayEl=document.getElementById('addPkgAppNameDisplay');
var form=document.getElementById('addPackageForm');
if(nameInput)nameInput.value=appName;
if(displayEl)displayEl.textContent=appName;
if(form)form.reset();
setDD('addPkgStatus','Ready');
var modal=document.getElementById('addPackageModal');
if(modal)modal.classList.remove('hidden');
}
function closeAddPackageModal(){
var modal=document.getElementById('addPackageModal');
if(modal)modal.classList.add('hidden');
}
function submitAddPackageForm(e){
e.preventDefault();
var btn=document.getElementById('btnSubmitAddPkg');
var oldText=btn?btn.textContent:'';
if(btn){btn.textContent='Menyimpan...';btn.disabled=true}
var appName=document.getElementById('addPkgAppName').value;
var payload={
app_name:appName,
category:document.getElementById('addPkgCat').value,
duration:document.getElementById('addPkgDur').value,
price:document.getElementById('addPkgPrice').value,
status:document.getElementById('addPkgStatus').value,
notes:document.getElementById('addPkgNotes').value,
flash_price:document.getElementById('addPkgFlashPrice').value
};
fetch('/api/admin/pricelist',{method:'POST',headers:{'Content-Type':'application/json','x-admin-password':sessionPass},body:JSON.stringify(payload)})
.then(handleResponseStatus)
.then(function(){expandedApps[appName]=true;closeAddPackageModal();loadData()})
.catch(function(){})
.finally(function(){if(btn){btn.textContent=oldText;btn.disabled=false}});
}
function editPackage(id){
var item=globalAdminData.find(function(d){return d.id===id});
if(!item)return;
currentEditId=id;
var fields={editAppNamePkg:item.app_name,editAppCat:item.category,editAppDur:item.duration,editAppPrice:item.price,editAppNotes:(item.notes&&item.notes.toLowerCase()!=='nan')?item.notes:'',editAppFlashPrice:item.flash_price||''};
for(var key in fields){
var el=document.getElementById(key);
if(el)el.value=fields[key];
}
setDD('editAppStatus',item.status||'Ready');
var modal=document.getElementById('editModal');
if(modal)modal.classList.remove('hidden');
}
function closeEditModal(){
var modal=document.getElementById('editModal');
if(modal)modal.classList.add('hidden');
currentEditId=null;
}
function submitEditForm(e){
e.preventDefault();
var btn=document.getElementById('btnSubmitEdit');
var oldText=btn?btn.textContent:'';
if(btn){btn.textContent='Menyimpan...';btn.disabled=true}
var payload={
app_name:document.getElementById('editAppNamePkg').value,
category:document.getElementById('editAppCat').value,
duration:document.getElementById('editAppDur').value,
price:document.getElementById('editAppPrice').value,
status:document.getElementById('editAppStatus').value,
notes:document.getElementById('editAppNotes').value,
flash_price:document.getElementById('editAppFlashPrice').value
};
fetch('/api/admin/pricelist/'+currentEditId,{method:'PUT',headers:{'Content-Type':'application/json','x-admin-password':sessionPass},body:JSON.stringify(payload)})
.then(handleResponseStatus)
.then(function(){closeEditModal();loadData()})
.catch(function(){})
.finally(function(){if(btn){btn.textContent=oldText;btn.disabled=false}});
}
function addData(e){
e.preventDefault();
var btn=document.getElementById('btnSubmit');
var oldText=btn?btn.textContent:'';
if(btn){btn.textContent='Menyimpan...';btn.disabled=true}
var payload={
app_name:document.getElementById('appName').value,
category:document.getElementById('appCat').value,
duration:document.getElementById('appDur').value,
price:document.getElementById('appPrice').value,
status:document.getElementById('appStatus').value,
notes:document.getElementById('appNotes').value,
flash_price:document.getElementById('appFlashPrice').value
};
fetch('/api/admin/pricelist',{method:'POST',headers:{'Content-Type':'application/json','x-admin-password':sessionPass},body:JSON.stringify(payload)})
.then(handleResponseStatus)
.then(function(){
var form=document.getElementById('addForm');
if(form)form.reset();
setSearchKeyword('');
loadData();
})
.catch(function(){})
.finally(function(){if(btn){btn.textContent=oldText;btn.disabled=false}});
}
function submitAddAppForm(e){
e.preventDefault();
var btn=document.getElementById('btnSubmitApp');
var oldText=btn?btn.textContent:'';
if(btn){btn.textContent='Menyimpan...';btn.disabled=true}
var appName=(document.getElementById('newAppName').value||'').trim();
var logoUrlVal=(document.getElementById('newAppLogoUrl').value||'').trim();
var appType=(document.getElementById('newAppType').value||'lainnya').trim();
if(!appName){alert('Nama aplikasi wajib diisi');if(btn){btn.textContent=oldText;btn.disabled=false}return}
var payload={app_name:appName,logo_url:logoUrlVal,app_type:appType};
fetch('/api/admin/app-metadata',{method:'POST',headers:{'Content-Type':'application/json','x-admin-password':sessionPass},body:JSON.stringify(payload)})
.then(function(r){return r.json().then(function(d){return{ok:r.ok,data:d}})})
.then(function(res){
if(!res.ok){throw new Error(res.data.error||'Gagal menyimpan')}
var toggle=document.getElementById('addAppSheetToggle');
if(toggle)toggle.checked=false;
var form=document.getElementById('addAppForm');
if(form)form.reset();
resetLogoPickerPreview('newApp');
setDD('newAppType','lainnya');
expandedApps[appName]=true;
if(res.data&&res.data.logo_error){alert('Aplikasi tersimpan, tetapi logo gagal dipasang: '+res.data.logo_error)}
loadData();
})
.catch(function(err){alert('Error: '+(err&&err.message?err.message:'tidak diketahui'))})
.finally(function(){if(btn){btn.textContent=oldText;btn.disabled=false}});
}
function openEditAppModal(appName){
var meta=getMeta(appName)||{logo_path:'',app_type:'lainnya'};
document.getElementById('editAppName').value=appName;
document.getElementById('editAppNameDisplay').textContent=appName;
setDD('editAppType',meta.app_type||'lainnya');
document.getElementById('editAppLogoUrl').value='';
logoPickerState.isEdit=true;
logoPickerState.target='editApp';
logoPickerState.currentSlug=meta.logo_path||'';
logoPickerState.currentUrl='';
renderLogoPreview('editApp',logoPickerState.currentSlug);
document.getElementById('editAppModal').classList.remove('hidden');
}
function closeEditAppModal(){
document.getElementById('editAppModal').classList.add('hidden');
}
function submitEditAppForm(e){
e.preventDefault();
var btn=e.target.querySelector('.submit-btn');
var oldText=btn?btn.textContent:'';
if(btn){btn.textContent='Menyimpan...';btn.disabled=true}
var appName=(document.getElementById('editAppName').value||'').trim();
var logoUrlVal=(document.getElementById('editAppLogoUrl').value||'').trim();
var appType=(document.getElementById('editAppType').value||'lainnya').trim();
if(!appName){alert('Nama aplikasi wajib diisi');if(btn){btn.textContent=oldText;btn.disabled=false}return}
var payload={app_name:appName,app_type:appType};
if(logoUrlVal)payload.logo_url=logoUrlVal;
var originalName=document.getElementById('editAppNameDisplay').textContent;
fetch('/api/admin/app-metadata/'+encodeURIComponent(originalName),{method:'PUT',headers:{'Content-Type':'application/json','x-admin-password':sessionPass},body:JSON.stringify(payload)})
.then(function(r){return r.json().then(function(d){return{ok:r.ok,data:d}})})
.then(function(res){
if(!res.ok){throw new Error(res.data.error||'Gagal menyimpan')}
closeEditAppModal();
loadData();
})
.catch(function(err){alert('Error: '+(err&&err.message?err.message:'tidak diketahui'))})
.finally(function(){if(btn){btn.textContent=oldText;btn.disabled=false}});
}
function openLogoPicker(target){
logoPickerState.target=target;
logoPickerState.currentUrl='';
logoPickerState.currentSlug='';
var searchInput=document.getElementById('logoSearchInput');
var urlInput=document.getElementById('logoUrlInput');
if(searchInput)searchInput.value='';
if(urlInput)urlInput.value='';
renderLogoSearchResults('');
switchLogoTab('search');
updateLogoPickerConfirm();
document.getElementById('logoPickerModal').classList.remove('hidden');
}
function closeLogoPicker(){
document.getElementById('logoPickerModal').classList.add('hidden');
}
function switchLogoTab(tab){
document.querySelectorAll('.logo-tab').forEach(function(el){el.classList.toggle('active',el.getAttribute('data-tab')===tab)});
document.querySelectorAll('.logo-tab-pane').forEach(function(el){el.classList.toggle('active',el.getAttribute('data-pane')===tab)});
}
function renderLogoSearchResults(q){
var grid=document.getElementById('logoSearchResults');
var hint=document.getElementById('logoSearchHint');
if(!grid)return;
while(grid.firstChild)grid.removeChild(grid.firstChild);
var query=(q||'').toLowerCase().trim();
fetch('/api/admin/logo-suggestions?search='+encodeURIComponent(query),{headers:{'x-admin-password':sessionPass}})
.then(function(r){return r.json()})
.then(function(list){
if(!Array.isArray(list))list=[];
if(!list.length){hint.textContent=query?'Tidak ada hasil untuk "'+query+'"':'Menampilkan saran bawaan.';return}
hint.textContent='Menampilkan '+list.length+' saran.';
list.forEach(function(item){
var div=ce('div','logo-search-item');
div.setAttribute('data-url',item.url);
div.setAttribute('data-name',item.name);
if(logoPickerState.currentUrl===item.url)div.classList.add('selected');
var img=ce('img');
img.src=item.url;
img.alt=item.name;
img.onerror=function(){this.style.display='none'};
div.appendChild(img);
div.appendChild(ce('span',null,item.name));
div.addEventListener('click',function(){
logoPickerState.currentUrl=item.url;
logoPickerState.currentSlug='';
document.querySelectorAll('.logo-search-item').forEach(function(el){el.classList.remove('selected')});
div.classList.add('selected');
updateLogoPickerConfirm();
});
grid.appendChild(div);
});
})
.catch(function(){hint.textContent='Gagal memuat saran.'});
}
function updateLogoPickerConfirm(){
var btn=document.getElementById('logoPickerConfirm');
if(!btn)return;
btn.disabled=!logoPickerState.currentUrl;
}
function confirmLogoPicker(){
if(!logoPickerState.currentUrl)return;
var target=logoPickerState.target;
document.getElementById(target+'LogoUrl').value=logoPickerState.currentUrl;
renderLogoPreview(target,null,logoPickerState.currentUrl);
closeLogoPicker();
}
function renderLogoPreview(target,slug,directUrl){
var preview=document.getElementById(target+'LogoPreview');
var clearBtn=document.getElementById(target+'LogoClearBtn');
if(!preview)return;
while(preview.firstChild)preview.removeChild(preview.firstChild);
var url=directUrl||(slug?logoUrl(slug):'');
if(url){
var img=ce('img');
img.src=url;
img.alt='preview';
img.onerror=function(){this.parentNode.removeChild(this);preview.appendChild(document.createTextNode('Gambar gagal dimuat'));preview.classList.remove('has-logo')};
preview.appendChild(img);
preview.classList.add('has-logo');
if(clearBtn)clearBtn.style.display='';
}else{
preview.appendChild(document.createTextNode('Belum dipilih'));
preview.classList.remove('has-logo');
if(clearBtn)clearBtn.style.display='none';
}
}
function resetLogoPickerPreview(target){
document.getElementById(target+'LogoUrl').value='';
logoPickerState.currentUrl='';
logoPickerState.currentSlug='';
renderLogoPreview(target);
}
function toggleSelect(id,isChecked){
if(isChecked)selectedItems.add(id);else selectedItems.delete(id);
updateBulkUI();filterAdminList();
}
function deleteApplication(appName,packageIds){
if(!packageIds.length){
if(!confirm('Aplikasi "'+appName+'" kosong. Hapus metadata & form?'))return;
Promise.all([
fetch('/api/admin/forms/'+encodeURIComponent(appName),{method:'DELETE',headers:{'x-admin-password':sessionPass}}).catch(function(){}),
fetch('/api/admin/app-metadata/'+encodeURIComponent(appName),{method:'DELETE',headers:{'x-admin-password':sessionPass}}).catch(function(){})
]).then(function(){loadData()});
return;
}
if(!confirm('Hapus permanen "'+appName+'" beserta '+packageIds.length+' paket?'))return;
fetch('/api/admin/delete/bulk',{method:'DELETE',headers:{'Content-Type':'application/json','x-admin-password':sessionPass},body:JSON.stringify({ids:packageIds})})
.then(handleResponseStatus)
.then(function(){
return fetch('/api/admin/forms/'+encodeURIComponent(appName),{method:'DELETE',headers:{'x-admin-password':sessionPass}}).catch(function(){});
})
.then(function(){
packageIds.forEach(function(id){selectedItems.delete(id)});
updateBulkUI();loadData();
}).catch(function(){});
}
function clearSelection(){selectedItems.clear();updateBulkUI();filterAdminList()}
function updateBulkUI(){
var bar=document.getElementById('bulkActionBar');
var count=document.getElementById('bulkCount');
var produkTab=document.getElementById('tab-produk');
var isProdukActive=produkTab&&produkTab.classList.contains('active');
if(selectedItems.size>0&&isProdukActive){
if(bar)bar.classList.add('visible');
if(count)count.textContent=selectedItems.size+' item 🎀';
}else{
if(bar)bar.classList.remove('visible');
}
}
function bulkUpdateStatus(status){
if(!confirm('Ubah status '+selectedItems.size+' paket menjadi '+status+'?'))return;
fetch('/api/admin/status/bulk',{method:'PUT',headers:{'Content-Type':'application/json','x-admin-password':sessionPass},body:JSON.stringify({ids:Array.from(selectedItems),status:status})})
.then(handleResponseStatus)
.then(function(){clearSelection();loadData()})
.catch(function(){});
}
function bulkDelete(){
if(!confirm('Hapus permanen '+selectedItems.size+' paket terpilih?'))return;
fetch('/api/admin/delete/bulk',{method:'DELETE',headers:{'Content-Type':'application/json','x-admin-password':sessionPass},body:JSON.stringify({ids:Array.from(selectedItems)})})
.then(handleResponseStatus)
.then(function(){clearSelection();loadData()})
.catch(function(){});
}
function toggleStatus(id,isChecked){
var newStatus=isChecked?'Ready':'Sold';
var itemIndex=globalAdminData.findIndex(function(item){return item.id===id});
if(itemIndex!==-1)globalAdminData[itemIndex].status=newStatus;
filterAdminList();
fetch('/api/admin/status/'+id,{method:'PUT',headers:{'Content-Type':'application/json','x-admin-password':sessionPass},body:JSON.stringify({status:newStatus})})
.then(handleResponseStatus)
.catch(function(){loadData()});
}
function deleteData(id){
if(!confirm('Yakin ingin menghapus paket ini?'))return;
fetch('/api/admin/pricelist/'+id,{method:'DELETE',headers:{'x-admin-password':sessionPass}})
.then(handleResponseStatus)
.then(function(){loadData()})
.catch(function(){});
}
document.addEventListener('DOMContentLoaded',function(){
var addForm=document.getElementById('addForm');
if(addForm)addForm.addEventListener('submit',addData);
var editForm=document.getElementById('editForm');
if(editForm)editForm.addEventListener('submit',submitEditForm);
var addPkgForm=document.getElementById('addPackageForm');
if(addPkgForm)addPkgForm.addEventListener('submit',submitAddPackageForm);
var addAppForm=document.getElementById('addAppForm');
if(addAppForm)addAppForm.addEventListener('submit',submitAddAppForm);
var editAppForm=document.getElementById('editAppForm');
if(editAppForm)editAppForm.addEventListener('submit',submitEditAppForm);
var btnExpandAll=document.getElementById('btnExpandAll');
if(btnExpandAll)btnExpandAll.addEventListener('click',expandAll);
var btnCollapseAll=document.getElementById('btnCollapseAll');
if(btnCollapseAll)btnCollapseAll.addEventListener('click',collapseAll);
var btnReorder=document.getElementById('btnReorder');
if(btnReorder)btnReorder.addEventListener('click',openReorderModal);
var btnReorderTop=document.getElementById('btnReorderTop');
if(btnReorderTop)btnReorderTop.addEventListener('click',openReorderModal);
var btnSaveReorder=document.getElementById('btnSaveReorder');
if(btnSaveReorder)btnSaveReorder.addEventListener('click',saveReorderModal);
var btnImport=document.getElementById('btnImport');
if(btnImport)btnImport.addEventListener('click',openImportModal);
var btnExport=document.getElementById('btnExport');
if(btnExport)btnExport.addEventListener('click',exportCSV);
var btnSubmitImport=document.getElementById('btnSubmitImport');
if(btnSubmitImport)btnSubmitImport.addEventListener('click',processCSV);
var btnAddField=document.getElementById('btnAddField');
if(btnAddField)btnAddField.addEventListener('click',addFormFieldBuilder);
var btnSaveForm=document.getElementById('btnSaveForm');
if(btnSaveForm)btnSaveForm.addEventListener('click',saveFormBuilderConfig);
var adminSearch=document.getElementById('adminSearchInput');
if(adminSearch)adminSearch.addEventListener('input',function(){setSearchKeyword(this.value)});
var adminSearchTop=document.getElementById('adminSearchInputTop');
if(adminSearchTop)adminSearchTop.addEventListener('input',function(){setSearchKeyword(this.value)});
var btnBulkReady=document.getElementById('btnBulkReady');
if(btnBulkReady)btnBulkReady.addEventListener('click',function(){bulkUpdateStatus('Ready')});
var btnBulkSold=document.getElementById('btnBulkSold');
if(btnBulkSold)btnBulkSold.addEventListener('click',function(){bulkUpdateStatus('Sold')});
var btnBulkDelete=document.getElementById('btnBulkDelete');
if(btnBulkDelete)btnBulkDelete.addEventListener('click',bulkDelete);
var btnBulkCancel=document.getElementById('btnBulkCancel');
if(btnBulkCancel)btnBulkCancel.addEventListener('click',clearSelection);
var newAppLogoPickBtn=document.getElementById('newAppLogoPickBtn');
if(newAppLogoPickBtn)newAppLogoPickBtn.addEventListener('click',function(){openLogoPicker('newApp')});
var newAppLogoClearBtn=document.getElementById('newAppLogoClearBtn');
if(newAppLogoClearBtn)newAppLogoClearBtn.addEventListener('click',function(){resetLogoPickerPreview('newApp')});
var editAppLogoPickBtn=document.getElementById('editAppLogoPickBtn');
if(editAppLogoPickBtn)editAppLogoPickBtn.addEventListener('click',function(){openLogoPicker('editApp')});
var editAppLogoClearBtn=document.getElementById('editAppLogoClearBtn');
if(editAppLogoClearBtn)editAppLogoClearBtn.addEventListener('click',function(){
document.getElementById('editAppLogoUrl').value='__clear__';
renderLogoPreview('editApp');
});
var editAppClose=document.getElementById('editAppClose');
if(editAppClose)editAppClose.addEventListener('click',closeEditAppModal);
var editAppCancelBtn=document.getElementById('editAppCancelBtn');
if(editAppCancelBtn)editAppCancelBtn.addEventListener('click',closeEditAppModal);
var logoPickerClose=document.getElementById('logoPickerClose');
if(logoPickerClose)logoPickerClose.addEventListener('click',closeLogoPicker);
var logoPickerCancel=document.getElementById('logoPickerCancel');
if(logoPickerCancel)logoPickerCancel.addEventListener('click',closeLogoPicker);
var logoPickerConfirm=document.getElementById('logoPickerConfirm');
if(logoPickerConfirm)logoPickerConfirm.addEventListener('click',confirmLogoPicker);
document.querySelectorAll('.logo-tab').forEach(function(el){
el.addEventListener('click',function(){switchLogoTab(el.getAttribute('data-tab'))});
});
var logoSearchInput=document.getElementById('logoSearchInput');
if(logoSearchInput){
var searchTimer=null;
logoSearchInput.addEventListener('input',function(){
clearTimeout(searchTimer);
var v=this.value;
searchTimer=setTimeout(function(){renderLogoSearchResults(v)},200);
});
}
var logoUrlInput=document.getElementById('logoUrlInput');
if(logoUrlInput){
logoUrlInput.addEventListener('input',function(){
var v=this.value.trim();
logoPickerState.currentUrl=v;
logoPickerState.currentSlug='';
document.querySelectorAll('.logo-search-item').forEach(function(el){el.classList.remove('selected')});
updateLogoPickerConfirm();
});
}
var pickerBackdrop=document.querySelector('.logo-picker-backdrop');
if(pickerBackdrop)pickerBackdrop.addEventListener('click',closeLogoPicker);
});
