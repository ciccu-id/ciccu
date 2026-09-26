var CatalogShared=(function(){
function pkgStatusReady(p){return!p.status||String(p.status).toLowerCase()==='ready'}
function allSold(packages){return packages.length>0&&packages.every(function(p){return p.status&&String(p.status).toLowerCase()!=='ready'})}
function appSortVal(p){return(p.app_sort_order&&p.app_sort_order>0)?p.app_sort_order:9999}
function pkgSortVal(p){return(p.sort_order&&p.sort_order>0)?p.sort_order:9999}
function groupApps(rows,searchKey){
var grouped={},appOrder={},appFirst={};
rows.forEach(function(r){
if(!grouped[r.app_name])grouped[r.app_name]=[];
grouped[r.app_name].push(r);
var o=appSortVal(r);
if(!appOrder[r.app_name]||o<appOrder[r.app_name])appOrder[r.app_name]=o;
if(!appFirst[r.app_name]||r.id<appFirst[r.app_name])appFirst[r.app_name]=r.id;
});
var kk=(searchKey||'').toLowerCase();
var metaKeys=Object.keys(Apps.metaSync?Apps.metaSync():{});
return{grouped:grouped,appOrder:appOrder,appFirst:appFirst};
}
function sortApps(grouped,appOrder,appFirst){
return Object.keys(grouped).sort(function(a,b){return(appOrder[a]-appOrder[b])||(appFirst[a]-appFirst[b])});
}
function buildPkgRow(pkg,opts){
opts=opts||{};
var isReady=pkgStatusReady(pkg);
var row=ce('div','pkg-row'+(isReady?'':' sold'));
row.setAttribute('data-id',pkg.id);
if(opts.showDrag){
var drag=ce('div','pkg-drag drag-handle');
drag.appendChild(admSvg('M4 8h16M4 16h16','1rem','1rem'));
row.appendChild(drag);
}
var main=ce('div','pkg-main');
if(opts.showBulk&&opts.selectedIds){
var cb=ce('input','pkg-cb');cb.type='checkbox';
if(opts.selectedIds.has(pkg.id))cb.checked=true;
cb.addEventListener('change',function(){if(opts.onToggleSelect)opts.onToggleSelect(pkg.id,this.checked)});
main.appendChild(cb);
}
var info=ce('div','pkg-info');
var line=ce('p','pkg-info-line');
line.appendChild(ce('span',null,pkg.category+' • '));
line.appendChild(ce('span','app-name',pkg.duration));
line.appendChild(ce('span',null,' • '));
line.appendChild(ce('span','price',pkg.price));
if(opts.showFlash&&pkg.flash_price&&String(pkg.flash_price).trim()!=='')line.appendChild(ce('span','pkg-flash-badge','⚡FLASH'));
info.appendChild(line);
if(pkg.notes&&String(pkg.notes).toLowerCase()!=='nan')info.appendChild(ce('p','pkg-note','↳ '+pkg.notes));
main.appendChild(info);
row.appendChild(main);
var actionsCol=ce('div','pkg-actions');
var statusCol=ce('div','pkg-status-col');
statusCol.appendChild(ce('span','status-badge '+(isReady?'ready':'sold'),isReady?'READY':'SOLD'));
var tw=ce('div','toggle-wrap');
var tcb=ce('input','toggle-cb');tcb.type='checkbox';if(isReady)tcb.checked=true;
var track=ce('span','toggle-track');var circle=ce('span','toggle-circle');
tw.appendChild(tcb);tw.appendChild(track);tw.appendChild(circle);
tcb.addEventListener('change',function(){if(opts.onToggleStatus)opts.onToggleStatus(pkg,this.checked)});
statusCol.appendChild(tw);
actionsCol.appendChild(statusCol);
var btnGroup=ce('div','pkg-btn-group');
if(opts.showStock){
var stockBtn=ce('button','pkg-edit-btn');stockBtn.type='button';stockBtn.title='Kelola Stok';
stockBtn.appendChild(admSvg('M5 8h14M5 8a2 2 0 110-4h14a2 2 0 110 4M5 8v10a2 2 0 002 2h10a2 2 0 002-2V8m-9 4h4','.875rem','.875rem'));
stockBtn.addEventListener('click',function(){if(opts.onManageStock)opts.onManageStock(pkg)});
btnGroup.appendChild(stockBtn);
btnGroup.appendChild(ce('span','pkg-btn-sep'));
}
var editBtn=ce('button','pkg-edit-btn');editBtn.type='button';editBtn.title='Edit Paket';
editBtn.appendChild(admSvg('M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z','.875rem','.875rem'));
editBtn.addEventListener('click',function(){if(opts.onEditPkg)opts.onEditPkg(pkg)});
btnGroup.appendChild(editBtn);
btnGroup.appendChild(ce('span','pkg-btn-sep'));
var delBtn=ce('button','pkg-del-btn');delBtn.type='button';delBtn.title='Hapus Paket';
delBtn.appendChild(admSvg('M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16','.875rem','.875rem'));
delBtn.addEventListener('click',function(){if(opts.onDeletePkg)opts.onDeletePkg(pkg)});
btnGroup.appendChild(delBtn);
actionsCol.appendChild(btnGroup);
row.appendChild(actionsCol);
return row;
}
function buildGroup(appName,packages,opts){
opts=opts||{};
var isOpen=!!(opts.expanded&&opts.expanded[appName]);
var sold=allSold(packages);
var meta=Apps.get(appName);
var formFields=Apps.fields(appName);
var group=ce('div','app-group');
group.setAttribute('data-app',appName);
var header=ce('div','app-header '+(sold?'app-header-gray':'app-header-pink')+(isOpen?' open':''));
if(meta&&meta.logo_path){
var logo=ce('img','app-header-logo');
logo.src=Apps.logoUrl(meta.logo_path);
logo.alt=appName;
header.appendChild(logo);
}
var hinfo=ce('div','app-header-info');
var nameRow=ce('h3','app-header-name'+(sold?' sold':''),appName);
if(sold){
var sb=ce('span',null,'Habis');
nameRow.appendChild(sb);
}
hinfo.appendChild(nameRow);
hinfo.appendChild(ce('p','app-header-form',formFields.length>0?'📋 Formulir Pesanan: '+formFields.join(', '):'🌸 Tidak memakai formulir'));
var countWrap=ce('div','app-header-count');
if(meta&&meta.app_type&&meta.app_type!=='lainnya')countWrap.appendChild(ce('span',null,meta.app_type));
countWrap.appendChild(ce('span',null,packages.length+' Paket'));
hinfo.appendChild(countWrap);
header.appendChild(hinfo);
var arrow=ce('div','app-header-arrow');
arrow.appendChild(admSvg('M19 9l-7 7-7-7','1.25rem','1.25rem'));
header.appendChild(arrow);
var hact=ce('div','app-header-actions');
var kebab=ce('div','kebab-wrap');
var kbtn=ce('button','kebab-btn','⋮');kbtn.type='button';kbtn.title='Menu aplikasi';
var kmenu=ce('div','kebab-menu');
var ki1=ce('button','kebab-item','✏️ Edit Aplikasi');ki1.type='button';
ki1.addEventListener('click',function(e){e.stopPropagation();kebab.classList.remove('open');if(opts.onEditApp)opts.onEditApp(appName)});
var kiPkg=ce('button','kebab-item','＋ Tambah Paket');kiPkg.type='button';
kiPkg.addEventListener('click',function(e){e.stopPropagation();kebab.classList.remove('open');if(opts.onAddPkg)opts.onAddPkg(appName)});
var ki2=ce('button','kebab-item','📋 Formulir Pesanan');ki2.type='button';
ki2.addEventListener('click',function(e){e.stopPropagation();kebab.classList.remove('open');if(opts.onFormBuilder)opts.onFormBuilder(appName,formFields)});
var ki3=ce('button','kebab-item danger','🗑 Hapus Aplikasi');ki3.type='button';
ki3.addEventListener('click',function(e){e.stopPropagation();kebab.classList.remove('open');if(opts.onDeleteApp)opts.onDeleteApp(appName,packages.map(function(p){return p.id}))});
kmenu.appendChild(ki1);kmenu.appendChild(kiPkg);kmenu.appendChild(ki2);kmenu.appendChild(ki3);
kebab.appendChild(kbtn);kebab.appendChild(kmenu);
kbtn.addEventListener('click',function(e){
e.stopPropagation();
var willOpen=!kebab.classList.contains('open');
document.querySelectorAll('.kebab-wrap.open').forEach(function(w){w.classList.remove('open')});
if(willOpen)kebab.classList.add('open');
});
hact.appendChild(kebab);
header.appendChild(hact);
header.addEventListener('click',function(e){
if(e.target.closest('.kebab-wrap')||e.target.tagName==='IMG')return;
if(opts.onToggleExpand)opts.onToggleExpand(appName);
});
group.appendChild(header);
var body=ce('div','app-body '+(isOpen?'open':'closed'));
var inner=ce('div','app-body-inner');
var content=ce('div','app-body-content');
var pkgHeader=ce('div','pkg-section-header');
pkgHeader.appendChild(ce('span','pkg-section-label','📋 Daftar Paket'));
var addPkgBtn=ce('button','add-pkg-btn','＋ Tambah Paket');addPkgBtn.type='button';
addPkgBtn.addEventListener('click',function(){if(opts.onAddPkg)opts.onAddPkg(appName)});
pkgHeader.appendChild(addPkgBtn);
content.appendChild(pkgHeader);
var pkgList=ce('div','pkg-list'+(opts.showDrag?' sortable-list':''));
packages.forEach(function(pkg){pkgList.appendChild(buildPkgRow(pkg,opts))});
content.appendChild(pkgList);
inner.appendChild(content);
body.appendChild(inner);
group.appendChild(body);
return group;
}
function openReorderModal(appList,onSave,opts){
opts=opts||{};
var s=ModalKit.shell({title:opts.title||'Urutan Aplikasi',sub:'Seret untuk mengubah urutan tampil',scroll:true});
var list=ce('div','reorder-list');
appList.forEach(function(app,idx){
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
s.body.appendChild(list);
var sortable=null;
if(typeof Sortable!=='undefined'){
sortable=new Sortable(list,{animation:150,handle:'.reorder-handle',ghostClass:'sortable-ghost',onEnd:function(){
var items=list.querySelectorAll('.reorder-item');
items.forEach(function(el,i){el.querySelector('.reorder-num').textContent=String(i+1)});
}});
}
var save=ModalKit.btn('Simpan Urutan','submit-btn',function(){
var items=list.querySelectorAll('.reorder-item');
var order=[];
items.forEach(function(el,i){order.push({app_name:el.getAttribute('data-app'),app_sort_order:i+1})});
save.disabled=true;save.textContent='Menyimpan...';
if(onSave)onSave(order,function(){s.close()},function(){save.disabled=false;save.textContent='Simpan Urutan'});
});
s.foot.appendChild(ModalKit.btn('Batal','cancel-btn',s.close));
s.foot.appendChild(save);
document.body.appendChild(s.overlay);
}
function openPkgModal(variant,appPrefill,onSave,opts){
opts=opts||{};
var isEdit=!!variant;
var s=ModalKit.shell({title:isEdit?'Edit Paket':'Tambah Paket',sub:isEdit?(variant.app_name+' • '+variant.category+' • '+variant.duration):(appPrefill||''),scroll:true});
var f={app_name:variant?variant.app_name:(appPrefill||''),category:variant?variant.category:'',duration:variant?variant.duration:'',price:variant?variant.price:'',status:variant?variant.status:'Ready',notes:variant?(variant.notes||''):''};
var fields=[
{id:'pkgAppName',label:'Nama Aplikasi',value:f.app_name,type:'text'},
{id:'pkgCategory',label:'Kategori',value:f.category,type:'text'},
{id:'pkgDuration',label:'Durasi',value:f.duration,type:'text'},
{id:'pkgPrice',label:'Harga',value:f.price,type:'text'},
{id:'pkgNotes',label:'Catatan',value:f.notes,type:'text'}
];
var inputs={};
fields.forEach(function(fd){
var wrap=ce('div','adm-field');
wrap.appendChild(ce('label',null,fd.label));
var inp=ce('input','adm-input');inp.type=fd.type;inp.value=fd.value;inp.autocomplete='off';
wrap.appendChild(inp);
s.body.appendChild(wrap);
inputs[fd.id]=inp;
});
var statusWrap=ce('div','adm-field');
statusWrap.appendChild(ce('label',null,'Status'));
var statusSlot=ce('div');
statusWrap.appendChild(statusSlot);
s.body.appendChild(statusWrap);
var dd=DD.build({options:[{value:'Ready',label:'Ready'},{value:'Sold',label:'Sold'}],value:f.status||'Ready'});
statusSlot.appendChild(dd.el);
if(opts.showFlash){
var flashWrap=ce('div','adm-field');
flashWrap.appendChild(ce('label',null,'Harga Flash (opsional)'));
var flashInp=ce('input','adm-input');flashInp.type='text';flashInp.value=variant?variant.flash_price||'':'';flashInp.autocomplete='off';
flashWrap.appendChild(flashInp);
s.body.appendChild(flashWrap);
inputs.pkgFlash=flashInp;
}
var save=ModalKit.btn(isEdit?'Simpan Perubahan':'Tambah Paket','submit-btn',function(){
var payload={
app_name:String(inputs.pkgAppName.value||'').trim(),
category:String(inputs.pkgCategory.value||'').trim(),
duration:String(inputs.pkgDuration.value||'').trim(),
price:String(inputs.pkgPrice.value||'').trim(),
status:dd.get()||'Ready',
notes:String(inputs.pkgNotes.value||'').trim()
};
if(opts.showFlash&&inputs.pkgFlash)payload.flash_price=String(inputs.pkgFlash.value||'').trim();
if(!payload.app_name||!payload.category||!payload.duration||!payload.price)return uiAlert('Nama aplikasi, kategori, durasi, dan harga wajib diisi.','Data Belum Lengkap');
if(isEdit)payload.id=variant.id;
save.disabled=true;save.textContent='Menyimpan...';
if(onSave)onSave(payload,function(){s.close()},function(){save.disabled=false;save.textContent=isEdit?'Simpan Perubahan':'Tambah Paket'});
});
s.foot.appendChild(ModalKit.btn('Batal','cancel-btn',s.close));
s.foot.appendChild(save);
document.body.appendChild(s.overlay);
}
return{
buildGroup:buildGroup,
buildPkgRow:buildPkgRow,
openReorderModal:openReorderModal,
openPkgModal:openPkgModal,
pkgStatusReady:pkgStatusReady,
allSold:allSold,
sortApps:sortApps
};
})();
