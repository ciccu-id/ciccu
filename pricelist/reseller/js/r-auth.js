import{RES,resApi,resToast,setResToken}from'./r-core.js';
import{clearCart}from'./r-store.js';
const RES_TURNSTILE_SITE_KEY='0x4AAAAAADpiSjv84N_2_kvG';
const tw={login:null,reg:null};
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
function setAuthMode(mode){
authMode=mode;
const lp=document.getElementById('resLoginPane');
const rp=document.getElementById('resRegPane');
const tl=document.getElementById('resTabLogin');
const tr=document.getElementById('resTabReg');
if(lp)lp.classList.toggle('hidden',mode!=='login');
if(rp)rp.classList.toggle('hidden',mode!=='register');
if(tl)tl.classList.toggle('active',mode==='login');
if(tr)tr.classList.toggle('active',mode==='register');
resetTurnstiles();
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
const oldText=btn?btn.textContent:'';
if(btn){btn.textContent='MEMVERIFIKASI...';btn.disabled=true;}
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
if(btn){btn.textContent=oldText||'MASUK KE AKUN';btn.disabled=false;}
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
const oldText=btn?btn.textContent:'';
if(btn){btn.textContent='MENDAFTARKAN...';btn.disabled=true;}
try{
const d=await resApi('/api/reseller/register',{
method:'POST',
body:{name:name,username:username,whatsapp:wa,x_username:xraw,password:pw,token:tk,turnstileResponse:token}
});
resToast(d.message||'Pendaftaran berhasil. Menunggu konfirmasi admin.');
const rf=document.getElementById('resRegForm');
if(rf)rf.reset();
setAuthMode('login');
const lu=document.getElementById('resUsername');
if(lu)lu.value=username;
}catch(err){
resToast(err.message||'Pendaftaran gagal.');
resetTurnstiles();
}finally{
if(btn){btn.textContent=oldText||'DAFTAR SEBAGAI RESELLER';btn.disabled=false;}
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
setAuthMode('login');
document.dispatchEvent(new CustomEvent('res:logged-out'));
}
export function initAuth(){
const form=document.getElementById('resLoginForm');
if(form)form.addEventListener('submit',handleLoginSubmit);
const regForm=document.getElementById('resRegForm');
if(regForm)regForm.addEventListener('submit',handleRegisterSubmit);
const tl=document.getElementById('resTabLogin');
if(tl)tl.addEventListener('click',function(){setAuthMode('login')});
const tr=document.getElementById('resTabReg');
if(tr)tr.addEventListener('click',function(){setAuthMode('register')});
const cta=document.getElementById('resHeroCta');
if(cta)cta.addEventListener('click',function(){setAuthMode('register')});
const ftr=document.getElementById('resFootToReg');
if(ftr)ftr.addEventListener('click',function(){setAuthMode('register')});
const ftl=document.getElementById('resFootToLogin');
if(ftl)ftl.addEventListener('click',function(){setAuthMode('login')});
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
