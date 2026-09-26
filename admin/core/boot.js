document.addEventListener('DOMContentLoaded',function(){
var loginEl=document.getElementById('loginOverlay');
var shellEl=document.getElementById('shell');
var navCb=document.getElementById('navToggle');
function showLogin(){if(loginEl)loginEl.classList.remove('hidden');if(shellEl)shellEl.classList.add('hidden')}
function showShell(){if(loginEl)loginEl.classList.add('hidden');if(shellEl)shellEl.classList.remove('hidden')}
Sec.onShowLogin(showLogin);
Sec.onLoggedIn(function(){showShell();Router.start()});
Sec.onExpired(function(){Router.reset();showLogin();Sec.renderCaptcha()});
Sec.onLockdown(function(){Router.reset()});
var lo=document.getElementById('btnLogoutTop');
if(lo)lo.addEventListener('click',function(){Sec.logout('Anda telah keluar.')});
var ls=document.getElementById('btnLogoutSb');
if(ls)ls.addEventListener('click',function(){Sec.logout('Anda telah keluar.')});
document.addEventListener('click',function(e){var t=e.target&&e.target.closest?e.target.closest('[data-nav]'):null;if(t&&navCb)navCb.checked=false});
Sec.initLogin();
if(!Sec.boot())showLogin();
});
