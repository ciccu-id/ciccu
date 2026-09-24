import{listStock,countAvailable}from'../lib/db.js';
export async function onRequest(context){
const{request,env}=context;
const url=new URL(request.url);
const pass=url.searchParams.get('pass')||'';
if(!env.ADMIN_PASSWORD||pass!==env.ADMIN_PASSWORD)return new Response('Unauthorized',{status:403,headers:{'Content-Type':'text/plain'}});
let id=parseInt(url.searchParams.get('id')||'0',10);
const out={variantId:id};
try{
if(!id){
const first=await env.DB.prepare('SELECT id FROM rsl_pricelist ORDER BY id LIMIT 1').first();
if(!first){out.note='Tidak ada varian di rsl_pricelist sama sekali.';return new Response(JSON.stringify(out,null,2),{headers:{'Content-Type':'application/json'}})}
id=first.id;out.variantId=id;out.note='id tidak diberikan, memakai varian pertama.';
}
}catch(e){out.variantLookupError=String(e&&e.message||e);return new Response(JSON.stringify(out,null,2),{headers:{'Content-Type':'application/json'}})}
try{const v=await env.DB.prepare('SELECT id,app_name,category,duration FROM rsl_pricelist WHERE id=?').bind(id).first();out.variant=v||null}catch(e){out.variantError=String(e&&e.message||e)}
try{out.countAvailable=await countAvailable(env,id);out.countAvailableOk=true}catch(e){out.countAvailableOk=false;out.countAvailableError=String(e&&e.message||e)}
try{out.listStock=await listStock(env,id,null,100,0);out.listStockOk=true}catch(e){out.listStockOk=false;out.listStockError=String(e&&e.message||e)}
try{const raw=await env.DB.prepare('SELECT * FROM rsl_stock_items WHERE variant_id=? ORDER BY id DESC LIMIT 3').bind(id).all();out.sampleRows=raw.results;out.sampleOk=true}catch(e){out.sampleOk=false;out.sampleError=String(e&&e.message||e)}
return new Response(JSON.stringify(out,null,2),{headers:{'Content-Type':'application/json'}});
}
