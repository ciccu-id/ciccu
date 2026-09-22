import{RES,resApi,resToast,setResToken}from'./r-core.js';
import{clearCart}from'./r-store.js';
const RES_TURNSTILE_SITE_KEY='0x4AAAAAADpiSjv84N_2_kvG';
let turnstileWidgetId=null;
let authMode='login';
function ensureTurnstile(cb){
if(window.turnstile){cb();return;}
let n=0;
const iv=setInterval(function(){
n++;
if(window.turnstile){clearInterval(iv);cb();}
else if(n>40)clearInterval(iv);
},250);
}
function renderTurnstile(){
const el=document.getElementById('resTurnstile');
if(!el||!window.turnstile)return;
if(turnstileWidgetId!==null){
try{turnstile.remove(turnstileWidgetId);}catch(e){}
}
turnstileWidgetId=turnstile.render(el,{sitekey:RES_TURNSTILE_SITE_KEY});
}
function getTurnstileToken(){
if(window.turnstile&&turnstileWidgetId!==null){
try{
const t=turnstile.getResponse(turnstileWidgetId);
if(t)return t;
}catch(e){}
}
const el=document.querySelector('#resTurnstile [name="cf-turnstile-response"]');
return el?el.value:'';
}
function resetTurnstile(){
if(window.turnstile&&turnstileWidgetId!==null){
try{turnstile.reset(turnstileWidgetId);}catch(e){}
}
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
ensureTurnstile(renderTurnstile);
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
function setAuthMode(mode){
authMode=mode;
const lf=document.getElementById('resLoginForm');
const rf=document.getElementById('resRegForm');
const sub=document.getElementById('resAuthSub');
const tog=document.getElementById('resToggleAuth');
if(lf)lf.classList.toggle('hidden',mode!=='login');
if(rf)rf.classList.toggle('hidden',mode!=='register');
if(sub)sub.textContent=mode==='login'?'Masuk untuk mengelola toko Anda':'Daftar sebagai reseller dengan token undangan';
if(tog)tog.textContent=mode==='login'?'Punya token? Daftar di sini':'Sudah punya akun? Masuk';
resetTurnstile();
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
const token=getTurnstileToken();
if(!token){
resToast('Selesaikan verifikasi keamanan terlebih dahulu.');
return;
}
const btn=document.getElementById('resLoginBtn');
const oldText=btn?btn.textContent:'';
if(btn){btn.textContent='Memverifikasi...';btn.disabled=true;}
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
resetTurnstile();
return;
}
showMainView();
resToast('Login berhasil.');
document.dispatchEvent(new CustomEvent('res:logged-in'));
}catch(err){
resToast(err.message||'Login gagal.');
resetTurnstile();
}finally{
if(btn){btn.textContent=oldText||'Masuk';btn.disabled=false;}
}
}
async function handleRegisterSubmit(e){
e.preventDefault();
const u=(document.getElementById('regUsername').value||'').trim();
const dn=(document.getElementById('regDisplayName').value||'').trim();
const pw=document.getElementById('regPassword').value||'';
const tk=(document.getElementById('regToken').value||'').trim();
if(!u||!pw||!tk){
resToast('Username, password, dan token wajib diisi.');
return;
}
if(pw.length<8){
resToast('Password minimal 8 karakter.');
return;
}
const token=getTurnstileToken();
if(!token){
resToast('Selesaikan verifikasi keamanan terlebih dahulu.');
return;
}
const btn=document.getElementById('regSubmitBtn');
const oldText=btn?btn.textContent:'';
if(btn){btn.textContent='Mendaftarkan...';btn.disabled=true;}
try{
const d=await resApi('/api/reseller/register',{
method:'POST',
body:{username:u,display_name:dn,password:pw,token:tk,turnstileResponse:token}
});
resToast(d.message||'Pendaftaran berhasil. Menunggu konfirmasi admin.');
const rf=document.getElementById('resRegForm');
if(rf)rf.reset();
setAuthMode('login');
const lu=document.getElementById('resUsername');
if(lu)lu.value=u;
}catch(err){
resToast(err.message||'Pendaftaran gagal.');
resetTurnstile();
}finally{
if(btn){btn.textContent=oldText||'Daftar';btn.disabled=false;}
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
document.dispatchEvent(new CustomEvent('res:logged-out'));
}
export function initAuth(){
const form=document.getElementById('resLoginForm');
if(form)form.addEventListener('submit',handleLoginSubmit);
const regForm=document.getElementById('resRegForm');
if(regForm)regForm.addEventListener('submit',handleRegisterSubmit);
const tog=document.getElementById('resToggleAuth');
if(tog)tog.addEventListener('click',function(){setAuthMode(authMode==='login'?'register':'login')});
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
