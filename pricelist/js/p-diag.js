(function(){
var app=document.getElementById('app');
var fallback=document.getElementById('bootFallback');
var diagEl=null;
var hasHardError=false;
var shownEmpty=false;

function addCss(){
if(document.getElementById('ciccuDiagCss'))return;
var s=document.createElement('style');
s.id='ciccuDiagCss';
s.textContent='#ciccuDiag{position:fixed;z-index:2147483647;left:8px;right:8px;top:8px;background:#7f1d1d;color:#fff;font:12px/1.45 ui-monospace,SFMono-Regular,Menlo,Monaco,Consolas,"Liberation Mono","Courier New",monospace;padding:10px 12px;border-radius:10px;white-space:pre-wrap;max-height:75vh;overflow:auto;box-shadow:0 10px 30px rgba(0,0,0,.35)}';
document.head.appendChild(s);
}

function removeFallback(){
if(fallback&&fallback.parentNode)fallback.parentNode.removeChild(fallback);
fallback=null;
}

function removeDiagIfSoft(){
if(hasHardError)return;
if(diagEl&&diagEl.parentNode)diagEl.parentNode.removeChild(diagEl);
diagEl=null;
shownEmpty=false;
}

function show(title,detail,hard){
if(diagEl)return;
if(hard)hasHardError=true;
addCss();
diagEl=document.createElement('pre');
diagEl.id='ciccuDiag';
diagEl.textContent=title+'\n\n'+detail;
document.body.appendChild(diagEl);
}

function errText(e){
if(!e)return'';
if(typeof e==='string')return e;
var s='';
if(e.name)s+=e.name;
if(e.message)s+=(s?': ':'')+e.message;
if(e.stack)s+='\n'+e.stack;
return s||String(e);
}

window.addEventListener('error',function(ev){
var detail=(ev.message||'')+'\n'+(ev.filename||'')+':'+(ev.lineno||'')+':'+(ev.colno||'');
if(ev.error)detail+='\n\n'+errText(ev.error);
show('JS ERROR',detail,true);
},true);

window.addEventListener('unhandledrejection',function(ev){
show('PROMISE ERROR',errText(ev.reason),true);
});

if(app&&window.MutationObserver){
new MutationObserver(function(){
if(app.children.length>0){
removeFallback();
removeDiagIfSoft();
}
}).observe(app,{childList:true,subtree:false});
}

function fileStatus(urls){
return Promise.all(urls.map(function(u){
return fetch(u,{cache:'no-store',method:'GET'}).then(function(r){
var ct=r.headers.get('content-type')||'';
return u+' -> '+r.status+' '+ct;
}).catch(function(err){
return u+' -> FETCH_ERROR '+errText(err);
});
}));
}

function diagnoseEmpty(){
if(app&&app.children.length>0)return;
var urls=[
'/pricelist/js/p-app.js',
'/pricelist/js/p-api.js',
'/pricelist/js/p-cart.js',
'/pricelist/js/p-checkout.js',
'/pricelist/js/p-core.js',
'/pricelist/js/p-flashsale.js',
'/pricelist/js/p-modals.js',
'/pricelist/js/p-render.js',
'/pricelist/js/p-state.js',
'/pricelist/js/p-welcome.js'
];
fileStatus(urls).then(function(lines){
return import('/pricelist/js/p-app.js?diag='+encodeURIComponent(String(Date.now()))).then(function(){
lines.push('DYNAMIC_IMPORT /pricelist/js/p-app.js -> OK');
return lines;
}).catch(function(e){
lines.push('DYNAMIC_IMPORT /pricelist/js/p-app.js -> ERROR\n'+errText(e));
return lines;
});
}).then(function(lines){
shownEmpty=true;
show('HALAMAN KOSONG','#app masih kosong setelah 6 detik.\n\n'+lines.join('\n'),false);
});
}

window.addEventListener('load',function(){
setTimeout(diagnoseEmpty,6000);
});
})();
