(function(M){
var root=null;
function buildAppList(){
return Sec.json('/api/admin/rpricelist').then(function(rows){
rows=rows||[];
var seen={},apps=[];
rows.forEach(function(r){
if(!seen[r.app_name]){seen[r.app_name]=true;apps.push(r.app_name)}
});
return apps;
});
}
function openReorder(){
buildAppList().then(function(apps){
CatalogShared.openReorderModal(apps,function(order,closeFn,restoreFn){
Sec.raw('/api/admin/rpricelist/reorder-apps',{method:'PUT',headers:{'Content-Type':'application/json'},body:JSON.stringify({order:order})})
.then(function(){closeFn();uiToast('Urutan disimpan.');M.loadGroups()})
.catch(function(e){uiAlert(e.message||'Gagal menyimpan urutan.','Kesalahan');restoreFn()});
},{title:'Urutan Aplikasi Reseller'});
}).catch(function(e){uiAlert(e.message||'Gagal memuat daftar aplikasi.','Kesalahan')});
}
function init(host){
root=host;
root.appendChild(M.view());
var btnReorder=document.getElementById('btnRslReorder');
if(btnReorder)btnReorder.addEventListener('click',openReorder);
var btnAdd=document.getElementById('btnRslAddApp');
if(btnAdd)btnAdd.addEventListener('click',function(){AppModals.openAdd()});
var search=document.getElementById('rpriceSearch');
if(search)search.addEventListener('input',debounce(function(){M.setFilter(search.value)},250));
AppModals.onChanged(function(){M.loadGroups()});
return Promise.all([M.groupsInit(),M.stockInit()]);
}
function destroy(){root=null}
M.init=init;
M.destroy=destroy;
})(AdminModules.reseller=AdminModules.reseller||{});
