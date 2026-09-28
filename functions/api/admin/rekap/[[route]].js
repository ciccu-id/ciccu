import{getAdminSession}from'../../../lib/auth-admin.js';
const corsHeaders={'Access-Control-Allow-Origin':'https://ciccu.biz.id','Access-Control-Allow-Methods':'GET, OPTIONS','Access-Control-Allow-Headers':'Content-Type'};
function json(d,s=200){return new Response(JSON.stringify(d),{status:s,headers:{...corsHeaders,'Content-Type':'application/json','Cache-Control':'no-store'}})}
function err(m,s=500){return json({error:m},s)}
function clampInt(v,d,m){const n=parseInt(v,10);if(isNaN(n))return d;return Math.max(0,Math.min(m,n))}
function rangeFilter(col,range){
if(range==='today')return{sql:`DATE(${col})=DATE('now')`,args:[]};
if(range==='7d')return{sql:`${col}>=datetime('now','-7 days')`,args:[]};
if(range==='30d')return{sql:`${col}>=datetime('now','-30 days')`,args:[]};
return{sql:'',args:[]};
}
function pushRange(where,args,col,range){const f=rangeFilter(col,range);if(f.sql){where.push(f.sql);for(const a of f.args)args.push(a)}}
function pushLike(where,args,fields,q){
if(!q)return;
const like='%'+q+'%';
const parts=[];
for(const f of fields)parts.push(f+' LIKE ?');
where.push('('+parts.join(' OR ')+')');
for(let i=0;i<fields.length;i++)args.push(like);
}
export async function onRequest(context){
const{request,env}=context;
const url=new URL(request.url);
const p=url.pathname.replace(/^\/api\/admin\/rekap/,'')||'/';
const m=request.method;
if(m==='OPTIONS')return new Response(null,{headers:corsHeaders});
if(m!=='GET')return err('method not allowed',405);
try{
const session=await getAdminSession(env,request);
if(!session)return err('Sesi admin tidak valid. Silakan masuk kembali.',403);
const limit=clampInt(url.searchParams.get('limit'),50,200);
const offset=clampInt(url.searchParams.get('offset'),0,100000);
const q=String(url.searchParams.get('q')||'').trim();
const range=String(url.searchParams.get('range')||'');
const status=String(url.searchParams.get('status')||'');
const actorType=String(url.searchParams.get('actor_type')||'');
const action=String(url.searchParams.get('action')||'');
const entityType=String(url.searchParams.get('entity_type')||'');
if(p==='/stock-summary'){
const r=await env.DB.prepare("SELECT p.app_name AS app_name,COUNT(DISTINCT p.id) AS variants,COALESCE(SUM(CASE WHEN s.status='available' THEN 1 ELSE 0 END),0) AS available,COALESCE(SUM(CASE WHEN s.status='reserved' THEN 1 ELSE 0 END),0) AS reserved,COALESCE(SUM(CASE WHEN s.status='sold' THEN 1 ELSE 0 END),0) AS sold,COALESCE(SUM(CASE WHEN s.status='disabled' THEN 1 ELSE 0 END),0) AS disabled FROM rsl_pricelist p LEFT JOIN rsl_stock_items s ON s.variant_id=p.id GROUP BY p.app_name ORDER BY p.app_name").all();
return json(r.results);
}
if(p==='/sold'){
const where=["s.status='sold'"];
const args=[];
pushLike(where,args,['o.order_code','r.username','r.display_name','oi.app_name','oi.category','oi.duration'],q);
pushRange(where,args,'s.sold_at',range);
const sql=`SELECT s.id AS stock_id,s.variant_id,s.sold_at,s.buyer_note,oi.id AS order_item_id,oi.app_name,oi.category,oi.duration,oi.qty,o.id AS order_id,o.order_code,o.status AS order_status,o.total_amount,r.username,r.display_name FROM rsl_stock_items s JOIN rsl_order_items oi ON oi.id=s.order_item_id JOIN rsl_orders o ON o.id=oi.order_id LEFT JOIN rsl_resellers r ON r.id=o.reseller_id WHERE ${where.join(' AND ')} ORDER BY s.sold_at DESC,s.id DESC LIMIT ? OFFSET ?`;
args.push(limit,offset);
const r=await env.DB.prepare(sql).bind(...args).all();
return json(r.results);
}
if(p==='/payments'){
const where=['1=1'];
const args=[];
if(status){where.push('py.status=?');args.push(status)}
pushLike(where,args,['o.order_code','r.username','r.display_name','py.provider_tx_id','py.raw_status'],q);
pushRange(where,args,'py.created_at',range);
const sql=`SELECT py.id,py.order_id,py.provider,py.provider_tx_id,py.status,py.gross_amount,py.raw_status,py.created_at,o.order_code,o.total_amount,o.status AS order_status,r.username,r.display_name FROM rsl_payments py JOIN rsl_orders o ON o.id=py.order_id LEFT JOIN rsl_resellers r ON r.id=o.reseller_id WHERE ${where.join(' AND ')} ORDER BY py.id DESC LIMIT ? OFFSET ?`;
args.push(limit,offset);
const r=await env.DB.prepare(sql).bind(...args).all();
return json(r.results);
}
if(p==='/finance-summary'){
const where=[];
const args=[];
pushRange(where,args,'py.created_at',range);
const sql=`SELECT py.status,COUNT(*) AS count,COALESCE(SUM(py.gross_amount),0) AS total FROM rsl_payments py ${where.length?'WHERE '+where.join(' AND '):''} GROUP BY py.status ORDER BY py.status`;
const r=await env.DB.prepare(sql).bind(...args).all();
let settle=0,refund=0,pending=0,other=0;
for(const row of r.results){
const n=Number(row.total||0);
if(row.status==='settle')settle+=n;
else if(row.status==='refund')refund+=n;
else if(row.status==='pending'||row.status==='created')pending+=n;
else other+=n;
}
return json({rows:r.results,settle,refund,net:settle-refund,pending,other});
}
if(p==='/audit'){
const where=['1=1'];
const args=[];
if(actorType){where.push('actor_type=?');args.push(actorType)}
if(action){where.push('action LIKE ?');args.push('%'+action+'%')}
if(entityType){where.push('entity_type=?');args.push(entityType)}
pushLike(where,args,['action','meta','ip','entity_type'],q);
pushRange(where,args,'created_at',range);
const sql=`SELECT id,actor_type,actor_id,action,entity_type,entity_id,meta,ip,created_at FROM rsl_audit WHERE ${where.join(' AND ')} ORDER BY id DESC LIMIT ? OFFSET ?`;
args.push(limit,offset);
const r=await env.DB.prepare(sql).bind(...args).all();
return json(r.results);
}
if(p==='/revisions'){
const where=['1=1'];
const args=[];
pushLike(where,args,['o.order_code','r.username','r.display_name','oi.app_name','oi.category','oi.duration','rv.note','rv.created_by'],q);
pushRange(where,args,'rv.created_at',range);
const sql=`SELECT rv.id,rv.order_item_id,rv.note,rv.created_by,rv.created_at,oi.app_name,oi.category,oi.duration,oi.qty,o.id AS order_id,o.order_code,r.username,r.display_name FROM rsl_order_revisions rv JOIN rsl_order_items oi ON oi.id=rv.order_item_id JOIN rsl_orders o ON o.id=oi.order_id LEFT JOIN rsl_resellers r ON r.id=o.reseller_id WHERE ${where.join(' AND ')} ORDER BY rv.id DESC LIMIT ? OFFSET ?`;
args.push(limit,offset);
const r=await env.DB.prepare(sql).bind(...args).all();
return json(r.results);
}
return err('Endpoint tidak ditemukan',404);
}catch(e){
console.error('Rekap API error:',e);
return err('Terjadi kesalahan di server.',500);
}
}
