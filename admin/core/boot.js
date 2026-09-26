document.addEventListener('DOMContentLoaded',function(){
var loginEl=document.getElementById('loginOverlay'),shellEl=document.getElementById('shell'),navCb=document.getElementById('navToggle'),routerStarted=false,checking=true;
try{sessionStorage.removeItem('ciccu.sess')}catch(e){}
function setHint(v){try{if(v)localStorage.setItem('ciccu.admin.hint','1');else localStorage.removeItem('ciccu.admin.hint')}catch(e){}}
function hasHint(){try{return localStorage.getItem('ciccu.admin.hint')==='1'}catch(e){return false}}
function showLogin(){checking=false;if(loginEl)loginEl.classList.remove('hidden');if(shellEl)shellEl.classList.add('hidden')}
function showShell(){checking=false;if(loginEl)loginEl.classList.add('hidden');if(shellEl)shellEl.classList.remove('hidden')}
function routeFromHash(){var h=String(location.hash||'').replace(/^#\/?/,'');return Reg.has(h)?h:'beranda'}
function ensureHash(){var h=String(location.hash||'').replace(/^#\/?/,'');if(!h||!Reg.has(h))location.hash='#/beranda'}
Sec.onShowLogin(function(){setHint(false);showLogin()});
Sec.onLoggedIn(function(){setHint(true);showShell();if(!routerStarted){routerStarted=true;ensureHash();Router.start()}else Router.go(routeFromHash(),{force:true})});
Sec.onExpired(function(){setHint(false);Router.reset();showLogin();Sec.renderCaptcha()});
Sec.onLockdown(function(){Router.reset()});
var lo=document.getElementById('btnLogoutTop');if(lo)lo.addEventListener('click',function(){Sec.logout('Anda telah keluar.')});
var ls=document.getElementById('btnLogoutSb');if(ls)ls.addEventListener('click',function(){Sec.logout('Anda telah keluar.')});
document.addEventListener('click',function(e){var t=e.target&&e.target.closest?e.target.closest('[data-nav]'):null;if(t&&navCb)navCb.checked=false});
Sec.initLogin();
if(!hasHint())showLogin();
Sec.checkSession(true).then(function(ok){if(!ok&&checking)showLogin()});
});
