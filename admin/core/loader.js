var Loader=(function(){
var scriptLoaded={};
function loadScript(src){
if(scriptLoaded[src])return Promise.resolve();
return new Promise(function(resolve,reject){
var s=document.createElement('script');
s.src=src+'?v='+APP_V;
s.defer=true;
s.onload=function(){scriptLoaded[src]=true;resolve()};
s.onerror=function(){reject(new Error('Gagal memuat berkas: '+src))};
document.head.appendChild(s);
});
}
function makeSpinner(){
var spin=ce('div','loading-state');
spin.appendChild(ce('div','loader'));
spin.appendChild(ce('p',null,'Menyiapkan halaman...'));
return spin;
}
function showError(host,msg){
if(!host)return;
while(host.firstChild)host.removeChild(host.firstChild);
var box=ce('div','page-error');
box.appendChild(ce('p',null,'⚠ Module gagal dimuat'));
box.appendChild(ce('p',null,String(msg||'Kesalahan tidak diketahui')));
host.appendChild(box);
}
function mount(name,host){
if(!host)host=document.getElementById('pageRoot');
if(!host)return Promise.reject(new Error('Elemen host tidak ditemukan untuk module: '+name));
while(host.firstChild)host.removeChild(host.firstChild);
var wrap=document.createElement('div');
wrap.className='page-host page-'+name;
host.appendChild(wrap);
var spin=makeSpinner();
host.appendChild(spin);
var mo=null;
function dropSpin(){
if(mo){mo.disconnect();mo=null}
if(spin.parentNode)spin.parentNode.removeChild(spin);
}
if(typeof MutationObserver!=='undefined'){
mo=new MutationObserver(function(){
if(wrap.firstChild)dropSpin();
});
mo.observe(wrap,{childList:true});
}
return Reg.loadCss(name).then(function(){
var files=Reg.files(name);
var chain=Promise.resolve();
files.forEach(function(f){
chain=chain.then(function(){return loadScript('modules/'+name+'/'+f)});
});
return chain;
}).then(function(){
var mod=AdminModules[name];
if(!mod)return Promise.reject(new Error('Namespace module tidak ditemukan: '+name));
if(typeof mod.init!=='function')return Promise.reject(new Error('Module tidak punya fungsi init: '+name));
return mod.init(wrap);
}).then(function(out){
dropSpin();
return out;
}).catch(function(err){
dropSpin();
showError(host,err&&err.message?err.message:String(err));
throw err;
});
}
function unmount(name){
var mod=AdminModules[name];
if(mod&&typeof mod.destroy==='function'){
try{mod.destroy()}catch(e){}
}
if(window.Clock)Clock.dispose(name);
}
return{mount:mount,unmount:unmount,showError:showError};
})();
