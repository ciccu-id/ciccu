import{RES,setResToken}from'./r-core.js';
var DEFAULT_TIMEOUT_MS=15000;
var CHECKOUT_TIMEOUT_MS=30000;
function timeoutFor(url,opts){
var t=Number(opts&&opts.timeout);
if(t>0)return t;
try{
var u=String(url||'');
if(u.indexOf('/checkout')>=0)return CHECKOUT_TIMEOUT_MS;
}catch(e){}
return DEFAULT_TIMEOUT_MS
}
function isAbortError(e){
return !!(e&&(e.name==='AbortError'||(e.message&&/abort/i.test(String(e.message)))))
}
export async function resApi(url,opts){
opts=opts||{};
var headers=opts.headers||{};
if(opts.body&&typeof opts.body!=='string'){
headers['Content-Type']='application/json';
opts.body=JSON.stringify(opts.body)
}
if(RES.token)headers['x-reseller-token']=RES.token;
opts.headers=headers;
opts.credentials='include';
var tm=timeoutFor(url,opts);
var ctrl=null;
var timer=null;
if(tm>0&&typeof AbortController!=='undefined'&&!opts.signal){
ctrl=new AbortController();
opts.signal=ctrl.signal;
timer=setTimeout(function(){
try{ctrl.abort()}catch(e){}
},tm)
}
try{
var res=await fetch(url,opts);
var data=null;
try{data=await res.json()}catch(e){}
if(!res.ok){
if(res.status===401){
var had=!!RES.session;
RES.session=null;
setResToken(null);
if(had)document.dispatchEvent(new CustomEvent('res:session-expired'))
}
throw new Error((data&&data.error)||('HTTP '+res.status))
}
return data
}catch(e){
if(isAbortError(e)){
throw new Error('Koneksi terlalu lama. Periksa jaringan lalu coba lagi.')
}
throw e
}finally{
if(timer)clearTimeout(timer)
}
}
export function resToast(msg,isErr){
var t=document.getElementById('resToast');
if(!t){
t=document.createElement('div');
t.id='resToast';
t.className='r-toast';
document.body.appendChild(t)
}
t.textContent=msg;
t.classList.add('show');
if(isErr)t.style.background='#a85555';
else t.style.background='';
clearTimeout(t._tm);
t._tm=setTimeout(function(){
t.classList.remove('show')
},isErr?5000:2200)
}
export function isLoggedIn(){return!!RES.session}
