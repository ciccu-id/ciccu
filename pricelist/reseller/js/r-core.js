export const RES={session:null,token:null,catalog:[],cart:[],appFilter:'all',search:'',view:'store'};
try{
var _t=localStorage.getItem('res_tok');
if(_t)RES.token=_t;
}catch(e){}
export function setResToken(t){
RES.token=t||null;
try{
if(t)localStorage.setItem('res_tok',t);
else localStorage.removeItem('res_tok');
}catch(e){}
}
export function ce(tag,cls,text){
var e=document.createElement(tag);
if(cls)e.className=cls;
if(text!==undefined&&text!==null)e.textContent=text;
return e;
}
export function svgI(d,w,h){
w=w||'1.25rem';h=h||'1.25rem';
var NS='http://www.w3.org/2000/svg';
var s=document.createElementNS(NS,'svg');
s.setAttribute('viewBox','0 0 24 24');
s.setAttribute('fill','none');
s.setAttribute('stroke','currentColor');
s.setAttribute('stroke-width','2');
s.setAttribute('stroke-linecap','round');
s.setAttribute('stroke-linejoin','round');
s.setAttribute('width',w);
s.setAttribute('height',h);
var p=document.createElementNS(NS,'path');
p.setAttribute('d',d);
s.appendChild(p);
return s;
}
export function resFmt(n){
n=n||0;
return Number(n).toLocaleString('id-ID');
}
export function resFmtIDR(n){
return'Rp '+resFmt(n);
}
export function resNum(s){
if(!s)return 0;
var str=String(s).toUpperCase().trim();
var m=str.match(/(\d+(?:[.,]\d+)?)\s*K/);
if(m)return Math.round(parseFloat(m[1].replace(',','.'))*1000);
var n=parseFloat(str.replace(/[^0-9.]/g,''));
return isNaN(n)?0:Math.round(n);
}
export function relTime(s){
if(!s)return'';
var t=Date.parse(String(s).replace(' ','T')+'Z');
if(isNaN(t))t=Date.parse(s);
if(isNaN(t))return'';
var diff=Date.now()-t;
if(diff<0)diff=0;
var m=Math.floor(diff/60000);
if(m<1)return'baru saja';
if(m<60)return m+' mnt lalu';
var h=Math.floor(m/60);
if(h<24)return h+' jam lalu';
var d=Math.floor(h/24);
if(d<7)return d+' hari lalu';
return new Date(t).toLocaleDateString('id-ID',{day:'numeric',month:'short',year:'numeric'});
}
export function resToast(msg,isErr){
var t=document.getElementById('resToast');
if(!t){
t=document.createElement('div');
t.id='resToast';
t.className='r-toast';
document.body.appendChild(t);
}
t.textContent=msg;
t.classList.add('show');
if(isErr)t.style.background='#a85555';
else t.style.background='';
clearTimeout(t._tm);
t._tm=setTimeout(function(){t.classList.remove('show')},isErr?5000:2200);
}
const PUBLIC_ENDPOINTS=['/api/reseller/login','/api/reseller/register','/api/reseller/whoami','/api/reseller/ping'];
export async function resApi(url,opts){
opts=opts||{};
var headers=opts.headers||{};
if(opts.body&&typeof opts.body!=='string'){
headers['Content-Type']='application/json';
opts.body=JSON.stringify(opts.body);
}
if(RES.token)headers['x-reseller-token']=RES.token;
opts.headers=headers;
opts.credentials='include';
if(!RES.session&&!RES.token&&url.indexOf('/api/reseller/')===0&&PUBLIC_ENDPOINTS.indexOf(url)<0){
return null;
}
var res=await fetch(url,opts);
var data=null;
try{data=await res.json();}catch(e){}
if(!res.ok){
if(res.status===401){
var had=!!RES.session;
RES.session=null;
setResToken(null);
try{resToast('⚠ 401 di '+url+(had?' (sesi aktif)':'(tanpa sesi)'),true);}catch(e){}
if(had)document.dispatchEvent(new CustomEvent('res:session-expired'));
}
throw new Error((data&&data.error)||('HTTP '+res.status));
}
return data;
}
export function isLoggedIn(){
return!!RES.session;
}
export function resShowView(name){
RES.view=name;
var sv=document.getElementById('resStoreView');
var ov=document.getElementById('resOrdersView');
if(sv)sv.classList.toggle('hidden',name!=='store');
if(ov)ov.classList.toggle('hidden',name!=='orders');
var ns=document.getElementById('resNavStore');
var no=document.getElementById('resNavOrders');
if(ns)ns.classList.toggle('active',name==='store');
if(no)no.classList.toggle('active',name==='orders');
document.dispatchEvent(new CustomEvent('res:view-changed',{detail:{view:name}}));
}
export function cartCount(){
var c=0;
RES.cart.forEach(function(i){c+=i.qty;});
return c;
}
export function cartTotal(){
var t=0;
RES.cart.forEach(function(i){t+=(i.unit||0)*(i.qty||0);});
return t;
}
export function persistCart(){
try{localStorage.setItem('res_cart',JSON.stringify(RES.cart));}catch(e){}
}
export function restoreCart(){
try{
var raw=localStorage.getItem('res_cart');
if(raw){
var arr=JSON.parse(raw);
if(Array.isArray(arr))RES.cart=arr;
}
}catch(e){}
}
