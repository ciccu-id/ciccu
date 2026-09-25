var Loader=(function(){
var cur=null,rootEl=null,mountSeq=0,cssDone={},jsDone={},modLoading={};
function url(p){return p+'?v='+APP_V}
function loadLink(p){if(cssDone[p])return cssDone[p];var pr=new Promise(function(res,rej){var l=document.createElement('link');l.rel='stylesheet';l.href=url(p);l.onload=function(){res()};l.onerror=function(){rej(new Error('Gagal memuat style: '+p))};document.head.appendChild(l)});cssDone[p]=pr;pr.catch(function(){delete cssDone[p]});return pr}
function loadScript(p){if(jsDone[p])return jsDone[p];var pr=new Promise(function(res,rej){var s=document.createElement('script');s.src=url(p);s.onload=function(){res()};s.onerror=function(){rej(new Error('Gagal memuat script: '+p))};document.body.appendChild(s)});jsDone[p]=pr;pr.catch(function(){delete jsDone[p]});return pr}
function ensure(name){var m=Reg.get(name);if(!m)return Promise.reject(new Error('Module tidak dikenal: '+name));if(modLoading[name])return modLoading[name];var pr=Promise.all(m.css.map(loadLink)).then(function(){return m.js.reduce(function(chain,p){return chain.then(function(){return loadScript(p)})},Promise.resolve())});modLoading[name]=pr;pr.catch(function(){delete modLoading[name]});return pr}
function unmountCur(){if(!cur)return;var mod=AdminModules[cur];if(mod&&mod.destroy){try{mod.destroy()}catch(e){}}Clock.dispose(cur);cur=null}
function mount(name){
var m=Reg.get(name);
rootEl=rootEl||document.getElementById('pageRoot');
if(!m||!rootEl)return Promise.reject(new Error('Module tidak dikenal: '+name));
var seq=++mountSeq;
return ensure(name).then(function(){
if(seq!==mountSeq)return;
unmountCur();
cur=name;
var host=ce('div','page-host page-'+name);
rootEl.innerHTML='';
rootEl.appendChild(host);
var mod=AdminModules[name];
if(mod&&mod.init)mod.init(host);
}).catch(function(e){
if(seq!==mountSeq)return;
rootEl.innerHTML='';
rootEl.appendChild(ce('div','page-error','Halaman gagal dimuat: '+(e&&e.message?e.message:e)));
});
}
function preload(){var names=Reg.names();var i=0;function next(){if(i>=names.length)return;var n=names[i++];ensure(n).then(next,next)}next()}
if(window.Sec)Sec.onLoggedIn(function(){setTimeout(preload,400)});
return{mount:mount,preload:preload,ensure:ensure,current:function(){return cur}};
})();
