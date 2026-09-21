var allApps={},orderedAppNames=[],currentCategory='all',isStoreClosed=false,storeClosedMessage='Ciccu Store sedang tutup. Produk di website sementara belum dapat diorder. Kami akan kembali melayani mulai pukul 05.00 WIB. Terima kasih!';
var searchTimeout=null,orderModalEl=null,orderModalListEl=null,orderModalTitleEl=null,orderModalLogoEl=null,storeClosedEl=null,currentOrderApp='';
var BASE_URL='';
var appCategoryMap={'netflix':'streaming','disney':'streaming','youtube':'streaming','viu':'streaming','iqiyi':'streaming','prime':'streaming','amazon':'streaming','hbo':'streaming','wetv':'streaming','we tv':'streaming','vidio':'streaming','crunchyroll':'streaming','loklok':'streaming','loktv':'streaming','gagaoolala':'streaming','dramabox':'streaming','apple tv':'streaming','bstation':'streaming','viki plus':'streaming','drakor id':'streaming','mango tv':'streaming','mangotv':'streaming','spotify':'music','apple music':'music','apple':'music','capcut':'editing','canva':'editing','alight motion':'editing','alight':'editing','turnitin':'study','cek turnitin':'study','cek ai':'study','chatgpt':'study','claude':'study','grok':'study','grokai':'study','ms365':'study','microsoft':'study','duolingo':'study','picsart':'editing','remini':'editing','wattpad':'study','pollar':'editing','ibis paint':'editing','quillbot':'study','meitu':'editing','camscanner':'study','grammarly':'study','viki rakuten':'streaming','wink':'editing','aio drama':'streaming','aiodrama':'streaming','aio':'streaming','ilovepdf':'study','wps office':'study','robux':'game','youku':'streaming','sushiroll':'streaming'};
var logoMap={'netflix':'netflix.com','disney':'disneyplus.com','youtube':'youtube.com','viu':'viu.com','iqiyi':'iq.com','amazon':'primevideo.com','prime':'primevideo.com','hbo':'hbogoasia.id','wetv':'wetv.vip','we tv':'wetv.vip','vidio':'vidio.com','crunchyroll':'crunchyroll.com','loklok':'loklok.com','loktv':'loklok.com','gagaoolala':'gagaoolala.com','dramabox':'dramaboxapp.com','apple tv':'tv.apple.com','bstation':'https://img.icons8.com/color/144/bilibili.png','viki plus':'viki.com','drakor id':'drakorid.co','mango tv':'mgtv.com','mangotv':'mgtv.com','spotify':'open.spotify.com','apple music':'music.apple.com','apple':'music.apple.com','canva':'canva.com','capcut':'capcut.com','alight motion':'alightcreative.com','alight':'alightcreative.com','chatgpt':'openai.com','claude':'anthropic.com','grok':'x.ai','grokai':'x.ai','ms365':'office.com','microsoft':'microsoft.com','turnitin':'turnitin.com','cek turnitin':'turnitin.com','cek ai':'zerogpt.com','duolingo':'https://img.icons8.com/color/144/duolingo-logo.png','picsart':'picsart.com','remini':'remini.ai','wattpad':'wattpad.com','pollar':'polarr.com','ibis paint':'ibispaint.com','quillbot':'quillbot.com','meitu':'meitu.com','camscanner':'camscanner.com','grammarly':'grammarly.com','viki rakuten':'viki.com','wink':'wink.meitu.com','aio drama':'https://img.icons8.com/color/144/clapperboard.png','aiodrama':'https://img.icons8.com/color/144/clapperboard.png','aio':'https://img.icons8.com/color/144/clapperboard.png','ilovepdf':'ilovepdf.com','wps office':'wps.com','robux':'roblox.com','youku':'youku.tv','sushiroll':'sushiroll.co.id'};
function getAppCategory(name){var n=name.toLowerCase();for(var k in appCategoryMap){if(n.includes(k))return appCategoryMap[k]}return'lainnya'}
function getLogoUrl(name){var n=name.toLowerCase();for(var k in logoMap){if(n.includes(k)){var d=logoMap[k];if(d.startsWith('http'))return d;return'https://www.google.com/s2/favicons?sz=64&domain='+d}}return''}
function loadPricelist(){
return fetch(BASE_URL+'/api/settings').then(function(r){return r.json()}).then(function(s){
if(s.is_closed){isStoreClosed=true;if(s.message)storeClosedMessage=s.message}
FlashSale.init({start:s.flash_sale_start,end:s.flash_sale_end,name:s.flash_sale_name,description:s.flash_sale_description},onFlashSaleExpire);
return fetch(BASE_URL+'/api/pricelist');
}).then(function(r){return r.json()}).then(function(data){
data.sort(function(a,b){
var aA=(a.app_sort_order&&a.app_sort_order>0)?a.app_sort_order:9999,bA=(b.app_sort_order&&b.app_sort_order>0)?b.app_sort_order:9999;
var aP=(a.sort_order&&a.sort_order>0)?a.sort_order:9999,bP=(b.sort_order&&b.sort_order>0)?b.sort_order:9999;
return(aA-bA)||(aP-bP)||(a.id-b.id);
});
var apps={},appMinOrder={},appFirstId={};
data.forEach(function(item){
var name=item.app_name,order=(item.app_sort_order&&item.app_sort_order>0)?item.app_sort_order:9999;
if(!apps[name]){apps[name]={packages:[]};appMinOrder[name]=order;appFirstId[name]=item.id}
else{if(order<appMinOrder[name])appMinOrder[name]=order;if(item.id<appFirstId[name])appFirstId[name]=item.id}
apps[name].packages.push({category:item.category,duration:item.duration,price:item.price,notes:item.notes||'',status:item.status||'Ready',id:item.id,flash_price:item.flash_price||'',flash_sort_order:item.flash_sort_order||9999});
});
allApps=apps;orderedAppNames=Object.keys(apps);
orderedAppNames.sort(function(a,b){return(appMinOrder[a]-appMinOrder[b])||(appFirstId[a]-appFirstId[b])});
FlashSale.setItems(allApps);
return fetch(BASE_URL+'/api/forms');
}).then(function(r){return r.json()}).then(function(forms){
appForms={};
if(Array.isArray(forms))forms.forEach(function(f){appForms[f.app_name.toLowerCase().trim()]=f.form_fields});
}).catch(function(e){console.error('Gagal memuat data:',e)});
}
function onFlashSaleExpire(){
for(var i=0;i<cart.length;i++){
var info=allApps[cart[i].app];
if(info){for(var j=0;j<info.packages.length;j++){
var p=info.packages[j];
if(p.category===cart[i].cat&&p.duration===cart[i].dur){cart[i].price=p.price;cart[i].isFlash=false;cart[i].originalPrice=p.price;break}
}}}
updateCartUI();
if(typeof renderCurrentGrid==='function')renderCurrentGrid();
if(orderModalEl&&!orderModalEl.classList.contains('hidden')&&currentOrderApp)openOrderModal(currentOrderApp);
}
function renderPricelistView(container){
while(container.firstChild)container.removeChild(container.firstChild);
var toolbar=ce('div','toolbar');
var headerBar=ce('div','header-bar');
var backBtn=ce('button','btn-back');
backBtn.setAttribute('type','button');
backBtn.appendChild(svgI('M15 19l-7-7 7-7','0.875rem','0.875rem'));
backBtn.appendChild(ce('span',null,'Kembali'));
backBtn.addEventListener('click',function(){if(typeof showWelcome==='function')showWelcome()});
headerBar.appendChild(backBtn);
var searchWrap=ce('div','search-wrap');
var searchInput=ce('input','search-input');
searchInput.setAttribute('type','text');
searchInput.setAttribute('placeholder','Cari aplikasi favoritmu 🎀');
searchInput.id='searchInput';
searchInput.addEventListener('input',function(){
clearTimeout(searchTimeout);
searchTimeout=setTimeout(function(){applyFilters()},300);
});
searchWrap.appendChild(searchInput);
var searchIcon=ce('div','search-icon');
searchIcon.appendChild(svgI('M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z','1.125rem','1.125rem'));
searchWrap.appendChild(searchIcon);
headerBar.appendChild(searchWrap);
toolbar.appendChild(headerBar);
var catBar=ce('div','cat-bar');
var cats=['all','streaming','music','editing','study','game'];
var catLabels={all:'SEMUA',streaming:'STREAMING',music:'MUSIC',editing:'EDITING',study:'STUDY NEEDS',game:'GAME'};
cats.forEach(function(c){
var btn=ce('button','cat-btn'+(c===currentCategory?' active':''),catLabels[c]);
btn.setAttribute('type','button');
btn.setAttribute('data-cat',c);
btn.addEventListener('click',function(){switchCategory(c)});
catBar.appendChild(btn);
});
toolbar.appendChild(catBar);
container.appendChild(toolbar);
var fsEl=FlashSale.render();
if(fsEl)container.appendChild(fsEl);
var statusMsg=ce('div','loading');
statusMsg.id='statusMessage';
statusMsg.appendChild(ce('div','loader'));
statusMsg.appendChild(ce('p',null,'Menyiapkan etalase toko... ☁️🌸'));
container.appendChild(statusMsg);
var grid=ce('div','product-grid');
grid.id='pricingGrid';
var noRes=ce('div','no-results');
noRes.id='noResults';
noRes.classList.add('hidden');
var noResBox=ce('div','no-results-box');
noResBox.appendChild(ce('p',null,'Aplikasi tidak ditemukan di kategori ini 🥺'));
noRes.appendChild(noResBox);
grid.appendChild(noRes);
container.appendChild(grid);
container.appendChild(ce('div','footer','© 2026 Ciccu Store. All Rights Reserved.'));
applyFilters();
var sm=document.getElementById('statusMessage');
if(sm)sm.classList.add('hidden');
}
function switchCategory(cat){
currentCategory=cat;
var btns=document.querySelectorAll('.cat-btn');
btns.forEach(function(b){
if(b.getAttribute('data-cat')===cat)b.classList.add('active');
else b.classList.remove('active');
});
applyFilters();
}
function applyFilters(){
var searchEl=document.getElementById('searchInput');
var term=searchEl?searchEl.value.toLowerCase().trim():'';
var filtered={},filteredOrder=[],hasVisible=false;
orderedAppNames.forEach(function(name){
var info=allApps[name];
var matchSearch=name.toLowerCase().includes(term);
var matchCat=(currentCategory==='all'||getAppCategory(name)===currentCategory);
if(matchSearch&&matchCat&&info.packages.length>0){filtered[name]=info;filteredOrder.push(name);hasVisible=true}
});
renderCards(filtered,filteredOrder);
var noRes=document.getElementById('noResults');
if(noRes){if(hasVisible)noRes.classList.add('hidden');else noRes.classList.remove('hidden')}
}
function renderCurrentGrid(){applyFilters()}
function renderCards(apps,orderedNames){
var grid=document.getElementById('pricingGrid');
if(!grid)return;
var noRes=document.getElementById('noResults');
while(grid.firstChild)grid.removeChild(grid.firstChild);
if(noRes)grid.appendChild(noRes);
orderedNames.forEach(function(name){
var info=apps[name],totalPkgs=info.packages.length;
var minPrice=Infinity,displayPrice='-',hasFlash=false,origPrice='';
info.packages.forEach(function(item){
var eff=FlashSale.getEffectivePrice(item);
var pVal=extractNumK(eff.price);
if(pVal>0&&pVal<minPrice){minPrice=pVal;displayPrice=eff.price;hasFlash=eff.isFlash;origPrice=eff.isFlash?eff.originalPrice:''}
});
var card=ce('div','product-card fade-in-down');
card.addEventListener('click',function(){openOrderModal(name)});
if(name.toLowerCase().includes('netflix')){
var infoBtn=ce('button','info-btn');
infoBtn.setAttribute('type','button');
infoBtn.appendChild(ce('span',null,'i'));
infoBtn.addEventListener('click',function(e){e.stopPropagation();if(typeof openInfoNetflixModal==='function')openInfoNetflixModal()});
card.appendChild(infoBtn);
}
var top=ce('div','product-card-top');
var logoUrl=getLogoUrl(name);
if(logoUrl){var img=ce('img','product-logo');img.setAttribute('src',logoUrl);img.setAttribute('alt',name);img.setAttribute('loading','lazy');top.appendChild(img)}
else{var ph=ce('div','product-logo-placeholder');ph.appendChild(svgI('M12 18h.01M8 21h8a2 2 0 002-2V5a2 2 0 00-2-2H8a2 2 0 00-2 2v14a2 2 0 002 2z','1.25rem','1.25rem'));top.appendChild(ph)}
var badges=ce('div','product-badges');
if(hasFlash)badges.appendChild(ce('span','badge badge-flash','⚡'));
badges.appendChild(ce('span','badge badge-cat',getAppCategory(name)));
top.appendChild(badges);
card.appendChild(top);
var mid=ce('div');
mid.appendChild(ce('h2','product-name',name));
var prices=ce('div','product-prices');
prices.appendChild(ce('span','product-price-label','Mulai'));
if(hasFlash){prices.appendChild(ce('span','product-price-old',origPrice));prices.appendChild(ce('span','product-price flash',displayPrice))}
else prices.appendChild(ce('span','product-price',displayPrice));
mid.appendChild(prices);
card.appendChild(mid);
var foot=ce('div','product-footer');
var count=ce('p','product-count');
count.appendChild(svgI('M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z','0.75rem','0.75rem'));
count.appendChild(ce('span',null,totalPkgs+' Paket'));
foot.appendChild(count);
var arrow=ce('div','product-arrow');
arrow.appendChild(svgI('M12 4v16m8-8H4','0.75rem','0.75rem'));
foot.appendChild(arrow);
card.appendChild(foot);
grid.insertBefore(card,noRes);
});
}
function createOrderModal(){
orderModalEl=ce('div','modal-overlay');
orderModalEl.classList.add('hidden');
var backdrop=ce('div','modal-backdrop');
backdrop.addEventListener('click',closeOrderModal);
orderModalEl.appendChild(backdrop);
var box=ce('div','modal-box');
var head=ce('div','modal-head');
var headRow=ce('div','modal-head-row');
orderModalLogoEl=ce('div','modal-logo');
headRow.appendChild(orderModalLogoEl);
orderModalTitleEl=ce('h3',null,'Aplikasi');
headRow.appendChild(orderModalTitleEl);
head.appendChild(headRow);
var closeBtn=ce('button','modal-close');
closeBtn.setAttribute('type','button');
closeBtn.appendChild(svgI('M6 18L18 6M6 6l12 12','1.25rem','1.25rem'));
closeBtn.addEventListener('click',closeOrderModal);
head.appendChild(closeBtn);
box.appendChild(head);
orderModalListEl=ce('div','modal-body');
box.appendChild(orderModalListEl);
orderModalEl.appendChild(box);
document.body.appendChild(orderModalEl);
}
function openOrderModal(appName){
if(isStoreClosed){showStoreClosedModal();return}
currentOrderApp=appName;
if(!orderModalEl)createOrderModal();
if(orderModalTitleEl)orderModalTitleEl.textContent=appName;
if(orderModalLogoEl){
while(orderModalLogoEl.firstChild)orderModalLogoEl.removeChild(orderModalLogoEl.firstChild);
var logoUrl=getLogoUrl(appName);
if(logoUrl){var img=ce('img');img.setAttribute('src',logoUrl);img.style.width='100%';img.style.height='100%';img.style.objectFit='cover';orderModalLogoEl.appendChild(img)}
else orderModalLogoEl.appendChild(ce('span',null,appName.charAt(0)));
}
var info=allApps[appName];
if(!info||!orderModalListEl)return;
while(orderModalListEl.firstChild)orderModalListEl.removeChild(orderModalListEl.firstChild);
var list=ce('div','pkg-list');
info.packages.forEach(function(item,index){
var cat=item.category,pkgId='pkg-'+cat.replace(/[^a-zA-Z0-9]/g,'')+'-'+index;
var isSold=item.status&&item.status.toLowerCase()!=='ready';
var eff=FlashSale.getEffectivePrice(item);
var cartQty=0;
for(var i=0;i<cart.length;i++){if(cart[i].app===appName&&cart[i].cat===cat&&cart[i].dur===item.duration){cartQty=cart[i].qty;break}}
var row=ce('div','pkg-item'+(isSold?' sold':'')+(cartQty>0?' in-cart':''));
row.id='row-'+pkgId;
var left=ce('div','pkg-item-left');
var catRow=ce('div','pkg-item-cat');
catRow.appendChild(ce('span',null,cat));
if(isSold)catRow.appendChild(ce('span','pkg-badge-sold','Habis'));
if(eff.isFlash&&!isSold)catRow.appendChild(ce('span','pkg-badge-flash','⚡'));
left.appendChild(catRow);
left.appendChild(ce('h4','pkg-item-name',item.duration));
if(item.notes&&item.notes.toLowerCase()!=='nan'){
var note=ce('p','pkg-item-note');
note.appendChild(ce('span',null,'↳'));
note.appendChild(ce('span',null,item.notes));
left.appendChild(note);
}
var right=ce('div','pkg-item-right');
var priceDiv=ce('div','pkg-item-price');
if(eff.isFlash&&!isSold){
priceDiv.appendChild(ce('span','pkg-price-old',eff.originalPrice));
priceDiv.appendChild(ce('span','pkg-price-val',eff.price));
}else{
priceDiv.appendChild(ce('span','pkg-price-val',eff.price));
}
right.appendChild(priceDiv);
var btnWrap=ce('div');
btnWrap.id='btn-container-'+pkgId;
if(isSold){
btnWrap.appendChild(ce('span','pkg-sold-label','Kosong'));
}else{
var addBtn=ce('button',cartQty>0?'btn btn-primary btn-sm':'btn btn-sm');
addBtn.setAttribute('type','button');
addBtn.style.background=cartQty>0?'var(--choco-600)':'var(--w)';
addBtn.style.color=cartQty>0?'var(--butter-100)':'var(--choco-600)';
addBtn.style.border='1px solid '+(cartQty>0?'var(--choco-600)':'var(--blue-200)');
addBtn.style.borderRadius='9999px';
addBtn.style.padding='.375rem .75rem';
addBtn.style.fontSize='.625rem';
addBtn.style.fontWeight='700';
addBtn.textContent=cartQty>0?cartQty+' pcs ✓':'Tambah';
(function(a,c,d,p,pid){
addBtn.addEventListener('click',function(){
addToCart(a,c,d,p);
var qty=0;
for(var i=0;i<cart.length;i++){if(cart[i].app===a&&cart[i].cat===c&&cart[i].dur===d){qty=cart[i].qty;break}}
this.textContent=qty>0?qty+' pcs ✓':'Tambah';
this.style.background=qty>0?'var(--choco-600)':'var(--w)';
this.style.color=qty>0?'var(--butter-100)':'var(--choco-600)';
this.style.border='1px solid '+(qty>0?'var(--choco-600)':'var(--blue-200)');
var rowEl=document.getElementById('row-'+pid);
if(rowEl){if(qty>0)rowEl.classList.add('in-cart');else rowEl.classList.remove('in-cart')}
});
})(appName,cat,item.duration,eff.price,pkgId);
btnWrap.appendChild(addBtn);
}
right.appendChild(btnWrap);
row.appendChild(left);row.appendChild(right);
list.appendChild(row);
});
orderModalListEl.appendChild(list);
orderModalEl.classList.remove('hidden');
var bd=orderModalEl.querySelector('.modal-backdrop');
var bx=orderModalEl.querySelector('.modal-box');
setTimeout(function(){if(bd)bd.classList.add('show');if(bx)bx.classList.add('show')},10);
}
function closeOrderModal(){
if(!orderModalEl)return;
var bd=orderModalEl.querySelector('.modal-backdrop');
var bx=orderModalEl.querySelector('.modal-box');
if(bd)bd.classList.remove('show');
if(bx)bx.classList.remove('show');
setTimeout(function(){orderModalEl.classList.add('hidden')},300);
}
function showStoreClosedModal(msg){
if(msg)storeClosedMessage=msg;
if(!storeClosedEl){
storeClosedEl=ce('div','store-closed-overlay');
var box=ce('div','store-closed-box');
var icon=ce('div','store-closed-icon');
icon.appendChild(svgI('M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z','2rem','2rem'));
box.appendChild(icon);
box.appendChild(ce('h3','font-logo','Ciccu Store Tutup 🌙'));
var msgP=ce('p',null,storeClosedMessage);
msgP.id='storeClosedText';
box.appendChild(msgP);
var okBtn=ce('button','btn btn-primary');
okBtn.setAttribute('type','button');
okBtn.style.width='100%';
okBtn.textContent='Mengerti 💕';
okBtn.addEventListener('click',closeStoreClosedModal);
box.appendChild(okBtn);
storeClosedEl.appendChild(box);
document.body.appendChild(storeClosedEl);
}else{
var txt=document.getElementById('storeClosedText');
if(txt)txt.textContent=storeClosedMessage;
storeClosedEl.classList.remove('hidden');
}
}
function closeStoreClosedModal(){if(storeClosedEl)storeClosedEl.classList.add('hidden')}
