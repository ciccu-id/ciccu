(function(M){
var root=null;
function val(id){var el=document.getElementById(id);return el?el.value:''}
function checked(id){var el=document.getElementById(id);return !!(el&&el.checked)}
function fill(s){
s=s||{};
var m=document.getElementById('setToggleManual');if(m)m.checked=!!s.is_manual_closed;
var a=document.getElementById('setToggleAuto');if(a)a.checked=!!s.auto_schedule;
var ot=document.getElementById('setOpenTime');if(ot)ot.value=s.open_time||'05:00';
var ct=document.getElementById('setCloseTime');if(ct)ct.value=s.close_time||'23:00';
var cm=document.getElementById('setCloseMsg');if(cm)cm.value=s.message||'';
}
function load(){
return Sec.json('/api/admin/settings').then(fill).catch(function(){});
}
function onSubmit(e){
e.preventDefault();
var btn=document.getElementById('btnSaveSettings');
var old=btn?btn.textContent:'';
if(btn){btn.disabled=true;btn.textContent='Menyimpan...'}
Sec.json('/api/admin/settings').then(function(cur){
cur=cur||{};
var payload={
is_closed:checked('setToggleManual'),
auto_schedule:checked('setToggleAuto'),
open_time:val('setOpenTime')||'05:00',
close_time:val('setCloseTime')||'23:00',
close_message:val('setCloseMsg'),
flash_sale_start:cur.flash_sale_start||'',
flash_sale_end:cur.flash_sale_end||'',
flash_sale_name:cur.flash_sale_name||'Flash Sale',
flash_sale_description:cur.flash_sale_description||'',
flash_reseller_start:cur.flash_reseller_start||'',
flash_reseller_end:cur.flash_reseller_end||'',
flash_reseller_name:cur.flash_reseller_name||'Flash Sale Reseller',
flash_reseller_description:cur.flash_reseller_description||''
};
return Sec.raw('/api/admin/settings',{method:'PUT',headers:{'Content-Type':'application/json'},body:JSON.stringify(payload)});
}).then(function(){
uiToast('Pengaturan toko disimpan.');
}).catch(function(err){
uiAlert(err.message||'Gagal menyimpan pengaturan.','Kesalahan');
}).finally(function(){
if(btn){btn.disabled=false;btn.textContent=old}
});
}
function init(host){
root=host;
root.appendChild(M.view());
var form=root.querySelector('.set-form');
if(form)form.addEventListener('submit',onSubmit);
return load();
}
function destroy(){root=null}
M.init=init;
M.destroy=destroy;
})(AdminModules.pengaturan=AdminModules.pengaturan||{});
