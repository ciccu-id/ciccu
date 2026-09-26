(function(M){
var data=[],expanded={},search='',metaObj=null,formsObj=null,sortables=[];
function destroySortables(){
sortables.forEach(function(s){s.destroy()});
sortables=[];
}
function initSortable(){
destroySortables();
if(typeof Sortable==='undefined')return;
var containers=document.querySelectorAll('#publicAccordion .sortable-list');
containers.forEach(function(container){
var s=new Sortable(container,{
animation:150,
handle:'.drag-handle',
delay:200,
delayOnTouchOnly:true,
ghostClass:'sortable-ghost',
dragClass:'sortable-drag',
onEnd:function(){
var items=container.querySelectorAll('.pkg-row');
var newOrder=[];
items.forEach(function(el,index){newOrder.push({id:parseInt(el.getAttribute('data-id'),10),sort_order:index+1})});
Sec.raw('/api/admin/pricelist/reorder',{method:'PUT',headers:{'Content-Type':'application/json'},body:JSON.stringify({order:newOrder})})
.then(function(){uiToast('Urutan paket disimpan.')})
.catch(function(){load()});
}
});
sortables.push(s);
});
}
function toggleStatus(pkg,checked){
var newStatus=checked?'Ready':'Sold';
Sec.raw('/api/admin/status/'+pkg.id,{method:'PUT',headers:{'Content-Type':'application/json'},body:JSON.stringify({status:newStatus})})
.then(function(){load()})
.catch(function(e){uiAlert(e.message||'Gagal mengubah status.','Kesalahan')});
}
function deletePkg(pkg){
uiConfirm('Yakin ingin menghapus paket ini?','Hapus Paket',function(){
Sec.raw('/api/admin/pricelist/'+pkg.id,{method:'DELETE'})
.then(function(){uiToast('Paket dihapus.');load()})
.catch(function(e){uiAlert(e.message||'Gagal menghapus paket.','Kesalahan')});
},{danger:true,okText:'Hapus'});
}
function deleteApp(appName,packageIds){
if(!packageIds.length){
uiConfirm('Aplikasi "'+appName+'" kosong. Hapus metadata & form?','Hapus Aplikasi',function(){
Promise.all([
Sec.raw('/api/admin/forms/'+encodeURIComponent(appName),{method:'DELETE'}).catch(function(){}),
Sec.raw('/api/admin/app-metadata/'+encodeURIComponent(appName),{method:'DELETE'}).catch(function(){})
]).then(function(){load()});
},{danger:true,okText:'Hapus'});
return;
}
uiConfirm('Hapus permanen "'+appName+'" beserta '+packageIds.length+' paket?','Hapus Aplikasi',function(){
Sec.raw('/api/admin/delete/bulk',{method:'DELETE',headers:{'Content-Type':'application/json'},body:JSON.stringify({ids:packageIds})})
.then(function(){
return Sec.raw('/api/admin/forms/'+encodeURIComponent(appName),{method:'DELETE'}).catch(function(){});
})
.then(function(){load()})
.catch(function(){});
},{danger:true,okText:'Hapus'});
}
function openEditPkg(pkg){
CatalogShared.openPkgModal(pkg,null,function(payload,closeFn,restoreFn){
Sec.raw('/api/admin/pricelist/'+pkg.id,{method:'PUT',headers:{'Content-Type':'application/json'},body:JSON.stringify(payload)})
.then(function(){closeFn();load()})
.catch(function(e){uiAlert(e.message||'Gagal menyimpan.','Kesalahan');restoreFn()});
},{showFlash:false});
}
function openAddPkg(app){
CatalogShared.openPkgModal(null,app,function(payload,closeFn,restoreFn){
Sec.raw('/api/admin/pricelist',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(payload)})
.then(function(){closeFn();load()})
.catch(function(e){uiAlert(e.message||'Gagal menyimpan.','Kesalahan');restoreFn()});
},{showFlash:false});
}
function opts(){
return{
expanded:expanded,
showFlash:false,
showStock:false,
showBulk:false,
showDrag:true,
onToggleExpand:function(app){expanded[app]=!expanded[app];render()},
onToggleStatus:function(pkg,checked){toggleStatus(pkg,checked)},
onEditPkg:function(pkg){openEditPkg(pkg)},
onDeletePkg:function(pkg){deletePkg(pkg)},
onEditApp:function(app){AppModals.openEdit(app)},
onAddPkg:function(app){openAddPkg(app)},
onFormBuilder:function(app,fields){FormBuilder.open(app,fields,function(){load()})},
onDeleteApp:function(app,ids){deleteApp(app,ids)}
};
}
function render(){
var wrap=document.getElementById('publicAccordion');
if(!wrap)return;
destroySortables();
while(wrap.firstChild)wrap.removeChild(wrap.firstChild);
var q=search.toLowerCase();
var filtered=data.filter(function(r){
return!q||r.app_name.toLowerCase().indexOf(q)>=0||r.category.toLowerCase().indexOf(q)>=0||r.status.toLowerCase().indexOf(q)>=0;
});
var grouped={},appOrder={},appFirst={};
filtered.forEach(function(r){
if(!grouped[r.app_name])grouped[r.app_name]=[];
grouped[r.app_name].push(r);
var o=(r.app_sort_order&&r.app_sort_order>0)?r.app_sort_order:9999;
if(!appOrder[r.app_name]||o<appOrder[r.app_name])appOrder[r.app_name]=o;
if(!appFirst[r.app_name]||r.id<appFirst[r.app_name])appFirst[r.app_name]=r.id;
});
if(metaObj){
for(var mk in metaObj){
var mn=metaObj[mk]?metaObj[mk].app_name:'';
if(!mn||grouped[mn])continue;
if(q&&mn.toLowerCase().indexOf(q)<0)continue;
grouped[mn]=[];
if(appOrder[mn]===undefined)appOrder[mn]=9999;
if(appFirst[mn]===undefined)appFirst[mn]=999999999;
}
}
var apps=CatalogShared.sortApps(grouped,appOrder,appFirst);
if(!apps.length){
wrap.appendChild(ce('div','empty-state','Tidak ada paket aplikasi ditemukan 🥺'));
return;
}
var o=opts();
apps.forEach(function(app){
var packages=grouped[app];
packages.sort(function(a,b){
var aP=(a.sort_order&&a.sort_order>0)?a.sort_order:9999;
var bP=(b.sort_order&&b.sort_order>0)?b.sort_order:9999;
return(aP-bP)||(a.id-b.id);
});
wrap.appendChild(CatalogShared.buildGroup(app,packages,o));
});
initSortable();
}
function load(){
return Promise.all([Apps.meta(),Apps.forms(),Sec.json('/api/admin/pricelist')]).then(function(res){
metaObj=res[0]||{};
formsObj=res[1]||{};
data=res[2]||[];
render();
}).catch(function(){
var wrap=document.getElementById('publicAccordion');
if(wrap){
while(wrap.firstChild)wrap.removeChild(wrap.firstChild);
wrap.appendChild(ce('div','empty-state','Gagal memuat katalog publik.'));
}
});
}
function expandAll(){
var apps={};
data.forEach(function(item){apps[item.app_name]=true});
Object.keys(apps).forEach(function(app){expanded[app]=true});
render();
}
function collapseAll(){
expanded={};
render();
}
function openReorder(){
var seen={},apps=[];
data.forEach(function(r){
if(!seen[r.app_name]){seen[r.app_name]=true;apps.push(r.app_name)}
});
CatalogShared.openReorderModal(apps,function(order,closeFn,restoreFn){
Sec.raw('/api/admin/reorder-apps',{method:'PUT',headers:{'Content-Type':'application/json'},body:JSON.stringify({order:order})})
.then(function(){closeFn();uiToast('Urutan disimpan.');load()})
.catch(function(e){uiAlert(e.message||'Gagal menyimpan urutan.','Kesalahan');restoreFn()});
},{title:'Urutan Aplikasi'});
}
M.groupsInit=function(){return load()};
M.loadGroups=load;
M.setFilter=function(v){search=String(v||'').trim();render()};
M.expandAll=expandAll;
M.collapseAll=collapseAll;
M.openReorder=openReorder;
})(AdminModules.public=AdminModules.public||{});
