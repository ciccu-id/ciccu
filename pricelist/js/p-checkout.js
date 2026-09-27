import{ce,svgI,ICON,waIcon,formatSmartPrice,extractNumK,parseFormFields}from'./p-core.js';
import{S,getLogoUrl}from'./p-state.js';
import{guardClosed,dialogA11y}from'./p-modals.js';
import{toggleSummaryList}from'./p-cart.js';
const WA_NUMBER='6283877337798';
const QRIS_URL='https://ciccu.biz.id/qris';
const FIELD_MAXLEN=500;
let overlayEl=null,bodyEl=null,totalEl=null;
let ckA11y=null,ckSavedFocus=null,ckOpen=false;
export function createCheckoutPanel(){
overlayEl=ce('div','checkout-overlay');overlayEl.classList.add('hidden');
const backdrop=ce('div','checkout-backdrop');backdrop.addEventListener('click',closeCheckout);overlayEl.appendChild(backdrop);
const panel=ce('div','checkout-panel');
const head=ce('div','checkout-head');head.appendChild(ce('h3',null,'Lengkapi Data 📝'));
const closeBtn=ce('button','modal-close');closeBtn.type='button';closeBtn.appendChild(svgI(ICON.close,'1rem','1rem'));closeBtn.addEventListener('click',closeCheckout);head.appendChild(closeBtn);
panel.appendChild(head);
bodyEl=ce('div','checkout-body');panel.appendChild(bodyEl);
const foot=ce('div','checkout-foot');
const totalRow=ce('div','checkout-total-row');totalRow.appendChild(ce('span',null,'Total Pesanan:'));totalEl=ce('strong',null,'0K');totalRow.appendChild(totalEl);foot.appendChild(totalRow);
const waBtn=ce('button','btn btn-green');waBtn.type='button';waBtn.appendChild(waIcon('1.125rem','1.125rem'));waBtn.appendChild(ce('span',null,'Kirim Pesanan ke WA'));waBtn.addEventListener('click',checkoutWA);foot.appendChild(waBtn);
panel.appendChild(foot);overlayEl.appendChild(panel);document.body.appendChild(overlayEl);
ckA11y=dialogA11y(overlayEl,panel,{isActive:function(){return ckOpen},onEscape:function(){closeCheckout()}});
}
export function openCheckout(){
if(guardClosed())return;if(!S.cart.length)return;if(ckOpen)return;
renderForms();if(S.summaryOpen)toggleSummaryList();
ckOpen=true;ckSavedFocus=document.activeElement;
overlayEl.classList.remove('hidden');
const panel=overlayEl.querySelector('.checkout-panel');if(panel)panel.classList.add('open');
requestAnimationFrame(function(){requestAnimationFrame(function(){if(ckA11y)ckA11y.focusFirst()})});
}
export function closeCheckout(){
if(!overlayEl)return;if(!ckOpen)return;
ckOpen=false;
const panel=overlayEl.querySelector('.checkout-panel');if(panel)panel.classList.remove('open');
setTimeout(function(){overlayEl.classList.add('hidden')},300);
if(ckSavedFocus&&typeof ckSavedFocus.focus==='function'){try{ckSavedFocus.focus()}catch(e){}}
ckSavedFocus=null;
}
function renderForms(){
if(!bodyEl)return;
while(bodyEl.firstChild)bodyEl.removeChild(bodyEl.firstChild);
const groups={},order=[];let grandTotal=0;
S.cart.forEach(function(item,idx){
const key=String(item.app||'').toLowerCase().trim();
if(!groups[key]){groups[key]={appName:item.app,items:[]};order.push(key)}
const itemTotal=extractNumK(item.price)*Number(item.qty||0);grandTotal+=itemTotal;
groups[key].items.push({idx:idx,item:item,totalFormatted:formatSmartPrice(itemTotal)});
});
order.forEach(function(key){
const group=groups[key];const fields=parseFormFields(S.appForms[key]||'');
const details=ce('details','checkout-group');details.setAttribute('open','');
const summary=ce('summary');
const sLeft=ce('div','checkout-group-left');
const logoWrap=ce('div','checkout-group-logo');const logoUrl=getLogoUrl(group.appName);
if(logoUrl){const img=ce('img');img.setAttribute('src',logoUrl);img.setAttribute('loading','lazy');logoWrap.appendChild(img)}else{logoWrap.appendChild(ce('span',null,String(group.appName||'').charAt(0)))}
sLeft.appendChild(logoWrap);
const sInfo=ce('div');sInfo.appendChild(ce('p','checkout-group-name',group.appName));sInfo.appendChild(ce('p','checkout-group-count',group.items.length+' Paket Dipilih'));sLeft.appendChild(sInfo);
summary.appendChild(sLeft);
const arrow=ce('div','checkout-group-arrow');arrow.appendChild(svgI(ICON.chevD,'.875rem','.875rem'));summary.appendChild(arrow);
details.appendChild(summary);
const body=ce('div','checkout-group-body');
group.items.forEach(function(gItem,gi){
const itemDiv=ce('div','checkout-item');
const itemTop=ce('div','checkout-item-top');
const itemInfo=ce('div');
const catP=ce('p','checkout-item-cat');catP.appendChild(ce('b',null,gItem.item.cat));catP.appendChild(ce('span',null,' • '+gItem.item.dur));itemInfo.appendChild(catP);
const metaP=ce('p','checkout-item-meta');metaP.appendChild(ce('span',null,'Harga: '+gItem.item.price));if(gItem.item.isFlash)metaP.appendChild(ce('span','flash-ind',' ⚡'));metaP.appendChild(ce('span',null,' | Qty: '+gItem.item.qty));itemInfo.appendChild(metaP);
itemTop.appendChild(itemInfo);itemTop.appendChild(ce('span','checkout-item-total',gItem.totalFormatted));itemDiv.appendChild(itemTop);
if(fields.length>0){
if(gi>0){
const sameLabel=ce('label','checkout-same-label');const sameCb=ce('input');sameCb.type='checkbox';if(gItem.item.useFirstItemData)sameCb.checked=true;
sameCb.addEventListener('change',function(){S.cart[gItem.idx].useFirstItemData=this.checked;renderForms()});
sameLabel.appendChild(sameCb);sameLabel.appendChild(ce('span',null,'Samakan dengan form '+group.items[0].item.cat+' '+group.items[0].item.dur));itemDiv.appendChild(sameLabel);
}
if(!gItem.item.useFirstItemData){
if(gItem.item.qty>1){
const sepLabel=ce('label','checkout-same-label');const sepCb=ce('input');sepCb.type='checkbox';if(!gItem.item.separateForms)sepCb.checked=true;
sepCb.addEventListener('change',function(){S.cart[gItem.idx].separateForms=!this.checked;renderForms()});
sepLabel.appendChild(sepCb);sepLabel.appendChild(ce('span',null,'Gunakan data yang sama untuk semua '+gItem.item.qty+' akun pesanan ini'));itemDiv.appendChild(sepLabel);
}
const loopCount=(gItem.item.separateForms&&gItem.item.qty>1)?gItem.item.qty:1;
for(let fIdx=0;fIdx<loopCount;fIdx++){
if(gItem.item.separateForms&&gItem.item.qty>1)itemDiv.appendChild(ce('div','checkout-acct-label','↳ DATA AKUN #'+(fIdx+1)));
const fieldsWrap=ce('div',fIdx>0?'checkout-fields-wrap':'');const grid=ce('div','checkout-fields-grid');
fields.forEach(function(fieldName){
const fieldDiv=ce('div','checkout-field');fieldDiv.appendChild(ce('label',null,fieldName));
const input=ce('input');input.type='text';input.setAttribute('placeholder','Ketik '+fieldName);input.setAttribute('maxlength',String(FIELD_MAXLEN));
if(!S.cart[gItem.idx].formData)S.cart[gItem.idx].formData=[];
if(!S.cart[gItem.idx].formData[fIdx])S.cart[gItem.idx].formData[fIdx]={};
if(S.cart[gItem.idx].formData[fIdx][fieldName])input.value=S.cart[gItem.idx].formData[fIdx][fieldName];
input.addEventListener('input',function(){S.cart[gItem.idx].formData[fIdx][fieldName]=this.value});
fieldDiv.appendChild(input);grid.appendChild(fieldDiv);
});
fieldsWrap.appendChild(grid);itemDiv.appendChild(fieldsWrap);
}
}else{
const okDiv=ce('div','checkout-same-ok');okDiv.appendChild(svgI(ICON.check,'.875rem','.875rem'));okDiv.appendChild(ce('p',null,'Data akan disalin otomatis.'));itemDiv.appendChild(okDiv);
}
}
body.appendChild(itemDiv);
});
details.appendChild(body);bodyEl.appendChild(details);
});
if(totalEl)totalEl.textContent=formatSmartPrice(grandTotal);
}
function checkoutWA(){
if(guardClosed())return;if(!S.cart.length)return;
for(let i=0;i<S.cart.length;i++){
const item=S.cart[i];const key=String(item.app||'').toLowerCase().trim();const fields=parseFormFields(S.appForms[key]||'');
if(fields.length>0&&!item.useFirstItemData){
const loopCount=(item.separateForms&&item.qty>1)?item.qty:1;
for(let fIdx=0;fIdx<loopCount;fIdx++){
for(let fi=0;fi<fields.length;fi++){
const fieldName=fields[fi];const val=item.formData&&item.formData[fIdx]?item.formData[fIdx][fieldName]:'';
if(!String(val||'').trim()){
let msg='Mohon lengkapi kolom "'+fieldName+'" untuk pesanan '+item.app+' ('+item.cat+' '+item.dur+')';
if(item.separateForms&&item.qty>1)msg+=' (Pada Data Akun #'+(fIdx+1)+')';
alert(msg+' terlebih dahulu 🥺');return;
}
}
}
}
}
let grandTotal=0;let text='୨  ૮˶  ˶აhaloo, aku mau jajan ini! ౿ \n\n';
for(let i=0;i<S.cart.length;i++){
const it=S.cart[i];const itemTotal=extractNumK(it.price)*Number(it.qty||0);grandTotal+=itemTotal;
const key=String(it.app||'').toLowerCase().trim();const fields=parseFormFields(S.appForms[key]||'');const flashTag=it.isFlash?' (⚡ Flash Sale)':'';
text+='  ⊹  ☆  '+it.app+' — '+it.dur+'\n';
text+='⊹    ——— paket :  '+it.cat+'\n';
text+='⊹   ♡ ——— total   :  '+it.qty+' pcs\n';
text+='⊹ ꒰   ——— harga   :  IDR '+formatSmartPrice(itemTotal)+flashTag+'\n';
if(fields.length>0){
text+='\n*DATA USER*\n';
if(it.useFirstItemData){
let first=null;
for(let j=0;j<S.cart.length;j++){if(String(S.cart[j].app||'')===String(it.app||'')){first=S.cart[j];break}}
if(first)text+='(Data form sama dengan paket '+first.cat+' '+first.dur+')\n';else text+='(Data form sama dengan paket sebelumnya)\n';
}else{
const isSep=it.separateForms;const lc=(isSep&&it.qty>1)?it.qty:1;
if(isSep&&it.qty>1){
for(let f=0;f<lc;f++){
text+='[Akun #'+(f+1)+']\n';
for(let g=0;g<fields.length;g++){const val=it.formData&&it.formData[f]&&it.formData[f][fields[g]]?it.formData[f][fields[g]]:'-';text+='- '+fields[g]+' : '+val+'\n'}
if(f<lc-1)text+='\n';
}
}else{
for(let g=0;g<fields.length;g++){const val=it.formData&&it.formData[0]&&it.formData[0][fields[g]]?it.formData[0][fields[g]]:'-';text+='- '+fields[g]+' : '+val+'\n'}
}
}
text+='\n\n';
}else{text+='\n\n'}
}
text=text.trimEnd()+'\n\n';
text+='ఌ︎. 𓈄 total order : IDR '+formatSmartPrice(grandTotal)+' ⸝  ︎. ⟡ \n\n';
text+=' ⑅  bisa bantu untuk prosesnya kak?  ♡  .. thank you   ⊹ (. .*)β \nhave a sweet day  \n\n';
text+=QRIS_URL;
const waUrl='https://wa.me/'+WA_NUMBER+'?text='+encodeURIComponent(text);
window.open(waUrl,'_blank','noopener,noreferrer');
}
