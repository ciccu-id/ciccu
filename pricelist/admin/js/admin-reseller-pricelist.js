var RPRICE_DATA=[],RPRICE_EXPANDED={},RPRICE_STOCK_OPEN={},RPRICE_COUNT={};
function rpriceHeaders(){return{'Content-Type':'application/json','x-admin-password':sessionPass}}
function flashSaved(){var ind=document.getElementById('savingIndicator');if(ind){ind.classList.remove('hidden');setTimeout(function(){ind.classList.add('hidden')},1500)}}
function loadResellerPricelist(){
var wrap=document.getElementById('rpriceAccordion');
if(!wrap)return;
while(wrap.firstChild)wrap.removeChild(wrap.firstChild);
wrap.appendChild(ce('div','loading-state','Memuat pricelist reseller...'));
fetch('/api/admin/reseller-prices',{headers:{'x-admin-password':sessionPass}}).then(function(r){return r.json()}).then(function(rows){
RPRICE_DATA=rows||[];
renderResellerPricelist();
loadLowStock();
}).catch(function(){while(wrap.firstChild)wrap.removeChild(wrap.firstChild);wrap.appendChild(ce('div','empty-state','Gagal memuat pricelist.'))});
}
function renderResellerPricelist(){
var wrap=document.getElementById('rpriceAccordion');
if(!wrap)return;
while(wrap.firstChild)wrap.removeChild(wrap.firstChild);
var grouped={},appOrder={},appFirst={};
RPRICE_DATA.forEach(function(r){
if(r.reseller_price==='')return;
if(!grouped[r.app_name])grouped[r.app_name]=[];
grouped[r.app_name].push(r);
var o=(r.app_sort_order&&r.app_sort_order>0)?r.app_sort_order:9999;
if(!appOrder[r.app_name]||o<appOrder[r.app_name])appOrder[r.app_name]=o;
if(!appFirst[r.app_name]||r.id<appFirst[r.app_name])appFirst[r.app_name]=r.id;
});
var apps=Object.keys(grouped).sort(function(a,b){return(appOrder[a]-appOrder[b])||(appFirst[a]-appFirst[b])});
if(!apps.length){wrap.appendChild(ce('div','empty-state','Belum ada varian yang dijual ke reseller. Atur harga di kartu varian pada tab Produk, lalu set harga reseller di sini.'));return}
apps.forEach(function(app){
var rows=grouped[app].sort(function(a,b){var ap=(a.sort_order&&a.sort_order>0)?a.sort_order:9999,bp=(b.sort_order&&b.sort_order>0)?b.sort_order:9999;return(ap-bp)||(a.id-b.id)});
var isOpen=!!RPRICE_EXPANDED[app];
var group=ce('div','app-group');
var header=ce('div','app-header app-header-pink'+(isOpen?' open':''));
var hinfo=ce('div','app-header-info');
hinfo.appendChild(ce('h3','app-header-name',app));
hinfo.appendChild(ce('p','app-header-form',rows.length+' varian dijual ke reseller'));
header.appendChild(hinfo);
var hact=ce('div','app-header-actions');
var tplBtn=ce('button','tool-btn purple','🧩 Template');
tplBtn.setAttribute('type','button');
tplBtn.addEventListener('click',function(e){e.stopPropagation();if(typeof stockOpenTemplate==='function')stockOpenTemplate(app)});
hact.appendChild(tplBtn);
var arrow=ce('div','app-header-arrow');
arrow.appendChild(admSvg('M19 9l-7 7-7-7','1.125rem','1.125rem'));
hact.appendChild(arrow);
header.appendChild(hact);
header.addEventListener('click',function(){
RPRICE_EXPANDED[app]=!RPRICE_EXPANDED[app];
var body=group.querySelector('.app-body');
if(RPRICE_EXPANDED[app]){header.classList.add('open');body.classList.remove('closed');body.classList.add('open')}
else{header.classList.remove('open');body.classList.remove('open');body.classList.add('closed')}
});
group.appendChild(header);
var body=ce('div','app-body '+(isOpen?'open':'closed'));
var inner=ce('div','app-body-inner');
var content=ce('div','app-body-content rp-cards');
rows.forEach(function(r){content.appendChild(buildVariantCard(r))});
inner.appendChild(content);
body.appendChild(inner);
group.appendChild(body);
wrap.appendChild(group);
});
}
function buildVariantCard(r){
var card=ce('div','rp-card');
card.setAttribute('data-variant',r.id);
var top=ce('div','rp-top');
var left=ce('div','rp-id');
left.appendChild(ce('p','rp-name',r.category+' • '+r.duration));
left.appendChild(ce('p','rp-meta','Harga publik '+r.price));
top.appendChild(left);
var right=ce('div','rp-right');
var badge=ce('span','status-badge '+(r.stock_available>0?(r.stock_available<=4?'sold':'ready'):'sold'),'Stok '+r.stock_available);
badge.classList.add('rp-stockbadge');
right.appendChild(badge);
var sold=r.reseller_price!=='';
var tw=ce('label','toggle-wrap');
var cb=ce('input','toggle-cb');cb.setAttribute('type','checkbox');if(sold)cb.checked=true;
var track=ce('span','toggle-track');
var circle=ce('span','toggle-circle');
tw.appendChild(cb);tw.appendChild(track);tw.appendChild(circle);
right.appendChild(tw);
top.appendChild(right);
card.appendChild(top);
var ctrl=ce('div','rp-controls');
var inp=ce('input','form-input rp-input');
inp.setAttribute('type','text');
inp.placeholder='Harga reseller (mis. 40K)';
inp.value=r.reseller_price||'';
if(!sold){inp.disabled=true;inp.style.opacity='.5'}
cb.addEventListener('change',function(){
if(cb.checked){inp.disabled=false;inp.style.opacity='1'}
else{inp.disabled=true;inp.style.opacity='.5';inp.value=''}
});
var save=ce('button','tool-btn green rp-save','Simpan');
save.setAttribute('type','button');
save.addEventListener('click',function(){
var val=cb.checked?inp.value.trim():'';
save.disabled=true;save.textContent='...';
fetch('/api/admin/reseller-prices/'+r.id,{method:'PUT',headers:rpriceHeaders(),body:JSON.stringify({reseller_price:val})})
.then(handleResponseStatus)
.then(function(){r.reseller_price=val;flashSaved();loadLowStock()})
.catch(function(){alert('Gagal menyimpan harga reseller.')})
.finally(function(){save.disabled=false;save.textContent='Simpan'});
});
ctrl.appendChild(inp);ctrl.appendChild(save);
card.appendChild(ctrl);
var exp=ce('button','rp-expandbtn');
exp.setAttribute('type','button');
var expTxt=ce('span','rp-exptxt','Kelola Stok');
var cnt=ce('span','rp-stockcount','('+r.stock_available+')');
exp.appendChild(expTxt);exp.appendChild(cnt);
card.appendChild(exp);
var panel=ce('div','rp-panel hidden');
var phead=ce('div','rp-panel-head');
var addBtn=ce('button','tool-btn green','＋ Tambah');
addBtn.setAttribute('type','button');
addBtn.addEventListener('click',function(){if(typeof stockOpenAdd==='function')stockOpenAdd(r)});
var bulkBtn=ce('button','tool-btn sky','⬆ Import Bulk');
bulkBtn.setAttribute('type','button');
bulkBtn.addEventListener('click',function(){if(typeof stockOpenBulk==='function')stockOpenBulk(r)});
phead.appendChild(addBtn);phead.appendChild(bulkBtn);
panel.appendChild(phead);
var list=ce('div','rp-list');
panel.appendChild(list);
card.appendChild(panel);
exp.addEventListener('click',function(){
var open=panel.classList.toggle('hidden');
expTxt.textContent=open?'Kelola Stok':'Tutup Stok';
if(!open&&!RPRICE_STOCK_OPEN[r.id]){
RPRICE_STOCK_OPEN[r.id]=true;
if(typeof stockLoadListFor==='function')stockLoadListFor(r,list,card);
}
});
return card;
}
function loadLowStock(){
var strip=document.getElementById('lowStockStrip');
if(!strip)return;
while(strip.firstChild)strip.removeChild(strip.firstChild);
fetch('/api/admin/low-stock?threshold=5',{headers:{'x-admin-password':sessionPass}}).then(function(r){return r.json()}).then(function(rows){
if(!rows||!rows.length){strip.classList.add('hidden');return}
strip.classList.remove('hidden');
var title=ce('p','stock-strip-title','⚠️ Stok perlu perhatian');
strip.appendChild(title);
rows.forEach(function(rw){
var item=ce('div','stock-strip-item');
item.appendChild(ce('span','stock-strip-text',rw.app_name+' • '+rw.category+' • '+rw.duration+' — sisa '+rw.avail));
var btn=ce('button','stock-strip-btn','Buka');
btn.setAttribute('type','button');
btn.addEventListener('click',function(){jumpToVariant(rw.id)});
item.appendChild(btn);
strip.appendChild(item);
});
}).catch(function(){strip.classList.add('hidden')});
}
function jumpToVariant(vid){
var rprice=document.getElementById('rsub-rprice');
if(rprice&&rprice.classList.contains('hidden'))switchResellerSub('rprice');
var card=document.querySelector('.rp-card[data-variant="'+vid+'"]');
if(!card)return;
var group=card.closest('.app-group');
if(group){
var header=group.querySelector('.app-header');
if(header&&!header.classList.contains('open'))header.click();
}
var panel=card.querySelector('.rp-panel');
var exp=card.querySelector('.rp-expandbtn');
if(panel&&panel.classList.contains('hidden')&&exp)exp.click();
card.scrollIntoView({behavior:'smooth',block:'center'});
}
document.addEventListener('DOMContentLoaded',function(){
var btn=document.getElementById('btnRefreshRPrice');
if(btn)btn.addEventListener('click',loadResellerPricelist);
});
