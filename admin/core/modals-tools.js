var ModalKit={
shell:function(cfg){
cfg=cfg||{};
var overlay=ce('div','modal-overlay');
var back=ce('div','modal-backdrop');
var box=ce('div','modal-box'+(cfg.wide?' wide':''));
var head=ce('div','modal-head');
var ht=ce('div');
ht.appendChild(ce('h3',null,cfg.title||''));
if(cfg.sub)ht.appendChild(ce('p','modal-sub',cfg.sub));
head.appendChild(ht);
var closeBtn=ce('button','modal-close-btn','×');closeBtn.type='button';
head.appendChild(closeBtn);
box.appendChild(head);
var body=ce('div',cfg.scroll?'modal-body-scroll':'modal-form');
box.appendChild(body);
var foot=ce('div','modal-actions');
box.appendChild(foot);
overlay.appendChild(back);overlay.appendChild(box);
function shut(){if(overlay.parentNode)overlay.parentNode.removeChild(overlay)}
closeBtn.addEventListener('click',shut);
back.addEventListener('click',shut);
return{overlay:overlay,box:box,body:body,foot:foot,close:shut};
},
btn:function(label,cls,fn){var b=ce('button',cls||'cancel-btn',label);b.type='button';if(fn)b.addEventListener('click',fn);return b}
};
var LogoPicker=(function(){
var handler=null;
function setHandler(fn){handler=fn}
function open(){
var s=ModalKit.shell({title:'Pilih Logo',sub:'Cari atau tempel URL gambar',scroll:true});
var state={url:''};
var tabs=ce('div','logo-picker-tabs');
var tabSearch=ModalKit.btn('Dari daftar','logo-tab active');
var tabUrl=ModalKit.btn('Tempel URL','logo-tab');
tabs.appendChild(tabSearch);tabs.appendChild(tabUrl);
s.body.appendChild(tabs);
var paneSearch=ce('div','logo-tab-pane active');
var inpSearch=ce('input','form-input');inpSearch.type='text';inpSearch.placeholder='Cari aplikasi (mis. netflix)...';
var grid=ce('div','logo-search-grid');
var hint=ce('p','logo-search-hint','Menampilkan saran bawaan.');
paneSearch.appendChild(inpSearch);paneSearch.appendChild(grid);paneSearch.appendChild(hint);
var paneUrl=ce('div','logo-tab-pane');
var inpUrl=ce('input','form-input');inpUrl.type='text';inpUrl.placeholder='https://contoh.com/logo.png';
var hintUrl=ce('p','logo-search-hint','Tempel URL gambar apa pun. Maksimal 300 KB.');
paneUrl.appendChild(inpUrl);paneUrl.appendChild(hintUrl);
s.body.appendChild(paneSearch);s.body.appendChild(paneUrl);
var cancel=ModalKit.btn('Batal','cancel-btn',s.close);
var confirm=ModalKit.btn('Konfirmasi','submit-btn',function(){if(!state.url)return;if(handler)handler(state.url);s.close()});
confirm.disabled=true;
s.foot.appendChild(cancel);s.foot.appendChild(confirm);
function setTab(t){tabSearch.classList.toggle('active',t==='search');tabUrl.classList.toggle('active',t==='url');paneSearch.classList.toggle('active',t==='search');paneUrl.classList.toggle('active',t==='url')}
tabSearch.addEventListener('click',function(){setTab('search')});
tabUrl.addEventListener('click',function(){setTab('url')});
function select(url){state.url=url;confirm.disabled=false;Array.prototype.forEach.call(grid.children,function(el){el.classList.toggle('selected',el.getAttribute('data-url')===url)})}
function render(q){
while(grid.firstChild)grid.removeChild(grid.firstChild);
Sec.json('/api/admin/logo-suggestions?search='+encodeURIComponent(q||'')).then(function(list){
list=list||[];
if(!list.length){hint.textContent=q?('Tidak ada hasil untuk "'+q+'"'):'Menampilkan saran bawaan.';return}
hint.textContent='Menampilkan '+list.length+' saran.';
list.forEach(function(item){
var div=ce('div','logo-search-item');
div.setAttribute('data-url',item.url);
var img=ce('img');img.src=item.url;img.alt=item.name;img.onerror=function(){this.style.display='none'};
div.appendChild(img);
div.appendChild(ce('span',null,item.name));
div.addEventListener('click',function(){select(item.url)});
grid.appendChild(div);
});
if(state.url)select(state.url);
}).catch(function(){hint.textContent='Gagal memuat saran.'});
}
var timer=null;
inpSearch.addEventListener('input',function(){var v=this.value;clearTimeout(timer);timer=setTimeout(function(){render(v)},200)});
inpUrl.addEventListener('input',function(){state.url=this.value.trim();confirm.disabled=!state.url;Array.prototype.forEach.call(grid.children,function(el){el.classList.remove('selected')})});
document.body.appendChild(s.overlay);
render('');
return s;
}
return{open:open,setHandler:setHandler};
})();
var FormBuilder=(function(){
function open(appName,initial,onDone){
var s=ModalKit.shell({title:'Form Pembeli',sub:appName,scroll:true});
var rows=(initial||[]).slice();
var wrap=ce('div','form-fields');
s.body.appendChild(wrap);
var addBtn=ModalKit.btn('＋ Tambah Kolom','add-field-btn',function(){rows.push('');render()});
s.body.appendChild(addBtn);
function render(){
while(wrap.firstChild)wrap.removeChild(wrap.firstChild);
if(!rows.length){wrap.appendChild(ce('div','empty-state','Belum ada kolom form 🌸'));return}
rows.forEach(function(f,i){
var row=ce('div','form-field-row');
row.appendChild(ce('span','form-field-num',String(i+1)));
var inp=ce('input','form-field-input');inp.type='text';inp.placeholder='Misal: Nama Profil';inp.value=f;
inp.addEventListener('input',function(){rows[i]=this.value});
row.appendChild(inp);
var del=ce('button','form-field-del');del.type='button';
del.appendChild(admSvg('M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16','1rem','1rem'));
del.addEventListener('click',function(){rows.splice(i,1);render()});
row.appendChild(del);
wrap.appendChild(row);
});
}
render();
var cancel=ModalKit.btn('Batal','cancel-btn',s.close);
var save=ModalKit.btn('Simpan Form','submit-btn',function(){
var valid=rows.map(function(x){return String(x||'').trim()}).filter(Boolean);
save.disabled=true;save.textContent='Menyimpan...';
var req=valid.length
?Sec.raw('/api/admin/forms',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({app_name:appName,form_fields:valid.join(', ')})}).then(function(r){return r.json()})
:Sec.raw('/api/admin/forms/'+encodeURIComponent(appName),{method:'DELETE'});
req.then(function(){s.close();Apps.invalidate('forms');if(onDone)onDone(valid)})
.catch(function(e){uiAlert(e.message||'Gagal menyimpan form.','Kesalahan')})
.finally(function(){save.disabled=false;save.textContent='Simpan Form'});
});
s.foot.appendChild(cancel);s.foot.appendChild(save);
document.body.appendChild(s.overlay);
return s;
}
return{open:open};
})();
