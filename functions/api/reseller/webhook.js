import{getProvider}from'../../lib/payment/provider.js';
import{markPaymentSettle,markPaymentFailed}from'../../lib/fulfillment.js';
import{audit}from'../../lib/db.js';
const json=(d,s=200)=>new Response(JSON.stringify(d),{status:s,headers:{'Content-Type':'application/json','Cache-Control':'no-store'}});
export async function onRequest(context){
const{request,env}=context;
if(request.method!=='POST')return json({error:'method not allowed'},405);
const cl=parseInt(request.headers.get('content-length')||'0',10);
if(cl>500000)return json({error:'payload too large'},413);
let b=null;
try{b=await request.json()}catch(e){try{const f=await request.formData();b=Object.fromEntries(f.entries())}catch(e2){b=null}}
if(!b||typeof b!=='object')return json({error:'bad payload'},400);
const ref=String(b.order_id||b.orderid||b.reference||b.order_ref||b.transaction_id||'').slice(0,128);
if(!ref)return json({ignored:true});
let order=await env.DB.prepare('SELECT * FROM rsl_orders WHERE provider_ref=?').bind(ref).first();
if(!order){const nid=parseInt(ref,10);if(!isNaN(nid))order=await env.DB.prepare('SELECT * FROM rsl_orders WHERE id=?').bind(nid).first()}
if(!order)return json({ignored:true,reason:'unknown_order'});
if(order.status!=='pending_payment')return json({ignored:true,reason:'state'});
const prov=getProvider(env);
const v=await prov.verifyPayment(env,order);
const gross=order.total_amount;
const rawStr=JSON.stringify(v.raw||v.status||'').slice(0,500);
if(v.status==='settle'||v.status==='capture'){
const r=await markPaymentSettle(env,order.id,prov.name,v.txId,gross,rawStr);
await audit(env,'system',null,'webhook.settle','order',order.id,r,'');
return json({ok:true});
}
if(v.status==='deny'||v.status==='expire'||v.status==='cancel'){
const r=await markPaymentFailed(env,order.id,prov.name,v.txId,v.status,gross,rawStr);
await audit(env,'system',null,'webhook.fail','order',order.id,r,'');
return json({ok:true});
}
await audit(env,'system',null,'webhook.pending','order',order.id,{status:v.status},'');
return json({ok:true,pending:true});
}
