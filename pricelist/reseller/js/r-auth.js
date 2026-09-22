import{RES,resApi,resToast}from'./r-core.js';
import{clearCart}from'./r-store.js';
const RES_TURNSTILE_SITE_KEY='0x4AAAAAADpiSjv84N_2_kvG';
let turnstileWidgetId=null;
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
RES.session=me;
return true;
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
await resApi('/api/reseller/login',{
method:'POST',
body:{username:username,password:password,turnstileResponse:token}
});
await checkSession();
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
async function handleLogout(){
try{
await resApi('/api/reseller/logout',{method:'POST'});
}catch(e){}
RES.session=null;
clearCart();
showLoginView();
document.dispatchEvent(new CustomEvent('res:logged-out'));
}
export function initAuth(){
const form=document.getElementById('resLoginForm');
if(form)form.addEventListener('submit',handleLoginSubmit);
const logoutBtn=document.getElementById('resLogoutBtn');
if(logoutBtn)logoutBtn.addEventListener('click',handleLogout);
document.addEventListener('res:session-expired',function(){
RES.session=null;
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
