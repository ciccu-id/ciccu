var RES_SESSION=null;
var RES_VIEW='store';
var TURNSTILE_SITE_KEY='0x4AAAAAADpiSjv84N_2_kvG';
var resTurnstileId=null;
function ce(t,c,x){var e=document.createElement(t);if(c)e.className=c;if(x!==undefined&&x!==null)e.textContent=x;return e}
function svgI(d,w,h){var ns='http://www.w3.org/2000/svg',s=document.createElementNS(ns,'svg');s.setAttribute('viewBox','0 0 24 24');s.setAttribute('fill','none');s.setAttribute('stroke','currentColor');s.setAttribute('stroke-width','2');s.setAttribute('stroke-linecap','round');s.setAttribute('stroke-linejoin','round');if(w)s.style.width=w;if(h)s.style.height=h;var p=document.createElementNS(ns,'path');p.setAttribute('d',d);s.appendChild(p);return s}
function resFmt(n){n=parseInt(n,10)||0;if(n>=1000&&n%1000===0)return(n/1000)+'K';return n.toLocaleString('id-ID')}
function resNum(str){if(!str)return 0;var s=String(str).toUpperCase();var n=parseInt(s.replace(/[^0-9]/g,''),10)||0;return s.includes('K')?n*1000:n}
function resApi(path,opts){
opts=opts||{};
opts.credentials='same-origin';
opts.headers=Object.assign({'Content-Type':'application/json'},opts.headers||{});
return fetch(path,opts).then(function(r){
if(r.status===401){RES_SESSION=null;renderLogin();throw new Error('unauthorized')}
return r.json();
});
}
function resToast(msg){
var t=document.getElementById('resToast');
if(!t){t=ce('div','r-toast');t.id='resToast';document.body.appendChild(t)}
t.textContent=msg;
t.classList.add('show');
setTimeout(function(){t.classList.remove('show')},1800);
}
function ensureTurnstile(cb){
if(window.turnstile)return cb();
var n=0;
var iv=setInterval(function(){
n++;
if(window.turnstile){clearInterval(iv);cb()}
else if(n>40){clearInterval(iv)}
},250);
}
function renderLogin(){
var container=document.getElementById('app');
if(!container)return;
while(container.firstChild)container.removeChild(container.firstChild);
var wrap=ce('div','r-login');
var box=ce('div','r-login-box');
box.appendChild(ce('h1','r-login-title','Ciccu Reseller'));
box.appendChild(ce('p','r-login-sub','Portal harga wholesale & order otomatis'));
var u=ce('input','r-input');u.setAttribute('type','text');u.setAttribute('placeholder','Username');u.setAttribute('autocomplete','username');u.id='resLoginUser';
var p=ce('input','r-input');p.setAttribute('type','password');p.setAttribute('placeholder','Password');p.setAttribute('autocomplete','current-password');p.id='resLoginPass';
var tw=ce('div','cf-turnstile');tw.id='resTurnstile';tw.style.marginBottom='.625rem';
var btn=ce('button','r-btn r-btn-primary');btn.setAttribute('type','button');btn.textContent='Masuk';
btn.addEventListener('click',doLogin);
p.addEventListener('keydown',function(e){if(e.key==='Enter')doLogin()});
box.appendChild(u);box.appendChild(p);box.appendChild(tw);box.appendChild(btn);
wrap.appendChild(box);
container.appendChild(wrap);
ensureTurnstile(function(){
if(resTurnstileId!==null&&window.turnstile){try{turnstile.remove(resTurnstileId)}catch(e){}}
resTurnstileId=turnstile.render('#resTurnstile',{sitekey:TURNSTILE_SITE_KEY});
});
}
function getTurnstileToken(){
if(window.turnstile&&resTurnstileId!==null){try{var t=turnstile.getResponse(resTurnstileId);if(t)return t}catch(e){}}
var el=document.querySelector('[name="cf-turnstile-response"]');
return el?el.value:'';
}
function doLogin(){
var u=document.getElementById('resLoginUser');
var p=document.getElementById('resLoginPass');
if(!u||!p||!u.value.trim()||!p.value)return resToast('Isi username & password.');
var token=getTurnstileToken();
if(!token)return resToast('Selesaikan verifikasi keamanan dulu.');
var btn=document.querySelector('.r-login-box .r-btn-primary');
if(btn){btn.disabled=true;btn.textContent='Memverifikasi...'}
fetch('/api/reseller/login',{method:'POST',credentials:'same-origin',headers:{'Content-Type':'application/json'},body:JSON.stringify({username:u.value.trim(),password:p.value,turnstileResponse:token})})
.then(function(r){return r.json().then(function(d){return{ok:r.ok,d:d}})})
.then(function(res){
if(res.ok){checkSession()}
else{resToast(res.d.error||'Gagal login.');ensureTurnstile(function(){if(window.turnstile&&resTurnstileId!==null)turnstile.reset(resTurnstileId)})}
})
.catch(function(){resToast('Terjadi kesalahan jaringan.')})
.finally(function(){if(btn){btn.disabled=false;btn.textContent='Masuk'}});
}
function checkSession(){
fetch('/api/reseller/me',{credentials:'same-origin'}).then(function(r){
if(!r.ok)throw new Error('no session');
return r.json();
}).then(function(me){
RES_SESSION=me;
resShowView(RES_VIEW||'store');
}).catch(function(){renderLogin()});
}
function resLogout(){
fetch('/api/reseller/logout',{method:'POST',credentials:'same-origin'}).catch(function(){});
RES_SESSION=null;
renderLogin();
}
function renderTopbar(container){
var bar=ce('div','r-topbar');
var brand=ce('div','r-brand');
brand.appendChild(ce('span',null,'Ciccu'));
brand.appendChild(document.createTextNode(' Reseller'));
bar.appendChild(brand);
var right=ce('div','r-top-right');
var user=ce('span','r-user',RES_SESSION?(RES_SESSION.display_name||RES_SESSION.username):'');
right.appendChild(user);
var nav=ce('div','r-nav');
var bStore=ce('button','r-nav-btn'+(RES_VIEW==='store'?' active':''),'Toko');
bStore.setAttribute('type','button');
bStore.addEventListener('click',function(){resShowView('store')});
var bOrders=ce('button','r-nav-btn'+(RES_VIEW==='orders'?' active':''),'Pesanan');
bOrders.setAttribute('type','button');
bOrders.addEventListener('click',function(){resShowView('orders')});
nav.appendChild(bStore);nav.appendChild(bOrders);
right.appendChild(nav);
var out=ce('button','r-logout','Keluar');
out.setAttribute('type','button');
out.addEventListener('click',resLogout);
right.appendChild(out);
bar.appendChild(right);
container.appendChild(bar);
}
function resShowView(v){
RES_VIEW=v;
var container=document.getElementById('app');
if(!container)return;
while(container.firstChild)container.removeChild(container.firstChild);
renderTopbar(container);
if(v==='orders'){if(typeof resRenderOrders==='function')resRenderOrders(container)}
else{if(typeof resRenderStore==='function')resRenderStore(container)}
}
document.addEventListener('DOMContentLoaded',function(){checkSession()});
