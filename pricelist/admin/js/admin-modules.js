var sessionPass='',globalAdminData=[],globalFormsData={},testimoniDataCache={};
var sortableFlashSale=null,currentReplyId=null;
var TURNSTILE_SITE_KEY='0x4AAAAAADpiSjv84N_2_kvG';
var adminTurnstileId=null;
var RES_SUB='rprice';
var ADM_TITLES={produk:'Produk & Paket',flashsale:'Flash Sale',reseller:'Manajemen Reseller',testimoni:'Testimoni',pengaturan:'Pengaturan Toko'};
function escapeHTML(str){if(!str)return'';return String(str).replace(/[&<>'"]/g,function(m){return{'&':'&amp;','<':'&lt;','>':'&gt;',"'":'&#39;','"':'&quot;'}[m]})}
function ce(t,c,x){var e=document.createElement(t);if(c)e.className=c;if(x!==undefined&&x!==null)e.textContent=x;return e}
function ensureTurnstile(cb){
if(window.turnstile)return cb();
var n=0;
var iv=setInterval(function(){
n++;
if(window.turnstile){clearInterval(iv);cb()}
else if(n>40){clearInterval(iv)}
},250);
}
function renderAdminTurnstile(){
if(!document.getElementById('turnstileWidget'))return;
if(adminTurnstileId!==null&&window.turnstile){try{turnstile.remove(adminTurnstileId)}catch(e){}}
adminTurnstileId=turnstile.render('#turnstileWidget',{sitekey:TURNSTILE_SITE_KEY});
}
function getAdminTurnstileToken(){
if(window.turnstile&&adminTurnstileId!==null){try{var t=turnstile.getResponse(adminTurnstileId);if(t)return t}catch(e){}}
var el=document.querySelector('[name="cf-turnstile-response"]');
return el?el.value:'';
}
function handleResponseStatus(res){
if(res.status===403){alert('Gagal memproses! Password admin Anda salah atau sesi berakhir.');logoutAdmin();throw new Error('Unauthorized')}
if(!res.ok)throw new Error('Server response error: '+res.status);
return res.json();
}
function checkSession(){
sessionPass=sessionStorage.getItem('ciccuAdminPass')||'';
var overlay=document.getElementById('loginOverlay');
var main=document.getElementById('mainContent');
if(sessionPass){
if(overlay)overlay.style.display='none';
if(main)main.style.display='flex';
if(typeof loadData==='function')loadData();
}else{
if(overlay)overlay.style.display='flex';
if(main)main.style.display='none';
ensureTurnstile(renderAdminTurnstile);
}
}
function loginAdmin(){
var input=document.getElementById('adminPasswordInput');
if(!input||!input.value)return alert('Isi passwordnya dulu ya!');
var token=getAdminTurnstileToken();
if(!token)return alert('Mohon tunggu dan selesaikan verifikasi keamanan Captcha terlebih dahulu ya!');
var btn=document.getElementById('btnLogin');
var oldText=btn?btn.textContent:'';
if(btn){btn.textContent='Memverifikasi...';btn.disabled=true}
fetch('/api/login',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({password:input.value,turnstileResponse:token})})
.then(function(res){
if(res.ok){sessionStorage.setItem('ciccuAdminPass',input.value);if(window.turnstile&&adminTurnstileId!==null)turnstile.reset(adminTurnstileId);checkSession()}
else return res.json().then(function(d){alert(d.error||'Gagal login.');if(window.turnstile&&adminTurnstileId!==null)turnstile.reset(adminTurnstileId);throw new Error('login failed')});
})
.catch(function(e){if(e.message!=='login failed')alert('Terjadi kesalahan jaringan.');if(window.turnstile&&adminTurnstileId!==null)turnstile.reset(adminTurnstileId)})
.finally(function(){if(btn){btn.textContent=oldText;btn.disabled=false}});
}
function logoutAdmin(){sessionStorage.removeItem('ciccuAdminPass');location.reload()}
function switchResellerSub(name){
RES_SUB=name;
var subs=['rprice','rorders','raccounts'];
for(var i=0;i<subs.length;i++){
var sec=document.getElementById('rsub-'+subs[i]);
var btn=document.getElementById('subtab-'+subs[i]);
if(sec){if(subs[i]===name)sec.classList.remove('hidden');else sec.classList.add('hidden')}
if(btn){if(subs[i]===name)btn.classList.add('active');else btn.classList.remove('active')}
}
if(name==='rprice'){if(typeof loadResellerPricelist==='function')loadResellerPricelist()}
else if(name==='rorders'){if(typeof loadOrders==='function')loadOrders()}
else if(name==='raccounts'){if(typeof loadResellers==='function')loadResellers()}
}
function switchTab(tabName){
var sections=['produk','flashsale','reseller','testimoni','pengaturan'];
for(var i=0;i<sections.length;i++){
var sec=document.getElementById('section-'+sections[i]);
var sb=document.getElementById('sbtab-'+sections[i]);
if(sec){if(sections[i]===tabName)sec.classList.remove('hidden');else sec.classList.add('hidden')}
if(sb){if(sections[i]===tabName)sb.classList.add('active');else sb.classList.remove('active')}
}
var title=document.getElementById('admTopbarTitle');
if(title)title.textContent=ADM_TITLES[tabName]||'Admin';
var nav=document.getElementById('navToggle');
if(nav)nav.checked=false;
var bulkBar=document.getElementById('bulkActionBar');
if(bulkBar)bulkBar.classList.remove('visible');
if(tabName==='flashsale'){loadFlashSaleSettings();renderFlashSaleItems()}
else if(tabName==='testimoni')loadAdminTestimoni();
else if(tabName==='pengaturan')loadStoreSettings();
else if(tabName==='reseller')switchResellerSub(RES_SUB);
else if(tabName==='produk'&&typeof updateBulkUI==='function')updateBulkUI();
}
function loadStoreSettings(){
if(!sessionPass)return;
fetch('/api/admin/settings',{headers:{'x-admin-password':sessionPass}})
.then(function(r){return r.json()})
.then(function(data){
var toggle=document.getElementById('storeClosedToggle');
if(toggle)toggle.checked=data.is_manual_closed||false;
var autoToggle=document.getElementById('autoScheduleToggle');
if(autoToggle){autoToggle.checked=data.auto_schedule||false;toggleAutoScheduleUI(data.auto_schedule||false)}
var openInput=document.getElementById('openTimeInput');
if(openInput)openInput.value=data.open_time||'05:00';
var closeInput=document.getElementById('closeTimeInput');
if(closeInput)closeInput.value=data.close_time||'23:00';
var msgInput=document.getElementById('closeMessageInput');
if(msgInput)msgInput.value=data.message||'Ciccu Store sedang tutup. Produk di website sementara belum dapat diorder. Kami akan kembali melayani mulai pukul 05.00 WIB. Terima kasih!';
}).catch(function(e){console.error('Gagal memuat pengaturan toko',e)});
}
function toggleAutoScheduleUI(isChecked){
var openInput=document.getElementById('openTimeInput');
var closeInput=document.getElementById('closeTimeInput');
if(openInput){openInput.disabled=!isChecked;openInput.style.opacity=isChecked?'1':'.5';openInput.style.background=isChecked?'':'var(--g100)'}
if(closeInput){closeInput.disabled=!isChecked;closeInput.style.opacity=isChecked?'1':'.5';closeInput.style.background=isChecked?'':'var(--g100)'}
}
function saveStoreSettings(e){
e.preventDefault();
var btn=document.getElementById('btnSaveSettings');
var oldText=btn?btn.textContent:'';
if(btn){btn.textContent='Menyimpan...';btn.disabled=true}
var payload={
is_closed:document.getElementById('storeClosedToggle').checked,
auto_schedule:document.getElementById('autoScheduleToggle').checked,
open_time:document.getElementById('openTimeInput').value,
close_time:document.getElementById('closeTimeInput').value,
close_message:document.getElementById('closeMessageInput').value
};
fetch('/api/admin/settings',{method:'PUT',headers:{'Content-Type':'application/json','x-admin-password':sessionPass},body:JSON.stringify(payload)})
.then(handleResponseStatus)
.then(function(){var ind=document.getElementById('savingIndicator');if(ind){ind.classList.remove('hidden');setTimeout(function(){ind.classList.add('hidden')},2000)}})
.catch(function(){alert('Gagal menyimpan pengaturan toko.')})
.finally(function(){if(btn){btn.textContent=oldText;btn.disabled=false}});
}
function loadFlashSaleSettings(){
if(!sessionPass)return;
fetch('/api/admin/settings',{headers:{'x-admin-password':sessionPass}})
.then(function(r){return r.json()})
.then(function(data){
var nameInput=document.getElementById('fsNameInput');
if(nameInput)nameInput.value=data.flash_sale_name||'Flash Sale';
var descInput=document.getElementById('fsDescInput');
if(descInput)descInput.value=data.flash_sale_description||'';
var startInput=document.getElementById('fsStartInput');
if(startInput)startInput.value=data.flash_sale_start||'';
var endInput=document.getElementById('fsEndInput');
if(endInput)endInput.value=data.flash_sale_end||'';
}).catch(function(e){console.error('Gagal memuat pengaturan flash sale',e)});
}
function saveFlashSaleSettings(e){
e.preventDefault();
var btn=document.getElementById('btnSaveFlashSale');
var oldText=btn?btn.textContent:'';
if(btn){btn.textContent='Menyimpan...';btn.disabled=true}
fetch('/api/admin/settings',{headers:{'x-admin-password':sessionPass}})
.then(function(r){return r.json()})
.then(function(current){
var payload={
is_closed:current.is_manual_closed||false,
auto_schedule:current.auto_schedule||false,
open_time:current.open_time||'05:00',
close_time:current.close_time||'23:00',
close_message:current.message||'',
flash_sale_start:document.getElementById('fsStartInput').value,
flash_sale_end:document.getElementById('fsEndInput').value,
flash_sale_name:document.getElementById('fsNameInput').value,
flash_sale_description:document.getElementById('fsDescInput').value
};
return fetch('/api/admin/settings',{method:'PUT',headers:{'Content-Type':'application/json','x-admin-password':sessionPass},body:JSON.stringify(payload)});
})
.then(handleResponseStatus)
.then(function(){var ind=document.getElementById('savingIndicator');if(ind){ind.classList.remove('hidden');setTimeout(function(){ind.classList.add('hidden')},2000)}})
.catch(function(){alert('Gagal menyimpan pengaturan Flash Sale.')})
.finally(function(){if(btn){btn.textContent=oldText;btn.disabled=false}});
}
function renderFlashSaleItems(){
var list=document.getElementById('flashSaleItemList');
var countEl=document.getElementById('fsItemCount');
if(!list)return;
var flashItems=globalAdminData.filter(function(item){return item.flash_price&&item.flash_price.trim()!==''});
flashItems.sort(function(a,b){
var aF=(a.flash_sort_order&&a.flash_sort_order>0&&a.flash_sort_order<9999)?a.flash_sort_order:9999;
var bF=(b.flash_sort_order&&b.flash_sort_order>0&&b.flash_sort_order<9999)?b.flash_sort_order:9999;
var aA=(a.app_sort_order&&a.app_sort_order>0)?a.app_sort_order:9999;
var bA=(b.app_sort_order&&b.app_sort_order>0)?b.app_sort_order:9999;
var aP=(a.sort_order&&a.sort_order>0)?a.sort_order:9999;
var bP=(b.sort_order&&b.sort_order>0)?b.sort_order:9999;
return(aF-bF)||(aA-bA)||(aP-bP)||(a.id-b.id);
});
if(countEl)countEl.textContent=flashItems.length+' item';
while(list.firstChild)list.removeChild(list.firstChild);
if(!flashItems.length){list.appendChild(ce('div','empty-state','Belum ada item Flash Sale'));return}
flashItems.forEach(function(item){
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
if(item.status&&item.status.toLowerCase()!=='ready')priceP.appendChild(ce('span','sold-ind','(Sold)'));
info.appendChild(priceP);
row.appendChild(info);
var actions=ce('div','fs-item-actions');
var editBtn=ce('button','fs-edit-btn','Edit');
editBtn.setAttribute('type','button');
editBtn.addEventListener('click',function(){editFlashSaleItem(item.id)});
actions.appendChild(editBtn);
var removeBtn=ce('button','fs-remove-btn','Hapus');
removeBtn.setAttribute('type','button');
removeBtn.addEventListener('click',function(){removeFromFlashSale(item.id)});
actions.appendChild(removeBtn);
row.appendChild(actions);
list.appendChild(row);
});
initFlashSaleSortable();
}
function initFlashSaleSortable(){
var list=document.getElementById('flashSaleItemList');
if(!list||typeof Sortable==='undefined')return;
if(sortableFlashSale)sortableFlashSale.destroy();
sortableFlashSale=new Sortable(list,{
animation:150,handle:'.fs-drag',ghostClass:'sortable-ghost',dragClass:'sortable-drag',
onEnd:function(){
var items=list.querySelectorAll('.fs-item');
var newOrder=[];
items.forEach(function(el,index){newOrder.push({id:parseInt(el.getAttribute('data-id'),10),flash_sort_order:index+1})});
newOrder.forEach(function(o){var d=globalAdminData.find(function(x){return x.id===o.id});if(d)d.flash_sort_order=o.flash_sort_order});
fetch('/api/admin/flashsale/reorder',{method:'PUT',headers:{'Content-Type':'application/json','x-admin-password':sessionPass},body:JSON.stringify({order:newOrder})})
.then(handleResponseStatus)
.then(function(){var ind=document.getElementById('savingIndicator');if(ind){ind.classList.remove('hidden');setTimeout(function(){ind.classList.add('hidden')},2000)}})
.catch(function(){if(typeof loadData==='function')loadData()});
}
});
}
function editFlashSaleItem(id){
switchTab('produk');
setTimeout(function(){if(typeof editPackage==='function')editPackage(id)},100);
}
function removeFromFlashSale(id){
if(!confirm('Hapus item ini dari Flash Sale? Item tetap ada di daftar produk.'))return;
var item=globalAdminData.find(function(d){return d.id===id});
if(!item)return;
fetch('/api/admin/pricelist/'+id,{method:'PUT',headers:{'Content-Type':'application/json','x-admin-password':sessionPass},body:JSON.stringify({app_name:item.app_name,category:item.category,duration:item.duration,price:item.price,status:item.status,notes:item.notes||'',flash_price:''})})
.then(handleResponseStatus)
.then(function(){item.flash_price='';renderFlashSaleItems()})
.catch(function(){alert('Gagal menghapus item dari Flash Sale.')});
}
function loadAdminTestimoni(){
if(!sessionPass)return;
var list=document.getElementById('adminTestimoniList');
if(!list)return;
while(list.firstChild)list.removeChild(list.firstChild);
var loading=ce('div','loading-state');
loading.appendChild(ce('div','loader'));
loading.appendChild(ce('p',null,'Memuat testimoni...'));
list.appendChild(loading);
fetch('/api/admin/testimoni',{headers:{'x-admin-password':sessionPass}})
.then(function(r){return r.json()})
.then(function(data){
while(list.firstChild)list.removeChild(list.firstChild);
if(!data.length){list.appendChild(ce('div','empty-state','Belum ada testimoni masuk.'));return}
testimoniDataCache={};
data.forEach(function(item){testimoniDataCache[item.id]=item});
data.forEach(function(item){
var hasReply=item.balasan_admin&&item.balasan_admin.trim()!=='';
var testiItem=ce('div','testi-item');
var header=ce('div','testi-header');
var nameDiv=ce('div');
var nameP=ce('p','testi-name',item.nama);
nameP.appendChild(ce('span','testi-date',new Date(item.created_at).toLocaleDateString('id-ID')));
nameDiv.appendChild(nameP);
nameDiv.appendChild(ce('p','testi-text',item.komentar));
header.appendChild(nameDiv);
var delBtn=ce('button','testi-del-btn');
delBtn.setAttribute('type','button');
delBtn.appendChild(admSvg('M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16','1rem','1rem'));
delBtn.addEventListener('click',function(){deleteAdminTestimoni(item.id)});
header.appendChild(delBtn);
testiItem.appendChild(header);
if(hasReply){
var replyDiv=ce('div','testi-reply');
replyDiv.appendChild(ce('p','testi-reply-label','↳ Balasan Admin:'));
replyDiv.appendChild(ce('p','testi-reply-text',item.balasan_admin));
var replyActions=ce('div','testi-reply-actions');
var editReplyBtn=ce('button','testi-edit-reply','Edit Balasan');
editReplyBtn.setAttribute('type','button');
editReplyBtn.addEventListener('click',function(){openAdminReplyModal(item.id,item.nama,item.komentar,item.balasan_admin||'')});
replyActions.appendChild(editReplyBtn);
replyDiv.appendChild(replyActions);
testiItem.appendChild(replyDiv);
}else{
var replyWrap=ce('div','testi-reply-wrap');
var replyBtn=ce('button','testi-reply-btn','Balas');
replyBtn.setAttribute('type','button');
replyBtn.addEventListener('click',function(){openAdminReplyModal(item.id,item.nama,item.komentar,'')});
replyWrap.appendChild(replyBtn);
testiItem.appendChild(replyWrap);
}
list.appendChild(testiItem);
});
}).catch(function(e){
while(list.firstChild)list.removeChild(list.firstChild);
list.appendChild(ce('div','empty-state','Gagal memuat testimoni.'));
});
}
function openAdminReplyModal(id,nama,komentar,balasan){
currentReplyId=id;
var nameEl=document.getElementById('replyTargetName');
if(nameEl)nameEl.textContent=nama;
var commentEl=document.getElementById('replyTargetComment');
if(commentEl)commentEl.textContent='"'+komentar+'"';
var textEl=document.getElementById('replyText');
if(textEl)textEl.value=balasan;
var modal=document.getElementById('replyTestimoniModal');
if(modal)modal.classList.remove('hidden');
}
function closeAdminReplyModal(){
var modal=document.getElementById('replyTestimoniModal');
if(modal)modal.classList.add('hidden');
}
function submitAdminReply(e){
e.preventDefault();
if(!currentReplyId)return;
var replyText=document.getElementById('replyText');
if(!replyText||!replyText.value)return;
var btn=e.target.querySelector('button[type="submit"]');
var oldText=btn?btn.textContent:'';
if(btn){btn.textContent='Menyimpan...';btn.disabled=true}
fetch('/api/admin/testimoni/'+currentReplyId,{method:'PUT',headers:{'Content-Type':'application/json','x-admin-password':sessionPass},body:JSON.stringify({balasan_admin:replyText.value})})
.then(handleResponseStatus)
.then(function(){closeAdminReplyModal();loadAdminTestimoni()})
.catch(function(){alert('Gagal menyimpan balasan.')})
.finally(function(){if(btn){btn.textContent=oldText;btn.disabled=false}});
}
function deleteAdminTestimoni(id){
if(!confirm('Yakin ingin menghapus testimoni ini secara permanen?'))return;
fetch('/api/admin/testimoni/'+id,{method:'DELETE',headers:{'x-admin-password':sessionPass}})
.then(handleResponseStatus)
.then(function(){loadAdminTestimoni()})
.catch(function(){alert('Gagal menghapus testimoni.')});
}
document.addEventListener('DOMContentLoaded',function(){
var btnLogin=document.getElementById('btnLogin');
if(btnLogin)btnLogin.addEventListener('click',loginAdmin);
var passInput=document.getElementById('adminPasswordInput');
if(passInput)passInput.addEventListener('keydown',function(e){if(e.key==='Enter')loginAdmin()});
var btnLogout=document.getElementById('btnLogout');
if(btnLogout)btnLogout.addEventListener('click',logoutAdmin);
['produk','flashsale','reseller','testimoni','pengaturan'].forEach(function(t){
var sbBtn=document.getElementById('sbtab-'+t);
if(sbBtn)sbBtn.addEventListener('click',function(){switchTab(t)});
});
['rprice','rorders','raccounts'].forEach(function(s){
var subBtn=document.getElementById('subtab-'+s);
if(subBtn)subBtn.addEventListener('click',function(){switchResellerSub(s)});
});
var settingsForm=document.getElementById('settingsForm');
if(settingsForm)settingsForm.addEventListener('submit',saveStoreSettings);
var fsForm=document.getElementById('flashSaleSettingsForm');
if(fsForm)fsForm.addEventListener('submit',saveFlashSaleSettings);
var autoToggle=document.getElementById('autoScheduleToggle');
if(autoToggle)autoToggle.addEventListener('change',function(){toggleAutoScheduleUI(this.checked)});
var editModalClose=document.getElementById('editModalClose');
if(editModalClose)editModalClose.addEventListener('click',function(){if(typeof closeEditModal==='function')closeEditModal()});
var editModalBackdrop=document.getElementById('editModalBackdrop');
if(editModalBackdrop)editModalBackdrop.addEventListener('click',function(){if(typeof closeEditModal==='function')closeEditModal()});
var editCancelBtn=document.getElementById('editCancelBtn');
if(editCancelBtn)editCancelBtn.addEventListener('click',function(){if(typeof closeEditModal==='function')closeEditModal()});
var addPkgClose=document.getElementById('addPkgClose');
if(addPkgClose)addPkgClose.addEventListener('click',function(){if(typeof closeAddPackageModal==='function')closeAddPackageModal()});
var addPkgBackdrop=document.getElementById('addPkgBackdrop');
if(addPkgBackdrop)addPkgBackdrop.addEventListener('click',function(){if(typeof closeAddPackageModal==='function')closeAddPackageModal()});
var addPkgCancelBtn=document.getElementById('addPkgCancelBtn');
if(addPkgCancelBtn)addPkgCancelBtn.addEventListener('click',function(){if(typeof closeAddPackageModal==='function')closeAddPackageModal()});
var formBuilderClose=document.getElementById('formBuilderClose');
if(formBuilderClose)formBuilderClose.addEventListener('click',function(){if(typeof closeFormModal==='function')closeFormModal()});
var formBuilderBackdrop=document.getElementById('formBuilderBackdrop');
if(formBuilderBackdrop)formBuilderBackdrop.addEventListener('click',function(){if(typeof closeFormModal==='function')closeFormModal()});
var formBuilderCancel=document.getElementById('formBuilderCancel');
if(formBuilderCancel)formBuilderCancel.addEventListener('click',function(){if(typeof closeFormModal==='function')closeFormModal()});
var credTplClose=document.getElementById('credTplClose');
if(credTplClose)credTplClose.addEventListener('click',function(){var m=document.getElementById('credTemplateModal');if(m)m.classList.add('hidden')});
var credTplBackdrop=document.getElementById('credTplBackdrop');
if(credTplBackdrop)credTplBackdrop.addEventListener('click',function(){var m=document.getElementById('credTemplateModal');if(m)m.classList.add('hidden')});
var credTplCancel=document.getElementById('credTplCancel');
if(credTplCancel)credTplCancel.addEventListener('click',function(){var m=document.getElementById('credTemplateModal');if(m)m.classList.add('hidden')});
var stockAddClose=document.getElementById('stockAddClose');
if(stockAddClose)stockAddClose.addEventListener('click',function(){var m=document.getElementById('stockAddModal');if(m)m.classList.add('hidden')});
var stockAddBackdrop=document.getElementById('stockAddBackdrop');
if(stockAddBackdrop)stockAddBackdrop.addEventListener('click',function(){var m=document.getElementById('stockAddModal');if(m)m.classList.add('hidden')});
var stockAddCancel=document.getElementById('stockAddCancel');
if(stockAddCancel)stockAddCancel.addEventListener('click',function(){var m=document.getElementById('stockAddModal');if(m)m.classList.add('hidden')});
var stockBulkClose=document.getElementById('stockBulkClose');
if(stockBulkClose)stockBulkClose.addEventListener('click',function(){var m=document.getElementById('stockBulkModal');if(m)m.classList.add('hidden')});
var stockBulkBackdrop=document.getElementById('stockBulkBackdrop');
if(stockBulkBackdrop)stockBulkBackdrop.addEventListener('click',function(){var m=document.getElementById('stockBulkModal');if(m)m.classList.add('hidden')});
var stockBulkCancel=document.getElementById('stockBulkCancel');
if(stockBulkCancel)stockBulkCancel.addEventListener('click',function(){var m=document.getElementById('stockBulkModal');if(m)m.classList.add('hidden')});
var reorderClose=document.getElementById('reorderClose');
if(reorderClose)reorderClose.addEventListener('click',function(){if(typeof closeReorderModal==='function')closeReorderModal()});
var reorderBackdrop=document.getElementById('reorderBackdrop');
if(reorderBackdrop)reorderBackdrop.addEventListener('click',function(){if(typeof closeReorderModal==='function')closeReorderModal()});
var importClose=document.getElementById('importClose');
if(importClose)importClose.addEventListener('click',function(){if(typeof closeImportModal==='function')closeImportModal()});
var importBackdrop=document.getElementById('importBackdrop');
if(importBackdrop)importBackdrop.addEventListener('click',function(){if(typeof closeImportModal==='function')closeImportModal()});
var importCancelBtn=document.getElementById('importCancelBtn');
if(importCancelBtn)importCancelBtn.addEventListener('click',function(){if(typeof closeImportModal==='function')closeImportModal()});
var replyTestiClose=document.getElementById('replyTestiClose');
if(replyTestiClose)replyTestiClose.addEventListener('click',closeAdminReplyModal);
var replyTestiBackdrop=document.getElementById('replyTestiBackdrop');
if(replyTestiBackdrop)replyTestiBackdrop.addEventListener('click',closeAdminReplyModal);
var replyCancelBtn=document.getElementById('replyCancelBtn');
if(replyCancelBtn)replyCancelBtn.addEventListener('click',closeAdminReplyModal);
var replyForm=document.getElementById('replyTestimoniForm');
if(replyForm)replyForm.addEventListener('submit',submitAdminReply);
var orderDetailClose=document.getElementById('orderDetailClose');
if(orderDetailClose)orderDetailClose.addEventListener('click',function(){if(typeof closeOrderDetail==='function')closeOrderDetail()});
var orderDetailBackdrop=document.getElementById('orderDetailBackdrop');
if(orderDetailBackdrop)orderDetailBackdrop.addEventListener('click',function(){if(typeof closeOrderDetail==='function')closeOrderDetail()});
checkSession();
ensureTurnstile(renderAdminTurnstile);
});
