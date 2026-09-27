import{ce,svgI,ICON,waIcon,formatSmartPrice,extractNumK,parseFormFields}from'./p-core.js';
import{S,getLogoUrl}from'./p-state.js';
import{guardClosed,dialogA11y}from'./p-modals.js';
import{toggleSummaryList}from'./p-cart.js';
const WA_NUMBER='6283877337798';
const QRIS_URL='https://ciccu.biz.id/qris';
const FIELD_MAXLEN=500;
var overlayEl=null,bodyEl=null,totalEl=null;
var ckA11y=null,ckSavedFocus=null,ckOpen=false;
export function createCheckoutPanel(){
overlayEl=ce('div','checkout-overlay');overlayEl.classList.add('hidden');
var backdrop=ce('div','checkout-backdrop');backdrop.addEventListener('click',closeCheckout);overlayEl.appendChild(backdrop);
var panel=ce('div','checkout-panel');
var head=ce('div','checkout-head');
head.appendChild(ce('h3',null,'Lengkapi Data 📝'));
var closeBtn=ce('button','modal-close');closeBtn.setAttribute('type','button');closeBtn.appendChild(svgI(ICON.close,'1rem','1rem'));closeBtn.addEventListener('click',closeCheckout);
head.appendChild(closeBtn);
panel.appendChild(head);
bodyEl=ce('div','checkout-body');panel.appendChild(bodyEl);
var foot=ce('div','checkout-foot');
var totalRow=ce('div','checkout-total-row');totalRow.appendChild(ce('span',null,'Total Pesanan:'));
totalEl=ce('strong',null,'0K');totalRow.appendChild(totalEl);foot.appendChild(totalRow);
var waBtn=ce('button','btn btn-green');waBtn.setAttribute('type','button');
waBtn.appendChild(waIcon('1.125rem','1.125rem'));waBtn.appendChild(ce('span',null,'Kirim Pesanan ke WA'));
waBtn.addEventListener('click',checkoutWA);
foot.appendChild(waBtn);
panel.appendChild(foot);
overlayEl.appendChild(panel);
document.body.appendChild(overlayEl);
ckA11y=dialogA11y(overlayEl,panel,{isActive:function(){return ckOpen},onEscape:function(){closeCheckout()}});
}
export function openCheckout(){
if(guardClosed())return;
if(!S.cart.length)return;
renderForms();
if(S.summaryOpen)toggleSummaryList();
if(overlayEl){
ckOpen=true;
ckSavedFocus=document.activeElement;
overlayEl.classList.remove('hidden');
var panel=overlayEl.querySelector('.checkout-panel');
if(panel)panel.classList.add('open');
requestAnimationFrame(function(){requestAnimationFrame(function(){if(ckA11y)ckA11y.focusFirst()})});
}
}
export function closeCheckout(){
if(!overlayEl)return;
if(!ckOpen)return;
ckOpen=false;
var panel=overlayEl.querySelector('.checkout-panel');
if(panel)panel.classList.remove('open');
setTimeout(function(){overlayEl.classList.add('hidden')},300);
if(ckSavedFocus&&typeof ckSavedFocus.focus==='function'){try{ckSavedFocus.focus()}catch(e){}}
ckSavedFocus=null;
}
function renderForms(){
if(!bodyEl)return;
while(bodyEl.firstChild)bodyEl.removeChild(bodyEl.firstChild);
var groups={},grandTotal=0;
for(var i=0;i<S.cart.length;i++){
var key=String(S.cart[i].app).toLowerCase().trim();
if(!groups[key])groups[key]={appName:S.cart[i].app,items:[]};
var itemTotal=extractNumK(S.cart[i].price)*S.cart[i].qty;
grandTotal+=itemTotal;
groups[key].items.push({idx:i,item:S.cart[i],totalFormatted:formatSmartPrice(itemTotal)});
}
var keys=Object.keys(groups);
for(var k=0;k<keys.length;k++){
var group=groups[keys[k]];
var fields=parseFormFields(S.appForms[keys[k]]||'');
var details=ce('details','checkout-group');details.setAttribute('open','');
var summary=ce('summary');
var sLeft=ce('div','checkout-group-left');
var logoWrap=ce('div','checkout-group-logo');
var logoUrl=getLogoUrl(group.appName);
if(logoUrl){var img=ce('img');img.setAttribute('src',logoUrl);img.setAttribute('loading','lazy');logoWrap.appendChild(img)}
else logoWrap.appendChild(ce('span',null,group.appName.charAt(0)));
sLeft.appendChild(logoWrap);
var sInfo=ce('div');
sInfo.appendChild(ce('p','checkout-group-name',group.appName));
sInfo.appendChild(ce('p','checkout-group-count',group.items.length+' Paket Dipilih'));
sLeft.appendChild(sInfo);
summary.appendChild(sLeft);
var arrow=ce('div','checkout-group-arrow');arrow.appendChild(svgI(ICON.chevD,'.875rem','.875rem'));
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
var sameCb=ce('input');sameCb.setAttribute('type','checkbox');
if(gItem.item.useFirstItemData)sameCb.setAttribute('checked','');
(function(ci){sameCb.addEventListener('change',function(){S.cart[ci].useFirstItemData=this.checked;renderForms()})})(gItem.idx);
sameLabel.appendChild(sameCb);
sameLabel.appendChild(ce('span',null,'Samakan dengan form '+group.items[0].item.cat+' '+group.items[0].item.dur));
itemDiv.appendChild(sameLabel);
}
if(!gItem.item.useFirstItemData){
if(gItem.item.qty>1){
var sepLabel=ce('label','checkout-same-label');
var sepCb=ce('input');sepCb.setAttribute('type','checkbox');
if(!gItem.item.separateForms)sepCb.setAttribute('checked','');
(function(ci){sepCb.addEventListener('change',function(){S.cart[ci].separateForms=!this.checked;renderForms()})})(gItem.idx);
sepLabel.appendChild(sepCb);
sepLabel.appendChild(ce('span',null,'Gunakan data yang sama untuk semua '+gItem.item.qty+' akun pesanan ini'));
itemDiv.appendChild(sepLabel);
}
var loopCount=gItem.item.separateForms&&gItem.item.qty>1?gItem.item.qty:1;
for(var fIdx=0;fIdx<loopCount;fIdx++){
if(gItem.item.separateForms&&gItem.item.qty>1)itemDiv.appendChild(ce('div','checkout-acct-label','↳ DATA AKUN #'+(fIdx+1)));
var fieldsWrap=ce('div',fIdx>0?'checkout-fields-wrap':'');
var grid=ce('div','checkout-fields-grid');
for(var fi=0;fi<fields.length;fi++){
(function(ci,fi2,fieldName){
var fieldDiv=ce('div','checkout-field');
fieldDiv.appendChild(ce('label',null,fieldName));
var input=ce('input');
input.setAttribute('type','text');
input.setAttribute('placeholder','Ketik '+fieldName);
input.setAttribute('maxlength',String(FIELD_MAXLEN));
if(!S.cart[ci].formData)S.cart[ci].formData=[];
if(!S.cart[ci].formData[fi2])S.cart[ci].formData[fi2]={};
if(S.cart[ci].formData[fi2][fieldName])input.value=S.cart[ci].formData[fi2][fieldName];
input.addEventListener('input',function(){
if(!S.cart[ci].formData)S.cart[ci].formData=[];
if(!S.cart[ci].formData[fi2])S.cart[ci].formData[fi2]={};
S.cart[ci].formData[fi2][fieldName]=this.value;
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
okDiv.appendChild(svgI(ICON.check,'.875rem','.875rem'));
okDiv.appendChild(ce('p',null,'Data akan disalin otomatis.'));
itemDiv.appendChild(okDiv);
}
}
}
body.appendChild(itemDiv);
}
details.appendChild(body);
bodyEl.appendChild(details);
}
if(totalEl)totalEl.textContent=formatSmartPrice(grandTotal);
}
function checkoutWA(){
if(guardClosed())return;
if(!S.cart.length)return;
for(var i=0;i<S.cart.length;i++){
var item=S.cart[i],key=String(item.app).toLowerCase().trim();
var fields=parseFormFields(S.appForms[key]||'');
if(fields.length>0&&!item.useFirstItemData){
var loopCount=item.separateForms&&item.qty>1?item.qty:1;
for(var fIdx=0;fIdx<loopCount;fIdx++){
for(var fi=0;fi<fields.length;fi++){
if(!item.formData||!item.formData[fIdx]||!item.formData[fIdx][fields[fi]]||!String(item.formData[fIdx][fields[fi]]).trim()){
var msg='Mohon lengkapi kolom "'+fields[fi]+'" untuk pesanan '+item.app+' ('+item.cat+' '+item.dur+')';
if(item.separateForms&&item.qty>1)msg+=' (Pada Data Akun #'+(fIdx+1)+')';
alert(msg+' terlebih dahulu 🥺');
return;
}}}}
}
var grandTotal=0;
var text='୨  ૮˶  ˶აhaloo, aku mau jajan ini! ౿ \n\n';
for(var i2=0;i2<S.cart.length;i2++){
var it=S.cart[i2],itemTotal=extractNumK(it.price)*it.qty;
grandTotal+=itemTotal;
var key2=String(it.app).toLowerCase().trim();
var fields2=parseFormFields(S.appForms[key2]||'');
var flashTag=it.isFlash?' (⚡ Flash Sale)':'';
text+='  ⊹  ☆  '+it.app+' — '+it.dur+'\n';
text+='⊹    ——— paket :  '+it.cat+'\n';
text+='⊹   ♡ ——— total   :  '+it.qty+' pcs\n';
text+='⊹ ꒰   ——— harga   :  IDR '+formatSmartPrice(itemTotal)+flashTag+'\n';
if(fields2.length>0){
text+='\n*DATA USER*\n';
if(it.useFirstItemData){
var first=null;
for(var j=0;j<S.cart.length;j++){if(S.cart[j].app===it.app){first=S.cart[j];break}}
text+=first?'(Data form sama dengan paket '+first.cat+' '+first.dur+')\n':'(Data form sama dengan paket sebelumnya)\n';
}else{
var isSep=it.separateForms,lc=isSep&&it.qty>1?it.qty:1;
if(isSep&&it.qty>1){
for(var f2=0;f2<lc;f2++){
text+='[Akun #'+(f2+1)+']\n';
for(var g2=0;g2<fields2.length;g2++){
var val=it.formData&&it.formData[f2]&&it.formData[f2][fields2[g2]]?it.formData[f2][fields2[g2]]:'-';
text+='- '+fields2[g2]+' : '+val+'\n';
}
if(f2<lc-1)text+='\n';
}
}else{
for(var g3=0;g3<fields2.length;g3++){
var val2=it.formData&&it.formData[0]&&it.formData[0][fields2[g3]]?it.formData[0][fields2[g3]]:'-';
text+='- '+fields2[g3]+' : '+val2+'\n';
}
}
}
text+='\n\n';
}else text+='\n\n';
}
text=text.trimEnd()+'\n\n';
text+='ఌ︎. 𓈄 total order : IDR '+formatSmartPrice(grandTotal)+' ⸝  ︎. ⟡ \n\n';
text+=' ⑅  bisa bantu untuk prosesnya kak?  ♡  .. thank you   ⊹ (. .*)β \nhave a sweet day  \n\n';
text+=QRIS_URL;
var waUrl='https://wa.me/'+WA_NUMBER+'?text='+encodeURIComponent(text);
window.open(waUrl,'_blank','noopener,noreferrer');
}
