(function(M){
var data=[],expanded={},search='',metaObj=null,formsObj=null;
function saveVariant(payload,done){
var isEdit=payload.id!=null;
var url=isEdit?('/api/admin/rpricelist/'+payload.id):'/api/admin/rpricelist';
Sec.raw(url,{method:isEdit?'PUT':'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(payload)})
.then(function(){if(done)done()})
.catch(function(e){uiAlert(e.message||'Gagal menyimpan paket reseller.','Kesalahan')});
}
function deleteRslApp(app,ids){
if(!ids.length){
uiConfirm('Aplikasi "'+app+'" kosong. Hapus metadata?','Hapus Aplikasi',function(){
Sec.raw('/api/admin/app-metadata/'+encodeURIComponent(app),{method:'DELETE'}).then(function(){load()}).catch(function(){});
},{danger:true,okText:'Hapus'});
return;
}
uiConfirm('Hapus permanen "'+app+'" beserta '+ids.length+' paket reseller?','Hapus Aplikasi',function(){
var promises=ids.map(function(id){return Sec.raw('/api/admin/rpricelist/'+id,{method:'DELETE'}).catch(function(){})});
Promise.all(promises).then(function(){load()});
},{danger:true,okText:'Hapus'});
}
function opts(){
return{
expanded:expanded,
showFlash:true,
showStock:true,
showBulk:false,
showDrag:false,
onToggleExpand:function(app){expanded[app]=!expanded[app];render()},
onToggleStatus:function(pkg,checked){
var newStatus=checked?'Ready':'Sold';
saveVariant({id:pkg.id,app_name:pkg.app_name,category:pkg.category,duration:pkg.duration,price:pkg.price,status:newStatus,notes:pkg.notes||'',flash_price:pkg.flash_price||''},function(){load()});
},
onEditPkg:function(pkg){
CatalogShared.openPkgModal(pkg,null,function(payload,closeFn,restoreFn){
saveVariant(payload,function(){closeFn();load()},restoreFn);
},{showFlash:true});
},
onDeletePkg:function(pkg){
uiConfirm('Hapus '+pkg.app_name+' '+pkg.category+' '+pkg.duration+' dari pricelist reseller?','Hapus Paket',function(){
Sec.raw('/api/admin/rpricelist/'+pkg.id,{method:'DELETE'}).then(function(){uiToast('Paket dihapus.');load()}).catch(function(e){uiAlert(e.message||'Gagal menghapus paket.','Kesalahan')});
},{danger:true,okText:'Hapus'});
},
onManageStock:function(pkg){if(M.openStock)M.openStock(pkg)},
onEditApp:function(app){AppModals.openEdit(app)},
onAddPkg:function(app){
CatalogShared.openPkgModal(null,app,function(payload,closeFn,restoreFn){
saveVariant(payload,function(){closeFn();load()},restoreFn);
},{showFlash:true});
},
onFormBuilder:function(app,fields){FormBuilder.open(app,fields,function(){load()})},
onDeleteApp:function(app,ids){deleteRslApp(app,ids)}
};
}
function render(){
var wrap=document.getElementById('rpriceAccordion');
if(!wrap)return;
while(wrap.firstChild)wrap.removeChild(wrap.firstChild);
var q=search.toLowerCase();
var filtered=data.filter(function(r){
return!q||r.app_name.toLowerCase().indexOf(q)>=0||r.category.toLowerCase().indexOf(q)>=0||r.duration.toLowerCase().indexOf(q)>=0;
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
if(!apps.length){wrap.appendChild(ce('div','empty-state','Belum ada paket reseller. Ketuk ＋ di atas untuk menambah aplikasi baru.'));return}
var o=opts();
apps.forEach(function(app){
var packages=grouped[app];
packages.sort(function(a,b){return((a.app_sort_order||9999)-(b.app_sort_order||9999))||(a.id-b.id)});
wrap.appendChild(CatalogShared.buildGroup(app,packages,o));
});
}
function load(){
return Promise.all([Apps.meta(),Apps.forms(),Sec.json('/api/admin/rpricelist')]).then(function(res){
metaObj=res[0]||{};
formsObj=res[1]||{};
data=res[2]||[];
render();
}).catch(function(){
var wrap=document.getElementById('rpriceAccordion');
if(wrap){while(wrap.firstChild)wrap.removeChild(wrap.firstChild);wrap.appendChild(ce('div','empty-state','Gagal memuat pricelist reseller.'))}
});
}
M.groupsInit=function(){return load()};
M.loadGroups=load;
M.setFilter=function(v){search=String(v||'').trim();render()};
})(AdminModules.reseller=AdminModules.reseller||{});
