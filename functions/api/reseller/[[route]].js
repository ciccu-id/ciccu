import{getSession,createSession,revokeSession,verifyPassword,isLocked,recordFailure,resetFailures,sessionCookieValue,clearCookieValue,isSecure,randomHex}from'../../lib/auth-reseller.js';
import{getVariant,listCatalog,countAvailable,createOrder,getOrder,listOrders,listOrderCredentials,appendPayment,audit}from'../../lib/db.js';
import{getProvider}from'../../lib/payment/provider.js';
async function verifyTurnstile(token,secret){if(!token)return false;const fd=new FormData();fd.append('secret',secret);fd.append('response',token);const r=await fetch('https://challenges.cloudflare.com/turnstile/v0/siteverify',{method:'POST',body:fd});const o=await r.json();return!!o.success}
function parsePrice(str){if(!str)return 0;const s=String(str).toUpperCase();const n=parseInt(s.replace(/[^0-9]/g,''),10)||0;return s.includes('K')?n*1000:n}
function parseFields(str){if(!str)return{};try{const o=JSON.parse(str);return(o&&typeof o==='object'&&!Array.isArray(o))?o:{}}catch(e){return{}}}
const json=(d,s=200,h={})=>new Response(JSON.stringify(d),{status:s,headers:{'Content-Type':'application/json','Cache-Control':'no-store',...h}});
const err=(m,s=500)=>json({error:m},s);
async function body(request){const cl=parseInt(request.headers.get('content-length')||'0',10);if(cl>200000)return null;try{return await request.json()}catch(e){return null}}
export async function onRequest(context){
const{request,env}=context;
const m=request.method;
const p=new URL(request.url).pathname.replace(/^\/api\/reseller/,'')||'/';
if(m==='OPTIONS')return new Response(null,{status:405});
const ip=request.headers.get('cf-connecting-ip')||'';
try{
if(p==='/login'&&m==='POST'){
const b=await body(request)||{};
const username=String(b.username||'').trim().slice(0,50);
const password=String(b.password||'').slice(0,200);
if(!username||!password)return err('Username dan password wajib diisi',400);
if(!await verifyTurnstile(b.turnstileResponse,env.TURNSTILE_SECRET))return err('Verifikasi keamanan tidak valid',400);
const r=await env.DB.prepare('SELECT * FROM rsl_resellers WHERE username=?').bind(username).first();
if(!r){await audit(env,'reseller',null,'login.fail',null,null,{username},ip);return err('Username atau password salah',401)}
if(isLocked(r))return err('Akun terkunci sementara. Coba lagi nanti',423);
const ok=await verifyPassword(password,r);
if(!ok){await recordFailure(env,r.id);await audit(env,'reseller',r.id,'login.fail',null,null,{username},ip);return err('Username atau password salah',401)}
await resetFailures(env,r.id);
const token=await createSession(env,r,request);
await audit(env,'reseller',r.id,'login.ok',null,null,{},ip);
return json({success:true},200,{'Set-Cookie':sessionCookieValue(token,isSecure(request))});
}
const session=await getSession(env,request);
if(p==='/logout'&&m==='POST'){
if(session)await audit(env,'reseller',session.id,'logout',null,null,{},ip);
await revokeSession(env,request);
return json({success:true},200,{'Set-Cookie':clearCookieValue(isSecure(request))});
}
if(!session)return err('Sesi tidak valid. Silakan login',401);
if(p==='/me'&&m==='GET')return json({id:session.id,username:session.username,display_name:session.display_name});
if(p==='/catalog'&&m==='GET'){
const rows=await listCatalog(env);
return json(rows.filter(r=>r.reseller_price!==''));
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
const pr=await env.DB.prepare('SELECT reseller_price FROM rsl_prices WHERE variant_id=?').bind(vid).first();
if(!pr)return err('Harga reseller belum diatur untuk '+v.app_name,400);
const unit=parsePrice(pr.reseller_price);
if(unit<=0)return err('Harga reseller tidak valid',400);
const avail=await countAvailable(env,vid);
if(avail<qty)return err('Stok tidak cukup untuk '+v.app_name+' '+v.category+' '+v.duration,400);
lines.push({variant_id:vid,app_name:v.app_name,category:v.category,duration:v.duration,qty,unit_price:unit});
total+=unit*qty;
}
const idem=String(b.idempotency_key||'').slice(0,128)||randomHex(16);
const ex=await env.DB.prepare('SELECT id FROM rsl_orders WHERE idempotency_key=?').bind(idem).first();
if(ex){const o=await getOrder(env,ex.id,session.id);return json({order_id:ex.id,total:o?o.total_amount:0,status:o?o.status:'',reused:true})}
const prov=getProvider(env);
const orderId=await createOrder(env,session.id,lines,total,prov.name,idem);
await appendPayment(env,orderId,prov.name,'','pending',total,'created');
const cr=await prov.createPayment(env,{id:orderId,total_amount:total},lines);
await audit(env,'reseller',session.id,'checkout','order',orderId,{total,items:lines.length},ip);
return json({order_id:orderId,total,provider:prov.name,instruction:cr.instruction||null},201);
}
if(p==='/orders'&&m==='GET'){
const u=new URL(request.url);
const rows=await listOrders(env,session.id,u.searchParams.get('limit'),u.searchParams.get('offset'));
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
await audit(env,'reseller',session.id,'credentials.reveal','order',id,{items:Object.keys(groups).length},ip);
return json(Object.keys(groups).map(k=>groups[k]));
}
return err('Endpoint tidak ditemukan',404);
}catch(e){
console.error('Reseller API error:',e);
return err('Terjadi kesalahan di server.',500);
}
}

