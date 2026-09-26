var AppModals=(function(){
var TYPES=[{value:'streaming',label:'Streaming'},{value:'music',label:'Music'},{value:'editing',label:'Editing'},{value:'study',label:'Study'},{value:'game',label:'Game'},{value:'lainnya',label:'Lainnya'}];
var changedCbs=[];
function onChanged(fn){changedCbs.push(fn)}
function notifyChanged(){Apps.invalidate('meta');changedCbs.forEach(function(f){try{f()}catch(e){}})}
function fieldWrap(labelText,content){
var f=ce('div','adm-field');
f.appendChild(ce('label',null,labelText));
var box=ce('div','adm-input');
if(content.nodeType)box.appendChild(content);
f.appendChild(box);
return{field:f,box:box};
}
function logoField(){
var wrap=ce('div','logo-picker-wrap');
var preview=ce('div','logo-picker-preview');
preview.appendChild(ce('span',null,'Belum dipilih'));
var acts=ce('div','logo-picker-actions');
var pickBtn=ce('button','logo-picker-btn','Pilih');pickBtn.type='button';
var clearBtn=ce('button','logo-picker-btn secondary','Hapus');clearBtn.type='button';clearBtn.style.display='none';
acts.appendChild(pickBtn);acts.appendChild(clearBtn);
wrap.appendChild(preview);wrap.appendChild(acts);
var hidden=ce('input');hidden.type='hidden';hidden.value='';
function renderPreview(url){
while(preview.firstChild)preview.removeChild(preview.firstChild);
if(url){
var img=document.createElement('img');
img.src=url;img.alt='preview';
img.onerror=function(){while(preview.firstChild)preview.removeChild(preview.firstChild);preview.appendChild(ce('span',null,'Gambar gagal dimuat'));preview.classList.remove('has-logo')};
preview.appendChild(img);
preview.classList.add('has-logo');
clearBtn.style.display='';
}else{
preview.appendChild(ce('span',null,'Belum dipilih'));
preview.classList.remove('has-logo');
clearBtn.style.display='none';
}
}
pickBtn.addEventListener('click',function(){LogoPicker.setHandler(function(url){hidden.value=url;renderPreview(url)});LogoPicker.open()});
clearBtn.addEventListener('click',function(){hidden.value='__clear__';renderPreview('')});
return{wrap:wrap,hidden:hidden,renderPreview:renderPreview};
}
function sheetShell(title){
var wrap=ce('div','sheet-wrap');
var back=ce('div','sheet-backdrop');
var aside=ce('aside','sheet');
var head=ce('div','sheet-head');
head.appendChild(ce('h3',null,title));
var closeBtn=ce('button','sheet-close','✕');closeBtn.type='button';
head.appendChild(closeBtn);
aside.appendChild(head);
var body=ce('div','sheet-body');
aside.appendChild(body);
wrap.appendChild(back);wrap.appendChild(aside);
function shut(){wrap.classList.remove('on');setTimeout(function(){if(wrap.parentNode)wrap.parentNode.removeChild(wrap)},300)}
closeBtn.addEventListener('click',shut);
back.addEventListener('click',shut);
document.body.appendChild(wrap);
requestAnimationFrame(function(){wrap.classList.add('on')});
return{wrap:wrap,body:body,close:shut};
}
function openAdd(){
var s=sheetShell('Tambah Aplikasi Baru');
var nameInput=document.createElement('input');
nameInput.type='text';nameInput.autocomplete='off';nameInput.placeholder='Nama aplikasi';
var fwName=fieldWrap('Nama Aplikasi',nameInput);
s.body.appendChild(fwName.field);
var lf=logoField();
var fwLogo=fieldWrap('Logo',lf.wrap);
fwLogo.box.appendChild(lf.hidden);
s.body.appendChild(fwLogo.field);
var ddSlot=document.createElement('div');
var fwType=fieldWrap('Jenis',ddSlot);
fwType.box.classList.add('adm-input-select');
s.body.appendChild(fwType.field);
var dd=DD.build({options:TYPES,value:'lainnya'});
ddSlot.appendChild(dd.el);
s.body.appendChild(ce('p','sheet-hint','Paket dan detail lainnya dapat ditambahkan setelah aplikasi dibuat, lewat menu titik tiga pada grup aplikasi.'));
var submit=ce('button','sheet-submit','Buat Aplikasi');submit.type='button';
submit.addEventListener('click',function(){
var name=String(nameInput.value||'').trim();
if(!name)return uiAlert('Nama aplikasi wajib diisi.','Data Belum Lengkap');
submit.disabled=true;submit.textContent='Menyimpan...';
Sec.raw('/api/admin/app-metadata',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({app_name:name,logo_url:lf.hidden.value,app_type:dd.get()})}).then(function(r){return r.json()}).then(function(d){
s.close();
notifyChanged();
if(d&&d.logo_error)uiAlert('Aplikasi tersimpan, tetapi logo gagal dipasang: '+d.logo_error,'Perhatian Logo');
}).catch(function(err){uiAlert(err.message||'Gagal menyimpan aplikasi.','Kesalahan')}).finally(function(){submit.disabled=false;submit.textContent='Buat Aplikasi'});
});
s.body.appendChild(submit);
}
function openEdit(appName){
var meta=Apps.get(appName)||{};
var original=appName;
var s=ModalKit.shell({title:'Edit Aplikasi',sub:appName,scroll:true});
var nameInput=document.createElement('input');
nameInput.type='text';nameInput.autocomplete='off';nameInput.value=appName;
var fwName=fieldWrap('Nama Aplikasi',nameInput);
s.body.appendChild(fwName.field);
var lf=logoField();
if(meta.logo_path)lf.renderPreview(Apps.logoUrl(meta.logo_path));
var fwLogo=fieldWrap('Logo',lf.wrap);
fwLogo.box.appendChild(lf.hidden);
s.body.appendChild(fwLogo.field);
var ddSlot=document.createElement('div');
var fwType=fieldWrap('Jenis',ddSlot);
fwType.box.classList.add('adm-input-select');
s.body.appendChild(fwType.field);
var dd=DD.build({options:TYPES,value:meta.app_type||'lainnya'});
ddSlot.appendChild(dd.el);
var cancel=ModalKit.btn('Batal','cancel-btn',s.close);
var save=ModalKit.btn('Simpan','submit-btn',function(){
var name=String(nameInput.value||'').trim();
if(!name)return uiAlert('Nama aplikasi wajib diisi.','Data Belum Lengkap');
var payload={app_name:name,app_type:dd.get()};
if(lf.hidden.value)payload.logo_url=lf.hidden.value;
save.disabled=true;save.textContent='Menyimpan...';
Sec.raw('/api/admin/app-metadata/'+encodeURIComponent(original),{method:'PUT',headers:{'Content-Type':'application/json'},body:JSON.stringify(payload)}).then(function(r){return r.json()}).then(function(){
s.close();
notifyChanged();
}).catch(function(err){uiAlert(err.message||'Gagal menyimpan aplikasi.','Kesalahan')}).finally(function(){save.disabled=false;save.textContent='Simpan'});
});
s.foot.appendChild(cancel);s.foot.appendChild(save);
document.body.appendChild(s.overlay);
}
return{openAdd:openAdd,openEdit:openEdit,onChanged:onChanged};
})();
