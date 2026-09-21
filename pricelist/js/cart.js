var cart=[];
var isSummaryExpanded=false;
var appForms={};
var cartPanelEl=null,cartBadgeEl=null,cartTotalEl=null,cartListEl=null,checkoutOverlayEl=null,checkoutBodyEl=null,checkoutTotalEl=null,toastEl=null;
function svgI(d,w,h){var ns='http://www.w3.org/2000/svg',s=document.createElementNS(ns,'svg');s.setAttribute('viewBox','0 0 24 24');s.setAttribute('fill','none');s.setAttribute('stroke','currentColor');s.setAttribute('stroke-width','2');s.setAttribute('stroke-linecap','round');s.setAttribute('stroke-linejoin','round');if(w)s.style.width=w;if(h)s.style.height=h;var p=document.createElementNS(ns,'path');p.setAttribute('d',d);s.appendChild(p);return s}
function waIcon(w,h){var ns='http://www.w3.org/2000/svg',s=document.createElementNS(ns,'svg');s.setAttribute('viewBox','0 0 24 24');s.setAttribute('fill','currentColor');if(w)s.style.width=w;if(h)s.style.height=h;var p=document.createElementNS(ns,'path');p.setAttribute('d','M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413Z');s.appendChild(p);return s}
function parseFormFields(str){
if(!str)return[];
try{if(str.trim().startsWith('['))return JSON.parse(str).map(function(i){return i.name||i})}catch(e){}
return str.split(',').map(function(s){return s.trim()}).filter(Boolean);
}
function formatSmartPrice(v){
if(isNaN(v)||v===null||v===undefined)return'0';
if(v>=1000&&v%1000===0)return(v/1000)+'K';
return v.toLocaleString('id-ID');
}
function extractNumK(priceStr){
if(!priceStr)return 0;
var str=String(priceStr).toUpperCase(),num=parseInt(str.replace(/[^0-9]/g,''))||0;
if(str.includes('K'))return num*1000;
return num;
}
function createCartPanel(){
cartPanelEl=ce('div','cart-panel');
var inner=ce('div','cart-inner');
var header=ce('div','cart-header');
var left=ce('div','cart-left');
var iconWrap=ce('div','cart-icon-wrap');
iconWrap.appendChild(svgI('M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z','1rem','1rem'));
cartBadgeEl=ce('span','cart-badge','0');
iconWrap.appendChild(cartBadgeEl);
left.appendChild(iconWrap);
var info=ce('div');
info.appendChild(ce('p','cart-info-label','Total Belanjaan 🛍️'));
cartTotalEl=ce('p','cart-info-total','0K');
info.appendChild(cartTotalEl);
left.appendChild(info);
var right=ce('div','cart-right');
var checkoutBtn=ce('button','cart-checkout');
checkoutBtn.setAttribute('type','button');
checkoutBtn.appendChild(ce('span',null,'Checkout'));
checkoutBtn.appendChild(svgI('M14 5l7 7m0 0l-7 7m7-7H3','.75rem','.75rem'));
checkoutBtn.addEventListener('click',function(e){e.stopPropagation();openCheckout()});
right.appendChild(checkoutBtn);
var toggleBtn=ce('div','cart-toggle');
toggleBtn.id='cartToggleIcon';
toggleBtn.appendChild(svgI('M19 9l-7 7-7-7','.875rem','.875rem'));
right.appendChild(toggleBtn);
header.appendChild(left);header.appendChild(right);
header.addEventListener('click',function(e){if(e.target.closest('.cart-checkout'))return;toggleSummaryList()});
cartListEl=ce('div','cart-list');
inner.appendChild(header);inner.appendChild(cartListEl);
cartPanelEl.appendChild(inner);
document.body.appendChild(cartPanelEl);
}
function toggleSummaryList(){
isSummaryExpanded=!isSummaryExpanded;
var icon=document.getElementById('cartToggleIcon');
if(isSummaryExpanded){cartListEl.classList.add('open');if(icon){while(icon.firstChild)icon.removeChild(icon.firstChild);icon.appendChild(svgI('M5 15l7-7 7 7','.875rem','.875rem'))}}
else{cartListEl.classList.remove('open');if(icon){while(icon.firstChild)icon.removeChild(icon.firstChild);icon.appendChild(svgI('M19 9l-7 7-7-7','.875rem','.875rem'))}}
}
function addToCart(appName,cat,dur,price){
if(typeof isStoreClosed!=='undefined'&&isStoreClosed){if(typeof showStoreClosedModal==='function')showStoreClosedModal();return}
var eff=FlashSale.getEffectivePrice({price:price,flash_price:price});
var isFlash=false,origPrice=price;
if(typeof allApps!=='undefined'&&allApps[appName]){
var info=allApps[appName];
for(var i=0;i<info.packages.length;i++){
var p=info.packages[i];
if(p.category===cat&&p.duration===dur){
var e2=FlashSale.getEffectivePrice(p);
price=e2.price;isFlash=e2.isFlash;origPrice=e2.isFlash?e2.originalPrice:e2.price;
break;
}}}
var idx=-1;
for(var i=0;i<cart.length;i++){if(cart[i].app===appName&&cart[i].cat===cat&&cart[i].dur===dur){idx=i;break}}
if(idx!==-1)cart[idx].qty++;
else cart.push({app:appName,cat:cat,dur:dur,price:price,qty:1,isFlash:isFlash,originalPrice:origPrice,separateForms:false,useFirstItemData:false,formData:[{}]});
updateCartUI();showToast();
var iconWrap=cartPanelEl?cartPanelEl.querySelector('.cart-icon-wrap'):null;
if(iconWrap){iconWrap.classList.remove('bounce');void iconWrap.offsetWidth;iconWrap.classList.add('bounce')}
}
function updateCartUI(){
var count=0,total=0;
for(var i=0;i<cart.length;i++){count+=cart[i].qty;total+=extractNumK(cart[i].price)*cart[i].qty}
if(cartBadgeEl)cartBadgeEl.textContent=count;
if(cartTotalEl)cartTotalEl.textContent=formatSmartPrice(total);
if(count>0){if(cartPanelEl)cartPanelEl.classList.add('visible');renderCartList()}
else{if(cartPanelEl)cartPanelEl.classList.remove('visible');isSummaryExpanded=false;if(cartListEl)cartListEl.classList.remove('open')}
}
function renderCartList(){
if(!cartListEl)return;
while(cartListEl.firstChild)cartListEl.removeChild(cartListEl.firstChild);
for(var i=0;i<cart.length;i++){
(function(index){
var item=cart[index];
var row=ce('div','cart-item');
var left=ce('div','cart-item-left');
var logoWrap=ce('div','cart-item-logo');
var logoUrl=typeof getLogoUrl==='function'?getLogoUrl(item.app):'';
if(logoUrl){var img=ce('img');img.setAttribute('src',logoUrl);img.setAttribute('loading','lazy');logoWrap.appendChild(img)}
else logoWrap.appendChild(ce('span',null,item.app.charAt(0)));
left.appendChild(logoWrap);
var info=ce('div','cart-item-info');
info.appendChild(ce('p','cart-item-name',item.app));
var pkg=ce('p','cart-item-pkg');
var catSpan=ce('span',null,item.cat);catSpan.style.color='var(--choco-600)';catSpan.style.fontWeight='700';catSpan.style.textTransform='uppercase';
pkg.appendChild(catSpan);
if(item.isFlash)pkg.appendChild(ce('span','flash-ind','⚡'));
pkg.appendChild(ce('span',null,' • '+item.dur));
info.appendChild(pkg);
left.appendChild(info);
var right=ce('div','cart-item-right');
right.appendChild(ce('span','cart-item-price',formatSmartPrice(extractNumK(item.price)*item.qty)));
var qtyCtrl=ce('div','qty-ctrl');
var minusBtn=ce('button','qty-btn minus','-');
minusBtn.addEventListener('click',function(){updateCartItemQty(index,-1)});
var val=ce('span','qty-val',String(item.qty));
var plusBtn=ce('button','qty-btn plus','+');
plusBtn.addEventListener('click',function(){updateCartItemQty(index,1)});
qtyCtrl.appendChild(minusBtn);qtyCtrl.appendChild(val);qtyCtrl.appendChild(plusBtn);
right.appendChild(qtyCtrl);
row.appendChild(left);row.appendChild(right);
cartListEl.appendChild(row);
})(i);
}
}
function updateCartItemQty(index,delta){
var item=cart[index];
var newQty=item.qty+delta;
if(newQty<1)cart.splice(index,1);
else cart[index].qty=newQty;
updateCartUI();
}
function showToast(){
if(!toastEl)return;
toastEl.classList.add('show');
setTimeout(function(){toastEl.classList.remove('show')},1500);
}
function createToast(){
toastEl=ce('div','toast');
var icon=ce('div','toast-icon');
icon.appendChild(svgI('M5 13l4 4L19 7','1rem','1rem'));
toastEl.appendChild(icon);
var text=ce('div','toast-text');
text.appendChild(ce('b',null,'Ditambahkan! 💕'));
text.appendChild(ce('small',null,'Cek di keranjang bawah ya.'));
toastEl.appendChild(text);
document.body.appendChild(toastEl);
}
function createCheckoutPanel(){
checkoutOverlayEl=ce('div','checkout-overlay');
checkoutOverlayEl.classList.add('hidden');
var backdrop=ce('div','checkout-backdrop');
backdrop.addEventListener('click',closeCheckout);
checkoutOverlayEl.appendChild(backdrop);
var panel=ce('div','checkout-panel');
var head=ce('div','checkout-head');
head.appendChild(ce('h3',null,'Lengkapi Data 📝'));
var closeBtn=ce('button','modal-close');
closeBtn.setAttribute('type','button');
closeBtn.appendChild(svgI('M6 18L18 6M6 6l12 12','1rem','1rem'));
closeBtn.addEventListener('click',closeCheckout);
head.appendChild(closeBtn);
panel.appendChild(head);
checkoutBodyEl=ce('div','checkout-body');
panel.appendChild(checkoutBodyEl);
var foot=ce('div','checkout-foot');
var totalRow=ce('div','checkout-total-row');
totalRow.appendChild(ce('span',null,'Total Pesanan:'));
checkoutTotalEl=ce('strong',null,'0K');
totalRow.appendChild(checkoutTotalEl);
foot.appendChild(totalRow);
var waBtn=ce('button','btn btn-green');
waBtn.setAttribute('type','button');
waBtn.appendChild(waIcon('1.125rem','1.125rem'));
waBtn.appendChild(ce('span',null,'Kirim Pesanan ke WA'));
waBtn.addEventListener('click',checkoutWA);
foot.appendChild(waBtn);
panel.appendChild(foot);
checkoutOverlayEl.appendChild(panel);
document.body.appendChild(checkoutOverlayEl);
}
function openCheckout(){
if(typeof isStoreClosed!=='undefined'&&isStoreClosed){if(typeof showStoreClosedModal==='function')showStoreClosedModal();return}
if(!cart.length)return;
renderCheckoutForms();
if(isSummaryExpanded)toggleSummaryList();
if(checkoutOverlayEl){checkoutOverlayEl.classList.remove('hidden');var panel=checkoutOverlayEl.querySelector('.checkout-panel');if(panel)panel.classList.add('open')}
}
function closeCheckout(){
if(checkoutOverlayEl){var panel=checkoutOverlayEl.querySelector('.checkout-panel');if(panel)panel.classList.remove('open');setTimeout(function(){checkoutOverlayEl.classList.add('hidden')},300)}
}
function renderCheckoutForms(){
if(!checkoutBodyEl)return;
while(checkoutBodyEl.firstChild)checkoutBodyEl.removeChild(checkoutBodyEl.firstChild);
var groups={},grandTotal=0;
for(var i=0;i<cart.length;i++){
var key=cart[i].app.toLowerCase().trim();
if(!groups[key])groups[key]={appName:cart[i].app,items:[]};
var itemTotal=extractNumK(cart[i].price)*cart[i].qty;
grandTotal+=itemTotal;
groups[key].items.push({idx:i,item:cart[i],totalFormatted:formatSmartPrice(itemTotal)});
}
var keys=Object.keys(groups);
for(var k=0;k<keys.length;k++){
var group=groups[keys[k]];
var fields=parseFormFields(appForms[keys[k]]||'');
var details=ce('details','checkout-group');
details.setAttribute('open','');
var summary=ce('summary');
var sLeft=ce('div','checkout-group-left');
var logoWrap=ce('div','checkout-group-logo');
var logoUrl=typeof getLogoUrl==='function'?getLogoUrl(group.appName):'';
if(logoUrl){var img=ce('img');img.setAttribute('src',logoUrl);img.setAttribute('loading','lazy');logoWrap.appendChild(img)}
else logoWrap.appendChild(ce('span',null,group.appName.charAt(0)));
sLeft.appendChild(logoWrap);
var sInfo=ce('div');
sInfo.appendChild(ce('p','checkout-group-name',group.appName));
sInfo.appendChild(ce('p','checkout-group-count',group.items.length+' Paket Dipilih'));
sLeft.appendChild(sInfo);
summary.appendChild(sLeft);
var arrow=ce('div','checkout-group-arrow');
arrow.appendChild(svgI('M19 9l-7 7-7-7','.875rem','.875rem'));
summary.appendChild(arrow);
details.appendChild(summary);
var body=ce('div','checkout-group-body');
for(var gi=0;gi<group.items.length;gi++){
var gItem=group.items[gi];
var itemDiv=ce('div','checkout-item');
var itemTop=ce('div','checkout-item-top');
var itemInfo=ce('div');
var catP=ce('p','checkout-item-cat');
catP.appendChild(ce('b',null,gItem.item.cat));
catP.appendChild(ce('span',null,' • '+gItem.item.dur));
itemInfo.appendChild(catP);
var metaP=ce('p','checkout-item-meta');
metaP.appendChild(ce('span',null,'Harga: '+gItem.item.price));
if(gItem.item.isFlash)metaP.appendChild(ce('span','flash-ind',' ⚡'));
metaP.appendChild(ce('span',null,' | Qty: '+gItem.item.qty));
itemInfo.appendChild(metaP);
itemTop.appendChild(itemInfo);
itemTop.appendChild(ce('span','checkout-item-total',gItem.totalFormatted));
itemDiv.appendChild(itemTop);
if(fields.length>0){
if(gi>0){
var sameLabel=ce('label','checkout-same-label');
var sameCb=ce('input');
sameCb.setAttribute('type','checkbox');
if(gItem.item.useFirstItemData)sameCb.setAttribute('checked','');
(function(ci){sameCb.addEventListener('change',function(){cart[ci].useFirstItemData=this.checked;renderCheckoutForms()})})(gItem.idx);
sameLabel.appendChild(sameCb);
sameLabel.appendChild(ce('span',null,'Samakan dengan form '+group.items[0].item.cat+' '+group.items[0].item.dur));
itemDiv.appendChild(sameLabel);
}
if(!gItem.item.useFirstItemData){
if(gItem.item.qty>1){
var sepLabel=ce('label','checkout-same-label');
var sepCb=ce('input');
sepCb.setAttribute('type','checkbox');
if(!gItem.item.separateForms)sepCb.setAttribute('checked','');
(function(ci){sepCb.addEventListener('change',function(){cart[ci].separateForms=!this.checked;renderCheckoutForms()})})(gItem.idx);
sepLabel.appendChild(sepCb);
sepLabel.appendChild(ce('span',null,'Gunakan data yang sama untuk semua '+gItem.item.qty+' akun pesanan ini'));
itemDiv.appendChild(sepLabel);
}
var loopCount=gItem.item.separateForms&&gItem.item.qty>1?gItem.item.qty:1;
for(var fIdx=0;fIdx<loopCount;fIdx++){
if(gItem.item.separateForms&&gItem.item.qty>1){
itemDiv.appendChild(ce('div','checkout-acct-label','↳ DATA AKUN #'+(fIdx+1)));
}
var fieldsWrap=ce('div',fIdx>0?'checkout-fields-wrap':'');
var grid=ce('div','checkout-fields-grid');
for(var fi=0;fi<fields.length;fi++){
(function(ci,fi2,fieldName){
var fieldDiv=ce('div','checkout-field');
fieldDiv.appendChild(ce('label',null,fieldName));
var input=ce('input');
input.setAttribute('type','text');
input.setAttribute('placeholder','Ketik '+fieldName);
if(!cart[ci].formData)cart[ci].formData=[];
if(!cart[ci].formData[fi2])cart[ci].formData[fi2]={};
if(cart[ci].formData[fi2][fieldName])input.value=cart[ci].formData[fi2][fieldName];
input.addEventListener('input',function(){
if(!cart[ci].formData)cart[ci].formData=[];
if(!cart[ci].formData[fi2])cart[ci].formData[fi2]={};
cart[ci].formData[fi2][fieldName]=this.value;
});
fieldDiv.appendChild(input);
grid.appendChild(fieldDiv);
})(gItem.idx,fIdx,fields[fi]);
}
fieldsWrap.appendChild(grid);
itemDiv.appendChild(fieldsWrap);
}
}else{
var okDiv=ce('div','checkout-same-ok');
okDiv.appendChild(svgI('M5 13l4 4L19 7','.875rem','.875rem'));
okDiv.appendChild(ce('p',null,'Data akan disalin otomatis.'));
itemDiv.appendChild(okDiv);
}
}
body.appendChild(itemDiv);
}
details.appendChild(body);
checkoutBodyEl.appendChild(details);
}
if(checkoutTotalEl)checkoutTotalEl.textContent=formatSmartPrice(grandTotal);
}
function checkoutWA(){
if(typeof isStoreClosed!=='undefined'&&isStoreClosed){if(typeof showStoreClosedModal==='function')showStoreClosedModal();return}
if(!cart.length)return;
for(var i=0;i<cart.length;i++){
var item=cart[i],key=item.app.toLowerCase().trim();
var fields=parseFormFields(appForms[key]||'');
if(fields.length>0&&!item.useFirstItemData){
var loopCount=item.separateForms&&item.qty>1?item.qty:1;
for(var fIdx=0;fIdx<loopCount;fIdx++){
for(var fi=0;fi<fields.length;fi++){
if(!item.formData||!item.formData[fIdx]||!item.formData[fIdx][fields[fi]]||!item.formData[fIdx][fields[fi]].trim()){
var msg='Mohon lengkapi kolom "'+fields[fi]+'" untuk pesanan '+item.app+' ('+item.cat+' '+item.dur+')';
if(item.separateForms&&item.qty>1)msg+=' (Pada Data Akun #'+(fIdx+1)+')';
alert(msg+' terlebih dahulu 🥺');
return;
}}}}
}
var grandTotal=0;
var text='୨  ૮˶ ᵕ ˶₎აhaloo, aku mau jajan ini! ౿ \n\n';
for(var i=0;i<cart.length;i++){
var item=cart[i],itemTotal=extractNumK(item.price)*item.qty;
grandTotal+=itemTotal;
var key=item.app.toLowerCase().trim();
var fields=parseFormFields(appForms[key]||'');
var flashTag=item.isFlash?' (⚡ Flash Sale)':'';
text+='  ⊹  ☆̲  '+item.app+' — '+item.dur+'\n';
text+='⊹  𓈒  ——— paket :  '+item.cat+'\n';
text+='⊹ ꒰  ♡ ——— total   :  '+item.qty+' pcs\n';
text+='⊹ ꒰  ♡ ——— harga   :  IDR '+formatSmartPrice(itemTotal)+flashTag+'\n';
if(fields.length>0){
text+='\n*DATA USER*\n';
if(item.useFirstItemData){
var first=null;
for(var j=0;j<cart.length;j++){if(cart[j].app===item.app){first=cart[j];break}}
text+=first?'(Data form sama dengan paket '+first.cat+' '+first.dur+')\n':'(Data form sama dengan paket sebelumnya)\n';
}else{
var isSep=item.separateForms,lc=isSep&&item.qty>1?item.qty:1;
if(isSep&&item.qty>1){
for(var fIdx=0;fIdx<lc;fIdx++){
text+='[Akun #'+(fIdx+1)+']\n';
for(var fi=0;fi<fields.length;fi++){
var val=item.formData&&item.formData[fIdx]&&item.formData[fIdx][fields[fi]]?item.formData[fIdx][fields[fi]]:'-';
text+='- '+fields[fi]+' : '+val+'\n';
}
if(fIdx<lc-1)text+='\n';
}
}else{
for(var fi=0;fi<fields.length;fi++){
var val=item.formData&&item.formData[0]&&item.formData[0][fields[fi]]?item.formData[0][fields[fi]]:'-';
text+='- '+fields[fi]+' : '+val+'\n';
}
}
}
text+='\n\n';
}else text+='\n\n';
}
text=text.trimEnd()+'\n\n';
text+='ఌ︎. 𓈄 total order : IDR '+formatSmartPrice(grandTotal)+' ⸝  ︎. ⟡ \n\n';
text+=' ⑅  bisa bantu untuk prosesnya kak?  ♡  .. thank you   ⊹ (. .*)β \nhave a sweet day  𖠗\n\n';
text+='https://ciccu.biz.id/qris';
window.open('https://wa.me/6283877337798?text='+encodeURIComponent(text),'_blank');
}
