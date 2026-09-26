var Sec=(function(){
var KEY='ciccu.admin.session',IDLE_MS=1800000,ABS_MS=28800000,CHK_MS=30000,TURNSTILE_SITE_KEY='0x4AAAAAADpiSjv84N_2_kvG';
var sess=null,expired=false,captchaId=null,actBound=false,lastWrite=0,idleTimer=null;
var hooks=[],expiredCbs=[],loggedInCbs=[],showLoginCbs=[];
function now(){return Date.now()}
function read(){try{var r=sessionStorage.getItem(KEY);if(!r)return null;var o=JSON.parse(r);return(o&&o.at)?o:null}catch(e){return null}}
function write(o){try{sessionStorage.setItem(KEY,JSON.stringify(o))}catch(e){}}
function clearKey(){try{sessionStorage.removeItem(KEY)}catch(e){}}
function toast(m){if(typeof uiToast==='function')uiToast(m)}
function alertBox(m,t){if(typeof uiAlert==='function')uiAlert(m,t||'Perhatian');else alert(m)}
function touch(){if(!sess||expired)return;var t=now();if(t-lastWrite<5000)return;sess.last=t;lastWrite=t;write(sess)}
function bindActivity(){if(actBound)return;actBound=true;['click','keydown','touchstart','scroll'].forEach(function(e){document.addEventListener(e,touch,{passive:true})})}
function startTimers(){stopTimers();idleTimer=setInterval(check,CHK_MS)}
function stopTimers(){if(idleTimer){clearInterval(idleTimer);idleTimer=null}}
function check(){if(!sess||expired)return;var t=now();if(t-(sess.last||sess.at)>IDLE_MS||t-sess.at>ABS_MS)expire('Sesi berakhir karena tidak aktif atau melewati batas waktu.')}
function expire(msg){if(expired)return;expired=true;sess=null;clearKey();stopTimers();hooks.forEach(function(f){try{f()}catch(e){}});if(typeof Store!=='undefined'&&Store.clearAll)Store.clearAll();expiredCbs.forEach(function(f){try{f()}catch(e){}});if(msg)toast(msg)}
function clearSilent(){sess=null;clearKey();stopTimers()}
function fireLoggedIn(){loggedInCbs.forEach(function(f){try{f()}catch(e){}})}
function setLocalSession(){sess={at:now(),last:now()};lastWrite=sess.last;write(sess);expired=false;bindActivity();startTimers();fireLoggedIn()}
function checkSession(silent){if(expired)return Promise.resolve(false);return fetch('/api/admin/session',{credentials:'same-origin'}).then(function(r){if(r.ok)return r.json().then(function(d){if(d&&d.authenticated){setLocalSession();return true}if(silent)clearSilent();else expire('Sesi tidak valid. Silakan masuk kembali.');return false}).catch(function(){if(silent)clearSilent();else expire('Sesi tidak valid. Silakan masuk kembali.');return false});if(silent)clearSilent();else expire('Sesi Anda berakhir. Silakan masuk kembali.');return false}).catch(function(){if(!silent)expire('Gagal memverifikasi sesi. Silakan coba lagi.');return false})}
function ensureCaptcha(cb){if(window.turnstile)return cb();var n=0;var iv=setInterval(function(){n++;if(window.turnstile){clearInterval(iv);cb()}else if(n>40){clearInterval(iv)}},250)}
function renderCaptcha(){var el=document.getElementById('turnstileWidget');if(!el)return;if(captchaId!==null&&window.turnstile){try{turnstile.remove(captchaId)}catch(e){}}if(window.turnstile)captchaId=turnstile.render('#turnstileWidget',{sitekey:TURNSTILE_SITE_KEY})}
function resetCaptcha(){if(window.turnstile&&captchaId!==null){try{turnstile.reset(captchaId)}catch(e){}}}
function captchaToken(){if(window.turnstile&&captchaId!==null){try{var t=turnstile.getResponse(captchaId);if(t)return t}catch(e){}}var el=document.querySelector('[name="cf-turnstile-response"]');return el?el.value:''}
function raw(url,opts){opts=opts||{};opts.headers=opts.headers||{};opts.credentials=opts.credentials||'same-origin';return fetch(url,opts).then(function(r){if(r.status===401||r.status===403){expire('Sesi Anda berakhir. Silakan masuk kembali.');throw new Error('Sesi berakhir')}if(!r.ok)return r.text().then(function(tx){var msg='HTTP '+r.status;try{var d=JSON.parse(tx);if(d&&d.error)msg=d.error}catch(e){}throw new Error(msg)});return r})}
function json(url,opts){return raw(url,opts).then(function(r){return r.json()})}
function login(pw,captcha){return fetch('/api/admin/login',{method:'POST',headers:{'Content-Type':'application/json'},credentials:'same-origin',body:JSON.stringify({password:pw,turnstileResponse:captcha})}).then(function(r){if(!r.ok)return r.json().then(function(d){throw new Error(d.error||'Gagal login.')}).catch(function(){throw new Error('Gagal login.')});setLocalSession();return true})}
function submitLogin(){var inp=document.getElementById('adminPasswordInput');var btn=document.getElementById('btnLogin');if(!inp||!inp.value)return alertBox('Isi passwordnya dulu ya!','Password Kosong');var tok=captchaToken();if(!tok)return alertBox('Mohon selesaikan verifikasi keamanan Captcha terlebih dahulu.','Verifikasi Diperlukan');var old=btn?btn.textContent:'';if(btn){btn.textContent='Memverifikasi...';btn.disabled=true}login(inp.value,tok).then(function(){inp.value='';resetCaptcha()}).catch(function(e){alertBox(e.message||'Gagal login.','Login Gagal');resetCaptcha()}).finally(function(){if(btn){btn.textContent=old;btn.disabled=false}})}
function initLogin(){var inp=document.getElementById('adminPasswordInput');var btn=document.getElementById('btnLogin');if(inp)inp.addEventListener('keydown',function(e){if(e.key==='Enter')submitLogin()});if(btn)btn.addEventListener('click',function(){submitLogin()});ensureCaptcha(renderCaptcha)}
function boot(){sess=read();expired=false;if(sess){bindActivity();startTimers()}checkSession(true);showLoginCbs.forEach(function(f){try{f()}catch(e){}});ensureCaptcha(renderCaptcha);return false}
function logout(m){if(!sess||expired){expire(m||'Anda telah keluar.');return Promise.resolve()}return raw('/api/admin/logout',{method:'POST'}).then(function(){expire(m||'Anda telah keluar.')}).catch(function(){expire(m||'Anda telah keluar.')})}
function once(btn,fn){if(!btn)return fn();if(btn.dataset&&btn.dataset.secOnce)return;if(btn.dataset)btn.dataset.secOnce='1';setTimeout(function(){if(btn.dataset)delete btn.dataset.secOnce},1200);fn()}
return{raw:raw,json:json,headers:function(){return{}},active:function(){return!!sess&&!expired},boot:boot,initLogin:initLogin,submitLogin:submitLogin,login:login,logout:logout,ensureCaptcha:ensureCaptcha,renderCaptcha:renderCaptcha,resetCaptcha:resetCaptcha,captchaToken:captchaToken,once:once,touch:touch,checkSession:checkSession,onLockdown:function(f){hooks.push(f)},onExpired:function(f){expiredCbs.push(f)},onLoggedIn:function(f){loggedInCbs.push(f)},onShowLogin:function(f){showLoginCbs.push(f)}};
})();
