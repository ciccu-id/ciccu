var RPRICE_DATA=[],RPRICE_EXPANDED={};
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
}).catch(function(){while(wrap.firstChild)wrap.removeChild(wrap.firstChild);wrap.appendChild(ce('div','empty-state','Gagal memuat pricelist.'))});
}
function renderResellerPricelist(){
var wrap=document.getElementById('rpriceAccordion');
if(!wrap)return;
while(wrap.firstChild)wrap.removeChild(wrap.firstChild);
var appOrder={},appFirst={},grouped={};
RPRICE_DATA.forEach(function(r){
if(!grouped[r.app_name])grouped[r.app_name]=[];
grouped[r.app_name].push(r);
var o=(r.app_sort_order&&r.app_sort_order>0)?r.app_sort_order:9999;
if(!appOrder[r.app_name]||o<appOrder[r.app_name])appOrder[r.app_name]=o;
if(!appFirst[r.app_name]||r.id<appFirst[r.app_name])appFirst[r.app_name]=r.id;
});
var apps=Object.keys(grouped).sort(function(a,b){return(appOrder[a]-appOrder[b])||(appFirst[a]-appFirst[b])});
if(!apps.length){wrap.appendChild(ce('div','empty-state','Belum ada produk. Tambahkan di tab Produk dulu.'));return}
apps.forEach(function(app){
var rows=grouped[app].sort(function(a,b){var ap=(a.sort_order&&a.sort_order>0)?a.sort_order:9999,bp=(b.sort_order&&b.sort_order>0)?b.sort_order:9999;return(ap-bp)||(a.id-b.id)});
var isOpen=!!RPRICE_EXPANDED[app];
var group=ce('div','app-group');
var header=ce('div','app-header app-header-pink'+(isOpen?' open':''));
var hinfo=ce('div','app-header-info');
hinfo.appendChild(ce('h3','app-header-name',app));
hinfo.appendChild(ce('p','app-header-form',rows.length+' varian tersedia untuk reseller'));
header.appendChild(hinfo);
var arrow=ce('div','app-header-arrow');
arrow.appendChild(admSvg('M19 9l-7 7-7-7','1.125rem','1.125rem'));
header.appendChild(arrow);
header.addEventListener('click',function(){
RPRICE_EXPANDED[app]=!RPRICE_EXPANDED[app];
var body=group.querySelector('.app-body');
if(RPRICE_EXPANDED[app]){header.classList.add('open');body.classList.remove('closed');body.classList.add('open')}
else{header.classList.remove('open');body.classList.remove('open');body.classList.add('closed')}
});
group.appendChild(header);
var body=ce('div','app-body '+(isOpen?'open':'closed'));
var inner=ce('div','app-body-inner');
var content=ce('div','app-body-content');
var lastCat=null;
rows.forEach(function(r){
if(r.category!==lastCat){content.appendChild(ce('div','pkg-section-label',r.category));lastCat=r.category}
var row=ce('div','pkg-row');
var main=ce('div','pkg-main');
var info=ce('div','pkg-info');
info.appendChild(ce('p','pkg-info-line',r.duration));
info.appendChild(ce('p','pkg-note','Harga publik: '+r.price));
main.appendChild(info);
row.appendChild(main);
var actions=ce('div','pkg-actions');
actions.style.gap='.5rem';
var badge=ce('span','status-badge '+(r.stock_available>0?'ready':'sold'),'Stok '+r.stock_available);
actions.appendChild(badge);
var sold=r.reseller_price!=='';
var tw=ce('div','toggle-wrap');
var cb=ce('input','toggle-cb');cb.setAttribute('type','checkbox');if(sold)cb.checked=true;
var track=ce('label','toggle-track');track.setAttribute('for','');
var circle=ce('div','toggle-circle');
tw.appendChild(cb);tw.appendChild(track);tw.appendChild(circle);
var inp=ce('input','form-input');
inp.setAttribute('type','text');
inp.placeholder='mis. 40K';
inp.value=r.reseller_price||'';
inp.style.width='6rem';
inp.style.flex='none';
if(!sold){inp.disabled=true;inp.style.opacity='.5'}
cb.addEventListener('change',function(){
if(cb.checked){inp.disabled=false;inp.style.opacity='1'}
else{inp.disabled=true;inp.style.opacity='.5';inp.value=''}
});
var save=ce('button','tool-btn green','Simpan');
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
actions.appendChild(tw);actions.appendChild(inp);actions.appendChild(save);
row.appendChild(actions);
content.appendChild(row);
});
inner.appendChild(content);
body.appendChild(inner);
group.appendChild(body);
wrap.appendChild(group);
});
}
document.addEventListener('DOMContentLoaded',function(){
var btn=document.getElementById('btnRefreshRPrice');
if(btn)btn.addEventListener('click',loadResellerPricelist);
});
