(function(M){
var root=null,headRef=null;
function openImport(){
var s=ModalKit.shell({title:'Import CSV',sub:'Upload file CSV untuk menambah paket secara massal',scroll:true});
var fileInput=document.createElement('input');
fileInput.type='file';
fileInput.accept='.csv';
fileInput.className='file-input';
s.body.appendChild(fileInput);
var progress=ce('p','csv-progress hidden');
s.body.appendChild(progress);
var submit=ModalKit.btn('Import Data','submit-btn',function(){
if(!fileInput.files||!fileInput.files.length)return uiAlert('Pilih file CSV dulu.','File Belum Dipilih');
var file=fileInput.files[0];
progress.classList.remove('hidden');
submit.disabled=true;
submit.textContent='Menyimpan...';
var reader=new FileReader();
reader.onload=function(e){
var text=e.target.result;
var rows=text.split(/\r?\n/).slice(1);
var successCount=0;
var i=0;
function processNext(){
if(i>=rows.length){
progress.textContent='Selesai! '+successCount+' data berhasil diunggah.';
setTimeout(function(){s.close();M.loadGroups()},1500);
return;
}
var row=rows[i];
if(!row.trim()){i++;processNext();return}
var cols=row.split(',').map(function(c){return c.trim().replace(/^"|"$/g,'')});
if(cols.length<4){i++;processNext();return}
progress.textContent='Mengirim baris '+(i+1)+' dari '+rows.length+'...';
Sec.raw('/api/admin/pricelist',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({
app_name:cols[0],category:cols[1],duration:cols[2],price:cols[3],notes:cols[4]||'',status:cols[5]||'Ready',flash_price:cols[6]||''
})})
.then(function(){successCount++;i++;processNext()})
.catch(function(){
progress.textContent='Error di baris '+(i+1);
submit.disabled=false;
submit.textContent='Import Data';
});
}
processNext();
};
reader.readAsText(file);
});
s.foot.appendChild(ModalKit.btn('Batal','cancel-btn',s.close));
s.foot.appendChild(submit);
document.body.appendChild(s.overlay);
}
function exportCSV(){
Sec.json('/api/admin/pricelist').then(function(data){
if(!data||!data.length)return uiAlert('Tidak ada data untuk diekspor.','Data Kosong');
var csvContent='app_name,category,duration,price,status,notes,flash_price\n';
data.forEach(function(item){
var esc=function(str){return'"'+String(str).replace(/"/g,'""')+'"'};
csvContent+=[esc(item.app_name),esc(item.category),esc(item.duration),esc(item.price),esc(item.status),esc(item.notes||''),esc(item.flash_price||'')].join(',')+'\n';
});
var blob=new Blob([csvContent],{type:'text/csv;charset=utf-8'});
var url=URL.createObjectURL(blob);
var link=document.createElement('a');
link.href=url;
link.download='ciccu-pricelist.csv';
document.body.appendChild(link);
link.click();
document.body.removeChild(link);
URL.revokeObjectURL(url);
}).catch(function(){uiAlert('Gagal memuat data untuk export.','Kesalahan')});
}
function init(host){
root=host;
root.appendChild(M.view());
var btnExpand=document.getElementById('btnExpandAll');
if(btnExpand)btnExpand.addEventListener('click',function(){M.expandAll()});
var btnCollapse=document.getElementById('btnCollapseAll');
if(btnCollapse)btnCollapse.addEventListener('click',function(){M.collapseAll()});
var btnReorder=document.getElementById('btnReorderTop');
if(btnReorder)btnReorder.addEventListener('click',function(){M.openReorder()});
var btnImport=document.getElementById('btnImport');
if(btnImport)btnImport.addEventListener('click',openImport);
var btnExport=document.getElementById('btnExport');
if(btnExport)btnExport.addEventListener('click',exportCSV);
var btnAddApp=document.getElementById('btnAddApp');
if(btnAddApp)btnAddApp.addEventListener('click',function(){AppModals.openAdd()});
var search=document.getElementById('publicSearch');
if(search)search.addEventListener('input',debounce(function(){M.setFilter(search.value)},250));
headRef=root.querySelector('.public-head');
if(headRef)TopbarControls.attach(headRef);
AppModals.onChanged(function(){M.loadGroups()});
return M.groupsInit();
}
function destroy(){
if(headRef)TopbarControls.detach(headRef);
headRef=null;
root=null;
}
M.init=init;
M.destroy=destroy;
})(AdminModules.public=AdminModules.public||{});
