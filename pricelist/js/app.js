document.addEventListener('DOMContentLoaded',function(){
if('serviceWorker'in navigator){navigator.serviceWorker.register('sw.js').catch(function(e){console.error('SW registration failed:',e)})}
createCartPanel();
createCheckoutPanel();
createToast();
loadPricelist().then(function(){
showWelcome();
}).catch(function(e){
console.error('Init error:',e);
var container=document.getElementById('app');
if(container){
while(container.firstChild)container.removeChild(container.firstChild);
var errDiv=ce('div','welcome');
errDiv.appendChild(ce('p',null,'Gagal memuat data. Silakan coba lagi. 🥺'));
var retryBtn=ce('button','btn btn-primary');
retryBtn.setAttribute('type','button');
retryBtn.textContent='Coba Lagi';
retryBtn.addEventListener('click',function(){location.reload()});
errDiv.appendChild(retryBtn);
container.appendChild(errDiv);
}
});
window.showPricelist=function(){
FlashSale.stop();
var container=document.getElementById('app');
if(!container)return;
renderPricelistView(container);
};
window.showWelcome=function(){
FlashSale.stop();
var container=document.getElementById('app');
if(!container)return;
renderWelcomeView(container);
};
});
