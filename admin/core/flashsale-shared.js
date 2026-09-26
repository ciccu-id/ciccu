var FlashShared=(function(){
var sortableInst=null;
function cfgPublic(){
return{
key:'public',
label:'Flash Sale Public',
f:{name:'flash_sale_name',desc:'flash_sale_description',start:'flash_sale_start',end:'flash_sale_end'},
defName:'Flash Sale',
itemsEndpoint:'/api/admin/pricelist',
reorderEndpoint:'/api/admin/flashsale/reorder',
updateEndpoint:function(id){return'/api/admin/pricelist/'+id},
sortVal:function(r){return(r.flash_sort_order&&r.flash_sort_order>0&&r.flash_sort_order<9999)?r.flash_sort_order:9999}
};
}
function cfgReseller(){
return{
key:'reseller',
label:'Flash Sale Reseller',
f:{name:'flash_reseller_name',desc:'flash_reseller_description',start:'flash_reseller_start',end:'flash_reseller_end'},
defName:'Flash Sale Reseller',
itemsEndpoint:'/api/admin/rpricelist',
reorderEndpoint:'/api/admin/rflashsale/reorder',
updateEndpoint:function(id){return'/api/admin/rpricelist/'+id},
sortVal:function(r){return(r.flash_sort_order&&r.flash_sort_order>0&&r.flash_sort_order<9999)?r.flash_sort_order:9999}
};
}
function view(cfg){
return frag(`
<div class="fs-wrap">
<section class="fs-card">
<h2 class="fs-title">⚡ Pengaturan `+cfg.label+`</h2>
<form class="fs-form">
<div class="fs-field"><label>Nama Flash Sale</label><input class="fs-inp" data-f="name" type="text" autocomplete="off"></div>
<div class="fs-field"><label>Deskripsi</label><input class="fs-inp" data-f="desc" type="text" autocomplete="off"></div>
<div class="fs-row">
<div class="fs-field"><label>Waktu Mulai</label><input class="fs-inp" data-f="start" type="datetime-local"></div>
<div class="fs-field"><label>Waktu Selesai</label><input class="fs-inp" data-f="end" type="datetime-local"></div>
</div>
<button class="fs-save" type="submit">Simpan Flash Sale</button>
</form>
</section>
<section class="fs-card">
<div class="fs-head"><h2 class="fs-title">🛒 Item Flash Sale</h2><span class="fs-count">0 item</span></div>
<div class="fs-list"></div>
</section>
</div>
`);
}
function inp(root,k){return root.querySelector('[data-f="'+k+'"]')}
function loadSettings(root,cfg){
return Sec.json('/api/admin/settings').then(function(s){
s=s||{};
var n=inp(root,'name');if(n)n.value=s[cfg.f.name]||cfg.defName;
var d=inp(root,'desc');if(d)d.value=s[cfg.f.desc]||'';
var st=inp(root,'start');if(st)st.value=s[cfg.f.start]||'';
var en=inp(root,'end');if(en)en.value=s[cfg.f.end]||'';
}).catch(function(){});
}
function saveSettings(root,cfg){
var form=root.querySelector('.fs-form');
if(!form)return Promise.resolve();
var handler=function(e){
e.preventDefault();
var btn=form.querySelector('.fs-save');
var old=btn?btn.textContent:'';
if(btn){btn.disabled=true;btn.textContent='Menyimpan...'}
Sec.json('/api/admin/settings').then(function(cur){
cur=cur||{};
var payload={
is_closed:cur.is_manual_closed||false,
auto_schedule:cur.auto_schedule||false,
open_time:cur.open_time||'05:00',
close_time:cur.close_time||'23:00',
close_message:cur.message||'',
flash_sale_start:cur.flash_sale_start||'',
flash_sale_end:cur.flash_sale_end||'',
flash_sale_name:cur.flash_sale_name||'Flash Sale',
flash_sale_description:cur.flash_sale_description||'',
flash_reseller_start:cur.flash_reseller_start||'',
flash_reseller_end:cur.flash_reseller_end||'',
flash_reseller_name:cur.flash_reseller_name||'Flash Sale Reseller',
flash_reseller_description:cur.flash_reseller_description||''
};
payload[cfg.f.name]=(inp(root,'name')?inp(root,'name').value:'')||cfg.defName;
payload[cfg.f.desc]=inp(root,'desc')?inp(root,'desc').value:'';
payload[cfg.f.start]=inp(root,'start')?inp(root,'start').value:'';
payload[cfg.f.end]=inp(root,'end')?inp(root,'end').value:'';
return Sec.raw('/api/admin/settings',{method:'PUT',headers:{'Content-Type':'application/json'},body:JSON.stringify(payload)});
}).then(function(){
uiToast('Pengaturan Flash Sale disimpan.');
}).catch(function(e){
uiAlert(e.message||'Gagal menyimpan pengaturan Flash Sale.','Kesalahan');
}).finally(function(){
if(btn){btn.disabled=false;btn.textContent=old}
});
};
form.addEventListener('submit',handler);
return Promise.resolve();
}
function renderItems(root,cfg,rows){
var list=root.querySelector('.fs-list');
var count=root.querySelector('.fs-count');
if(!list)return;
destroySortable();
while(list.firstChild)list.removeChild(list.firstChild);
var items=(rows||[]).filter(function(r){return r.flash_price&&String(r.flash_price).trim()!==''});
items.sort(function(a,b){return(cfg.sortVal(a)-cfg.sortVal(b))||(a.id-b.id)});
if(count)count.textContent=items.length+' item';
if(!items.length){list.appendChild(ce('div','empty-state','Belum ada item Flash Sale'));return}
items.forEach(function(item){
var row=ce('div','fs-item');
row.setAttribute('data-id',item.id);
var drag=ce('div','fs-drag');
drag.appendChild(admSvg('M4 8h16M4 16h16','1rem','1rem'));
row.appendChild(drag);
var info=ce('div','fs-item-info');
info.appendChild(ce('p','fs-item-name',item.app_name+' • '+item.category+' • '+item.duration));
var priceP=ce('p','fs-item-price');
priceP.appendChild(ce('span',null,item.price+' → '));
priceP.appendChild(ce('span','flash',item.flash_price));
if(item.status&&String(item.status).toLowerCase()!=='ready')priceP.appendChild(ce('span','sold-ind','(Sold)'));
info.appendChild(priceP);
row.appendChild(info);
var act=ce('div','fs-item-actions');
var editBtn=ce('button','fs-edit-btn','Edit');editBtn.type='button';
editBtn.addEventListener('click',function(){openEdit(root,cfg,item)});
act.appendChild(editBtn);
var rmBtn=ce('button','fs-remove-btn','Hapus');rmBtn.type='button';
rmBtn.addEventListener('click',function(){removeItem(root,cfg,item)});
act.appendChild(rmBtn);
row.appendChild(act);
list.appendChild(row);
});
initSortable(root,cfg);
}
function initSortable(root,cfg){
destroySortable();
var list=root.querySelector('.fs-list');
if(!list||typeof Sortable==='undefined')return;
sortableInst=new Sortable(list,{
animation:150,
handle:'.fs-drag',
ghostClass:'sortable-ghost',
dragClass:'sortable-drag',
onEnd:function(){
var els=list.querySelectorAll('.fs-item');
var order=[];
els.forEach(function(el,index){order.push({id:parseInt(el.getAttribute('data-id'),10),flash_sort_order:index+1})});
Sec.raw(cfg.reorderEndpoint,{method:'PUT',headers:{'Content-Type':'application/json'},body:JSON.stringify({order:order})})
.then(function(){uiToast('Urutan Flash Sale disimpan.')})
.catch(function(){loadItems(root,cfg)});
}
});
}
function destroySortable(){
if(sortableInst){sortableInst.destroy();sortableInst=null}
}
function loadItems(root,cfg){
return Sec.json(cfg.itemsEndpoint).then(function(rows){renderItems(root,cfg,rows)}).catch(function(){
var list=root.querySelector('.fs-list');
if(list){while(list.firstChild)list.removeChild(list.firstChild);list.appendChild(ce('div','empty-state','Gagal memuat item Flash Sale.'))}
});
}
function openEdit(root,cfg,item){
CatalogShared.openPkgModal(item,null,function(payload,closeFn,restoreFn){
Sec.raw(cfg.updateEndpoint(item.id),{method:'PUT',headers:{'Content-Type':'application/json'},body:JSON.stringify(payload)})
.then(function(){closeFn();uiToast('Paket diperbarui.');loadItems(root,cfg)})
.catch(function(e){uiAlert(e.message||'Gagal menyimpan.','Kesalahan');restoreFn()});
},{showFlash:true});
}
function removeItem(root,cfg,item){
uiConfirm('Hapus item ini dari Flash Sale? Item tetap ada di daftar paket.','Hapus dari Flash Sale',function(){
var payload=Object.assign({},item,{flash_price:''});
Sec.raw(cfg.updateEndpoint(item.id),{method:'PUT',headers:{'Content-Type':'application/json'},body:JSON.stringify(payload)})
.then(function(){uiToast('Item dihapus dari Flash Sale.');loadItems(root,cfg)})
.catch(function(e){uiAlert(e.message||'Gagal menghapus item dari Flash Sale.','Kesalahan')});
},{danger:true,okText:'Hapus'});
}
function mount(host,cfg){
host.appendChild(view(cfg));
saveSettings(host,cfg);
return Promise.all([loadSettings(host,cfg),loadItems(host,cfg)]);
}
function destroy(){destroySortable()}
return{cfgPublic:cfgPublic,cfgReseller:cfgReseller,mount:mount,destroy:destroy};
})();
