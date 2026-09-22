import{getSession,createSession,revokeSession,verifyPassword,isLocked,recordFailure,resetFailures,sessionCookieValue,clearCookieValue,isSecure,randomHex,nowStr,hashNewPassword}from'../../lib/auth-reseller.js';
import{getVariant,listCatalog,countAvailable,createOrder,getOrder,listOrders,listOrderCredentials,appendPayment,audit}from'../../lib/db.js';
import{getProvider}from'../../lib/payment/provider.js';
const SESSION_COOKIE='rsl_sid';
function parseCookiesSafe(request){
const out={};
const header=request.headers.get('cookie')||'';
header.split(';').forEach(function(part){
const i=part.indexOf('=');
if(i>0)out[part.slice(0,i).trim()]=decodeURIComponent(part.slice(i+1).trim());
});
return out;
}
async function verifyTurnstile(token,secret){if(!token)return false;const fd=new FormData();fd.append('secret',secret);fd.append('response',token);const r=await fetch('https://challenges.cloudflare.com/turnstile/v0/siteverify',{method:'POST',body:fd});const o=await r.json();return!!o.success}
function parsePrice(str){if(!str)return 0;const s=String(str).toUpperCase();const n=parseInt(s.replace(/[^0-9]/g,''),10)||0;return s.includes('K')?n*1000:n}
function parseFields(str){if(!str)return{};try{const o=JSON.parse(str);return(o&&typeof o==='object'&&!Array.isArray(o))?o:{}}catch(e){return{}}}
async function sha256hex(s){
const buf=await crypto.subtle.digest('SHA-256',new TextEncoder().encode(s));
return Array.from(new Uint8Array(buf)).map(b=>b.toString(16).padStart(2,'0')).join('');
}
function safeAudit(){
try{
return Promise.resolve(audit.apply(null,arguments)).catch(function(e){console.error('audit failed:',e)});
}catch(e){
console.error('audit failed:',e);
return Promise.resolve();
}
}
function durationMs(str){
if(!str)return 0;
const s=String(str).toLowerCase();
const m=s.match(/(\d+)\s*(hari|day|hr|d|minggu|week|mgg|w|bulan|month|bln|tahun|year|thn|y|jam|hour)?/);
if(!m)return 0;
const n=parseInt(m[1],10);
if(isNaN(n)||n<=0)return 0;
const u=m[2]||'hari';
const DAY=86400000;
if(u==='jam'||u==='hour')return n*3600000;
if(u==='minggu'||u==='week'||u==='mgg'||u==='w')return n*7*DAY;
if(u==='bulan'||u==='month'||u==='bln')return n*30*DAY;
if(u==='tahun'||u==='year'||u==='thn'||u==='y')return n*365*DAY;
return n*DAY;
}
function isoToUTC(s){if(!s)return null;const t=Date.parse(String(s).replace(' ','T')+'Z');return isNaN(t)?null:t}
function addMsToIso(iso,ms){const base=isoToUTC(iso);if(base===null)return null;return new Date(base+ms).toISOString().replace('T',' ').slice(0,19)}
const json=(d,s=200,h={})=>new Response(JSON.stringify(d),{status:s,headers:{'Content-Type':'application/json','Cache-Control':'no-store',...h}});
const err=(m,s=500)=>json({error:m},s);
async function body(request){const cl=parseInt(request.headers.get('content-length')||'0',10);if(cl>200000)return null;try{return await request.json()}catch(e){return null}}
export async function onRequest(context){
const{request,env}=context;
const m=request.method;
const p=new URL(request.url).pathname.replace(/^\/api\/reseller/,'')||'/';
if(m==='OPTIONS')return new Response(null,{status:405});
const ip=request.headers.get('cf-connecting-ip')||'';
if(p==='/ping'&&m==='GET')return json({ok:true,route:'reseller',v:'res-6-headertoken'});
if(p==='/whoami'&&m==='GET'){
const viaHeader=!!(request.headers.get('x-reseller-token')||'');
const viaCookie=!!parseCookiesSafe(request)[SESSION_COOKIE];
const token=(request.headers.get('x-reseller-token')||'')||parseCookiesSafe(request)[SESSION_COOKIE];
if(!token)return json({cookie:viaCookie,header:viaHeader,session:false,reason:'token-tidak-ada'});
const th=await sha256hex(token);
const row=await env.DB.prepare('SELECT s.id AS sid,s.expires_at,s.revoked_at,r.id AS rid,r.username,r.display_name,r.status FROM rsl_sessions s JOIN rsl_resellers r ON r.id=s.reseller_id WHERE s.token_hash=?').bind(th).first();
if(!row)return json({cookie:viaCookie,header:viaHeader,session:false,reason:'baris-sesi-tidak-ketemu'});
return json({cookie:viaCookie,header:viaHeader,session:true,username:row.username,display_name:row.display_name,status:row.status,revoked_at:row.revoked_at,expires_at:row.expires_at,now:nowStr()});
}
try{
if(p==='/register'&&m==='POST'){
const b=await body(request)||{};
const username=String(b.username||'').trim().toLowerCase().slice(0,50);
const password=String(b.password||'').slice(0,200);
const dn=String(b.display_name||'').trim().slice(0,100);
const token=String(b.token||'').trim().toUpperCase();
if(!/^[a-z0-9_.-]{3,50}$/.test(username))return err('Username tidak valid (3-50 karakter: a-z, angka, _ . -)',400);
if(password.length<8)return err('Password minimal 8 karakter',400);
if(!token)return err('Token pendaftaran wajib diisi',400);
if(!await verifyTurnstile(b.turnstileResponse,env.TURNSTILE_SECRET))return err('Verifikasi keamanan tidak valid',400);
await env.DB.prepare('DELETE FROM rsl_reg_tokens WHERE expires_at<=?').bind(nowStr()).run();
const hash=await sha256hex(token);
const row=await env.DB.prepare('SELECT id,expires_at FROM rsl_reg_tokens WHERE token_hash=?').bind(hash).first();
if(!row||row.expires_at<=nowStr())return err('Token tidak valid atau telah kedaluwarsa',404);
const ex=await env.DB.prepare('SELECT id FROM rsl_resellers WHERE username=?').bind(username).first();
if(ex)return err('Username sudah dipakai',400);
const h=await hashNewPassword(password);
const ins=await env.DB.prepare("INSERT INTO rsl_resellers(username,pass_hash,pass_salt,pass_iter,display_name,status) VALUES(?,?,?,?,?,'pending')").bind(username,h.hash,h.salt,h.iter,dn||username).run();
await env.DB.prepare('DELETE FROM rsl_reg_tokens WHERE id=?').bind(row.id).run();
const newId=ins.meta?ins.meta.last_row_id:null;
await safeAudit(env,'guest',newId,'reseller.register','reseller',newId,{username:username},ip);
return json({success:true,status:'pending',message:'Pendaftaran berhasil. Akun menunggu konfirmasi admin.'},201);
}
if(p==='/login'&&m==='POST'){
const b=await body(request)||{};
const username=String(b.username||'').trim().slice(0,50);
const password=String(b.password||'').slice(0,200);
if(!username||!password)return err('Username dan password wajib diisi',400);
if(!await verifyTurnstile(b.turnstileResponse,env.TURNSTILE_SECRET))return err('Verifikasi keamanan tidak valid',400);
const r=await env.DB.prepare('SELECT * FROM rsl_resellers WHERE username=?').bind(username).first();
if(!r){await safeAudit(env,'reseller',null,'login.fail',null,null,{username:username},ip);return err('Username atau password salah',401)}
if(isLocked(r))return err('Akun terkunci sementara. Coba lagi nanti',423);
const ok=await verifyPassword(password,r);
if(!ok){await recordFailure(env,r.id);await safeAudit(env,'reseller',r.id,'login.fail',null,null,{username:username},ip);return err('Username atau password salah',401)}
await resetFailures(env,r.id);
if(r.status==='pending'){await safeAudit(env,'reseller',r.id,'login.pending',null,null,{},ip);return err('Akun Anda masih menunggu konfirmasi admin.',403)}
if(r.status==='suspended'){await safeAudit(env,'reseller',r.id,'login.suspended',null,null,{},ip);return err('Akun Anda dinonaktifkan. Hubungi admin.',403)}
const token=await createSession(env,r,request);
await safeAudit(env,'reseller',r.id,'login.ok',null,null,{},ip);
return json({success:true,token:token,user:{id:r.id,username:r.username,display_name:r.display_name}},200,{'Set-Cookie':sessionCookieValue(token,isSecure(request))});
}
const session=await getSession(env,request);
if(p==='/logout'&&m==='POST'){
if(session)await safeAudit(env,'reseller',session.id,'logout',null,null,{},ip);
await revokeSession(env,request);
return json({success:true},200,{'Set-Cookie':clearCookieValue(isSecure(request))});
}
if(!session)return err('Sesi tidak valid. Silakan login',401);
if(p==='/me'&&m==='GET')return json({id:session.id,username:session.username,display_name:session.display_name});
if(p==='/catalog'&&m==='GET'){
const rows=await listCatalog(env);
return json(rows);
}
if(p==='/checkout'&&m==='POST'){
const b=await body(request)||{};
const raw=Array.isArray(b.items)?b.items:[];
if(!raw.length||raw.length>50)return err('Item tidak valid',400);
const lines=[];let total=0;
for(const it of raw){
const vid=parseInt(it.variant_id,10);const qty=parseInt(it.qty,10);
if(isNaN(vid)||isNaN(qty)||qty<1||qty>99)return err('Qty tidak valid',400);
const v=await getVariant(env,vid);
if(!v||String(v.status).toLowerCase()!=='ready')return err('Varian tidak tersedia',400);
const unit=parsePrice(v.price);
if(unit<=0)return err('Harga tidak valid',400);
const avail=await countAvailable(env,vid);
if(avail<qty)return err('Stok tidak cukup untuk '+v.app_name+' '+v.category+' '+v.duration,400);
lines.push({variant_id:vid,app_name:v.app_name,category:v.category,duration:v.duration,qty:qty,unit_price:unit});
total+=unit*qty;
}
const idem=String(b.idempotency_key||'').slice(0,128)||randomHex(16);
const ex=await env.DB.prepare('SELECT id FROM rsl_orders WHERE idempotency_key=?').bind(idem).first();
if(ex){const o=await getOrder(env,ex.id,session.id);return json({order_id:ex.id,total:o?o.total_amount:0,status:o?o.status:'',reused:true})}
const prov=getProvider(env);
const orderId=await createOrder(env,session.id,lines,total,prov.name,idem);
await appendPayment(env,orderId,prov.name,'','pending',total,'created');
const cr=await prov.createPayment(env,{id:orderId,total_amount:total},lines);
await safeAudit(env,'reseller',session.id,'checkout','order',orderId,{total:total,items:lines.length},ip);
return json({order_id:orderId,total:total,provider:prov.name,instruction:cr.instruction||null},201);
}
if(p==='/orders'&&m==='GET'){
const u=new URL(request.url);
const rows=await listOrders(env,session.id,u.searchParams.get('limit'),u.searchParams.get('offset'));
if(rows&&rows.length){
const ids=rows.map(o=>o.id);
const it=await env.DB.prepare(`SELECT order_id,duration FROM rsl_order_items WHERE order_id IN (${ids.map(()=>'?').join(',')})`).bind(...ids).all();
const minMs={};
it.results.forEach(r=>{const ms=durationMs(r.duration);if(ms>0&&(minMs[r.order_id]===undefined||ms<minMs[r.order_id]))minMs[r.order_id]=ms});
rows.forEach(o=>{
if(o.status==='delivered'&&o.delivered_at&&minMs[o.id]!==undefined)o.expires_at=addMsToIso(o.delivered_at,minMs[o.id]);
else o.expires_at=null;
});
}
return json(rows);
}
const om=p.match(/^\/orders\/(\d+)(\/(reveal|status))?$/);
if(om&&m==='GET'&&om[3]==='status'){
const o=await getOrder(env,parseInt(om[1],10),session.id);
if(!o)return err('Order tidak ditemukan',404);
return json({status:o.status,paid_at:o.paid_at,delivered_at:o.delivered_at});
}
if(om&&m==='GET'&&!om[3]){
const o=await getOrder(env,parseInt(om[1],10),session.id);
if(!o)return err('Order tidak ditemukan',404);
if(o.delivered_at&&o.items){
o.items.forEach(function(it){const ms=durationMs(it.duration);it.expires_at=ms>0?addMsToIso(o.delivered_at,ms):null});
}
return json(o);
}
if(om&&m==='POST'&&om[3]==='reveal'){
const id=parseInt(om[1],10);
const o=await getOrder(env,id,session.id);
if(!o)return err('Order tidak ditemukan',404);
if(o.status!=='delivered')return err('Data belum tersedia',409);
const rows=await listOrderCredentials(env,id);
const groups={};
rows.forEach(r=>{
if(!groups[r.order_item_id])groups[r.order_item_id]={order_item_id:r.order_item_id,app_name:r.app_name,category:r.category,duration:r.duration,qty:r.qty,credentials:[]};
if(r.stock_id&&r.fields)groups[r.order_item_id].credentials.push({stock_id:r.stock_id,fields:parseFields(r.fields)});
});
await safeAudit(env,'reseller',session.id,'credentials.reveal','order',id,{items:Object.keys(groups).length},ip);
return json(Object.keys(groups).map(k=>groups[k]));
}
return err('Endpoint tidak ditemukan',404);
}catch(e){
console.error('Reseller API error:',e);
return err('Terjadi kesalahan di server.',500);
}
}
