import{RES,resApi,resToast,setResToken}from'./r-core.js?v=6';
import{clearCart}from'./r-store.js?v=6';
const RES_TURNSTILE_SITE_KEY='0x4AAAAAADpiSjv84N_2_kvG';
const tw={login:null,reg:null};
let authMode='login';
let mqDesktop=null;
function ensureTurnstile(cb){
if(window.turnstile){cb();return;}
let n=0;
const iv=setInterval(function(){
n++;
if(window.turnstile){clearInterval(iv);cb();}
else if(n>40)clearInterval(iv);
},250);
}
function renderTurnstiles(){
const elL=document.getElementById('resTurnstileLogin');
const elR=document.getElementById('resTurnstileReg');
if(!window.turnstile)return;
if(elL){
if(tw.login!==null){try{turnstile.remove(tw.login);}catch(e){}}
tw.login=turnstile.render(elL,{sitekey:RES_TURNSTILE_SITE_KEY});
}
if(elR){
if(tw.reg!==null){try{turnstile.remove(tw.reg);}catch(e){}}
tw.reg=turnstile.render(elR,{sitekey:RES_TURNSTILE_SITE_KEY});
}
}
function getTurnstileToken(which){
const id=which==='reg'?tw.reg:tw.login;
if(window.turnstile&&id!==null){
try{
const t=turnstile.getResponse(id);
if(t)return t;
}catch(e){}
}
return'';
}
function resetTurnstiles(){
if(!window.turnstile)return;
try{if(tw.login!==null)turnstile.reset(tw.login);}catch(e){}
try{if(tw.reg!==null)turnstile.reset(tw.reg);}catch(e){}
}
function vName(v){v=String(v||'').trim();return v.length>=1&&v.length<=30}
function vUsername(v){return/^[a-z0-9_.-]{5,30}$/.test(String(v||'').trim().toLowerCase())}
function vWa(v){return/^08\d{8,18}$/.test(String(v||'').trim())}
function vX(v){return/^[A-Za-z0-9_]{1,15}$/.test(String(v||'').trim().replace(/^@+/,''))}
function vPw(v){const s=String(v||'');return s.length>=8&&s.length<=30}
function setBtnLabel(btn,txt){
if(!btn)return;
const s=btn.querySelector('span');
if(s)s.textContent=txt;
else btn.textContent=txt;
}
function getBtnLabel(btn){
if(!btn)return'';
const s=btn.querySelector('span');
return s?s.textContent:btn.textContent;
}
function activePanel(){
const auth=document.getElementById('auth');
if(!auth)return null;
return auth.classList.contains('register-mode')
?document.querySelector('.register-form')
:document.querySelector('.login-form');
}
function setMode(mode){
const auth=document.getElementById('auth');
const forms=document.getElementById('resForms');
if(!auth)return;
const reg=mode==='register';
authMode=mode;
if(mqDesktop&&mqDesktop.matches&&forms)forms.style.height=forms.offsetHeight+'px';
auth.classList.toggle('register-mode',reg);
const ovTitle=document.getElementById('overlayTitle');
const ovText=document.getElementById('overlayText');
const ovBtn=document.getElementById('resHeroCta');
const ovContent=document.getElementById('overlayContent');
if(ovTitle)ovTitle.textContent=reg?'Selamat Datang Kembali!':'Hello, Reseller!';
if(ovText)ovText.textContent=reg?'Sudah memiliki akun? Masuk kembali untuk melanjutkan ke portal reseller.':'Kelola akun reseller Anda dengan mudah dan nikmati akses ke berbagai fitur yang tersedia.';
if(ovBtn)ovBtn.textContent=reg?'MASUK SEKARANG':'DAFTAR SEKARANG';
if(ovContent){ovContent.classList.remove('swap');void ovContent.offsetWidth;ovContent.classList.add('swap');}
document.querySelectorAll('.seg-btn').forEach(function(b){b.classList.toggle('is-active',b.getAttribute('data-mode')===mode)});
if(mqDesktop&&mqDesktop.matches&&forms){
const panel=activePanel();
const endH=panel?panel.offsetHeight:0;
requestAnimationFrame(function(){requestAnimationFrame(function(){forms.style.height=endH+'px'})});
}
resetTurnstiles();
}
export async function checkSession(){
try{
const me=await resApi('/api/reseller/me');
if(me){RES.session=me;return true;}
RES.session=null;
return false;
}catch(e){
RES.session=null;
return false;
}
}
export function showLoginView(){
const lv=document.getElementById('resLoginView');
const mv=document.getElementById('resMainView');
if(lv)lv.classList.remove('hidden');
if(mv)mv.classList.add('hidden');
ensureTurnstile(renderTurnstiles);
}
export function showMainView(){
const lv=document.getElementById('resLoginView');
const mv=document.getElementById('resMainView');
if(lv)lv.classList.add('hidden');
if(mv)mv.classList.remove('hidden');
const greet=document.getElementById('resUserGreeting');
if(greet&&RES.session){
greet.textContent='Halo, '+(RES.session.display_name||RES.session.username);
}
}
async function handleLoginSubmit(e){
e.preventDefault();
const uEl=document.getElementById('resUsername');
const pEl=document.getElementById('resPassword');
const username=uEl?uEl.value.trim():'';
const password=pEl?pEl.value:'';
if(!username||!password){
resToast('Username dan password wajib diisi.');
return;
}
const token=getTurnstileToken('login');
if(!token){
resToast('Selesaikan verifikasi keamanan terlebih dahulu.');
return;
}
const btn=document.getElementById('resLoginBtn');
const oldText=getBtnLabel(btn);
if(btn){setBtnLabel(btn,'MEMVERIFIKASI…');btn.disabled=true;}
try{
const loginRes=await resApi('/api/reseller/login',{
method:'POST',
body:{username:username,password:password,turnstileResponse:token}
});
if(loginRes&&loginRes.token)setResToken(loginRes.token);
if(loginRes&&loginRes.user){
RES.session=loginRes.user;
}else{
await checkSession();
}
if(!RES.session){
resToast('Login gagal: sesi tidak tersedia.');
resetTurnstiles();
return;
}
showMainView();
resToast('Login berhasil.');
document.dispatchEvent(new CustomEvent('res:logged-in'));
}catch(err){
resToast(err.message||'Login gagal.');
resetTurnstiles();
}finally{
if(btn){setBtnLabel(btn,oldText||'MASUK KE AKUN');btn.disabled=false;}
}
}
async function handleRegisterSubmit(e){
e.preventDefault();
const name=(document.getElementById('regName').value||'').trim();
const username=(document.getElementById('regUsername').value||'').trim().toLowerCase();
const wa=(document.getElementById('regWa').value||'').trim();
const xraw=(document.getElementById('regX').value||'').trim().replace(/^@+/,'');
const pw=document.getElementById('regPassword').value||'';
const tk=(document.getElementById('regToken').value||'').trim();
if(!vName(name)){resToast('Nama wajib diisi (maksimal 30 karakter).');return;}
if(!vUsername(username)){resToast('Username wajib 5-30 karakter (a-z, angka, _ . -).');return;}
if(!vWa(wa)){resToast('WhatsApp wajib angka diawali 08 (maksimal 20 digit).');return;}
if(!vX(xraw)){resToast('Akun X wajib 1-15 karakter tanpa tanda @.');return;}
if(!vPw(pw)){resToast('Password wajib 8-30 karakter.');return;}
if(!tk){resToast('Token pendaftaran wajib diisi.');return;}
const token=getTurnstileToken('reg');
if(!token){
resToast('Selesaikan verifikasi keamanan terlebih dahulu.');
return;
}
const btn=document.getElementById('regSubmitBtn');
const oldText=getBtnLabel(btn);
if(btn){setBtnLabel(btn,'MEMPROSES…');btn.disabled=true;}
try{
const d=await resApi('/api/reseller/register',{
method:'POST',
body:{name:name,username:username,whatsapp:wa,x_username:xraw,password:pw,token:tk,turnstileResponse:token}
});
resToast(d.message||'Pendaftaran berhasil. Menunggu konfirmasi admin.');
const rf=document.getElementById('resRegForm');
if(rf)rf.reset();
setMode('login');
const lu=document.getElementById('resUsername');
if(lu)lu.value=username;
}catch(err){
resToast(err.message||'Pendaftaran gagal.');
resetTurnstiles();
}finally{
if(btn){setBtnLabel(btn,oldText||'DAFTAR SEBAGAI RESELLER');btn.disabled=false;}
}
}
async function handleLogout(){
try{
await resApi('/api/reseller/logout',{method:'POST'});
}catch(e){}
RES.session=null;
setResToken(null);
clearCart();
showLoginView();
setMode('login');
document.dispatchEvent(new CustomEvent('res:logged-out'));
}
function initVisualBehaviors(){
mqDesktop=window.matchMedia('(max-width:960px)');
document.querySelectorAll('#auth [data-mode]').forEach(function(b){
b.addEventListener('click',function(){setMode(b.getAttribute('data-mode'))});
});
const ovBtn=document.getElementById('resHeroCta');
if(ovBtn)ovBtn.addEventListener('click',function(){
const auth=document.getElementById('auth');
setMode(auth&&auth.classList.contains('register-mode')?'login':'register');
});
const forms=document.getElementById('resForms');
if(forms){
forms.addEventListener('transitionend',function(e){
if(e.target===forms&&e.propertyName==='height'&&mqDesktop.matches)forms.style.height='auto';
});
}
if(mqDesktop.addEventListener){
mqDesktop.addEventListener('change',function(){if(forms)forms.style.height=''});
}
window.addEventListener('resize',function(){
if(mqDesktop&&mqDesktop.matches&&forms&&forms.style.height&&forms.style.height!=='auto'){
const panel=activePanel();
if(panel)forms.style.height=panel.offsetHeight+'px';
}
});
document.querySelectorAll('.eye').forEach(function(b){
b.addEventListener('click',function(){
const i=document.getElementById(b.getAttribute('data-target'));
if(!i)return;
const show=i.type==='password';
i.type=show?'text':'password';
b.classList.toggle('showing',show);
});
});
const ix=document.getElementById('regX');
if(ix)ix.addEventListener('input',function(e){e.target.value=e.target.value.replace(/^@+/,'').replace(/\s/g,'')});
const iwa=document.getElementById('regWa');
if(iwa)iwa.addEventListener('input',function(e){e.target.value=e.target.value.replace(/[^\d]/g,'')});
}
export function initAuth(){
initVisualBehaviors();
const form=document.getElementById('resLoginForm');
if(form)form.addEventListener('submit',handleLoginSubmit);
const regForm=document.getElementById('resRegForm');
if(regForm)regForm.addEventListener('submit',handleRegisterSubmit);
const logoutBtn=document.getElementById('resLogoutBtn');
if(logoutBtn)logoutBtn.addEventListener('click',handleLogout);
document.addEventListener('res:session-expired',function(){
RES.session=null;
setResToken(null);
clearCart();
showLoginView();
resToast('Sesi berakhir. Silakan login ulang.');
});
checkSession().then(function(ok){
if(ok){
showMainView();
document.dispatchEvent(new CustomEvent('res:logged-in'));
}else{
showLoginView();
}
});
}
