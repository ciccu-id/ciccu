document.addEventListener('DOMContentLoaded',function(){
var loginEl=document.getElementById('loginOverlay');
var shellEl=document.getElementById('shell');
function showLogin(){if(loginEl)loginEl.style.display='flex';if(shellEl)shellEl.style.display='none'}
function showShell(){if(loginEl)loginEl.style.display='none';if(shellEl)shellEl.style.display='flex'}
Sec.onShowLogin(showLogin);
Sec.onLoggedIn(function(){showShell();Router.start()});
Sec.onExpired(function(){Router.reset();showLogin();Sec.renderCaptcha()});
Sec.onLockdown(function(){Router.reset()});
var lo=document.getElementById('btnLogoutTop');
if(lo)lo.addEventListener('click',function(){Sec.logout('Anda telah keluar.')});
var ls=document.getElementById('btnLogoutSb');
if(ls)ls.addEventListener('click',function(){Sec.logout('Anda telah keluar.')});
if(!Sec.boot())showLogin();
});
