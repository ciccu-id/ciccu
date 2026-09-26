import{nowStr}from'./auth-reseller.js';
function clampInt(v,d,m){const n=parseInt(v,10);if(isNaN(n))return d;return Math.max(0,Math.min(m,n))}
async function generateOrderCode(env){
const alphabet='0123456789';
for(let attempt=0;attempt<10;attempt++){
const arr=new Uint8Array(6);
crypto.getRandomValues(arr);
let code='CICCU-';
for(let i=0;i<6;i++)code+=alphabet[arr[i]%10];
const ex=await env.DB.prepare('SELECT 1 FROM rsl_orders WHERE order_code=?').bind(code).first();
if(!ex)return code;
}
throw new Error('Gagal membuat kode order unik setelah 10 percobaan');
}
export async function getVariant(env,id){return env.DB.prepare('SELECT id,app_name,category,duration,price,status,notes,flash_price,flash_sort_order FROM rsl_pricelist WHERE id=?').bind(id).first()}
export async function listCatalog(env){
const r=await env.DB.prepare("SELECT p.id,p.app_name,p.category,p.duration,p.price,p.status,p.notes,p.sort_order,p.app_sort_order,p.flash_price,p.flash_sort_order,(SELECT COUNT(*) FROM rsl_stock_items s WHERE s.variant_id=p.id AND s.status='available') AS stock_available,f.form_fields FROM rsl_pricelist p LEFT JOIN app_forms f ON p.app_name=f.app_name ORDER BY COALESCE(p.app_sort_order,9999),COALESCE(p.sort_order,9999),p.id").all();
return r.results;
}
export async function createVariant(env,data){
const r=await env.DB.prepare('INSERT INTO rsl_pricelist(app_name,category,duration,price,status,notes,sort_order,app_sort_order,flash_price,flash_sort_order) VALUES(?,?,?,?,?,?,?,?,?,?)').bind(data.app_name,data.category,data.duration,data.price,data.status||'Ready',data.notes||'',data.sort_order||9999,data.app_sort_order||9999,data.flash_price||'',data.flash_sort_order||9999).run();
return r.meta.last_row_id;
}
export async function updateVariant(env,id,data){
await env.DB.prepare('UPDATE rsl_pricelist SET app_name=?,category=?,duration=?,price=?,status=?,notes=?,sort_order=?,app_sort_order=?,flash_price=?,flash_sort_order=? WHERE id=?').bind(data.app_name,data.category,data.duration,data.price,data.status,data.notes||'',data.sort_order||9999,data.app_sort_order||9999,data.flash_price||'',data.flash_sort_order||9999,id).run();
}
export async function deleteVariant(env,id){
await env.DB.prepare('DELETE FROM rsl_stock_items WHERE variant_id=? AND status=?').bind(id,'available').run();
await env.DB.prepare('DELETE FROM rsl_pricelist WHERE id=?').bind(id).run();
}
export async function getTemplate(env,appName){return env.DB.prepare('SELECT fields FROM rsl_cred_templates WHERE app_name=?').bind(appName).first()}
export async function setTemplate(env,appName,fieldsArr){await env.DB.prepare('INSERT INTO rsl_cred_templates(app_name,fields,updated_at) VALUES(?,?,?) ON CONFLICT(app_name) DO UPDATE SET fields=excluded.fields,updated_at=excluded.updated_at').bind(appName,JSON.stringify(fieldsArr),nowStr()).run()}
export async function countAvailable(env,variantId){
const r=await env.DB.prepare("SELECT COUNT(*) AS c FROM rsl_stock_items WHERE variant_id=? AND status='available'").bind(variantId).first();
return r?r.c:0;
}
export async function listStock(env,variantId,status,limit,offset){
const lim=clampInt(limit,50,200),off=clampInt(offset,0,100000);
if(!status||status===''){
const r=await env.DB.prepare('SELECT * FROM rsl_stock_items WHERE variant_id=? ORDER BY id DESC LIMIT ? OFFSET ?').bind(variantId,lim,off).all();
return r.results;
}
const r=await env.DB.prepare('SELECT * FROM rsl_stock_items WHERE variant_id=? AND status=? ORDER BY id DESC LIMIT ? OFFSET ?').bind(variantId,status,lim,off).all();
return r.results;
}
export async function addStock(env,variantId,fieldsObj,buyerNote){
const r=await env.DB.prepare("INSERT INTO rsl_stock_items(variant_id,fields,status,buyer_note) VALUES(?,?, 'available',?)").bind(variantId,JSON.stringify(fieldsObj),String(buyerNote||'').slice(0,500)).run();
return r.meta.last_row_id;
}
export async function addStockBulk(env,variantId,arr){
const stmts=arr.map(f=>env.DB.prepare("INSERT INTO rsl_stock_items(variant_id,fields,status) VALUES(?,?,'available')").bind(variantId,JSON.stringify(f)));
if(!stmts.length)return 0;
const res=await env.DB.batch(stmts);
return res.length;
}
export async function updateStockFields(env,id,fieldsObj,buyerNote){
await env.DB.prepare("UPDATE rsl_stock_items SET fields=?,buyer_note=? WHERE id=? AND status IN ('available','disabled')").bind(JSON.stringify(fieldsObj),String(buyerNote||'').slice(0,500),id).run();
}
export async function disableStock(env,id){
await env.DB.prepare("UPDATE rsl_stock_items SET status='disabled' WHERE id=? AND status='available'").bind(id).run();
}
export async function deleteAvailableStock(env,id){
await env.DB.prepare("DELETE FROM rsl_stock_items WHERE id=? AND status='available'").bind(id).run();
}
export async function createOrder(env,resellerId,lines,total,provider,idemKey){
const existing=await env.DB.prepare('SELECT id FROM rsl_orders WHERE idempotency_key=?').bind(idemKey).first();
if(existing)return existing.id;
const orderCode=await generateOrderCode(env);
const r=await env.DB.prepare('INSERT INTO rsl_orders(reseller_id,total_amount,provider,idempotency_key,order_code) VALUES(?,?,?,?,?)').bind(resellerId,total,provider,idemKey,orderCode).run();
const orderId=r.meta.last_row_id;
try{
const stmts=lines.map(l=>env.DB.prepare('INSERT INTO rsl_order_items(order_id,variant_id,app_name,category,duration,qty,unit_price,line_total,form_data) VALUES(?,?,?,?,?,?,?,?,?)').bind(orderId,l.variant_id,l.app_name,l.category,l.duration,l.qty,l.unit_price,l.qty*l.unit_price,String(l.form_data||'')));
if(stmts.length)await env.DB.batch(stmts);
}catch(e){
await env.DB.prepare('DELETE FROM rsl_orders WHERE id=?').bind(orderId).run();
throw e;
}
return orderId;
}
export async function getOrder(env,orderId,resellerId){
const q=resellerId?'SELECT * FROM rsl_orders WHERE id=? AND reseller_id=?':'SELECT * FROM rsl_orders WHERE id=?';
const row=await env.DB.prepare(q).bind(...(resellerId?[orderId,resellerId]:[orderId])).first();
if(!row)return null;
const items=await env.DB.prepare('SELECT * FROM rsl_order_items WHERE order_id=?').bind(orderId).all();
row.items=items.results;
return row;
}
export async function listOrders(env,resellerId,limit,offset){
const lim=clampInt(limit,20,100),off=clampInt(offset,0,100000);
const r=await env.DB.prepare('SELECT id,status,total_amount,provider,created_at,paid_at,delivered_at FROM rsl_orders WHERE reseller_id=? ORDER BY id DESC LIMIT ? OFFSET ?').bind(resellerId,lim,off).all();
return r.results;
}
export async function listOrderCredentials(env,orderId){
const r=await env.DB.prepare("SELECT oi.id AS order_item_id,oi.app_name,oi.category,oi.duration,oi.qty,si.id AS stock_id,si.fields,si.buyer_note FROM rsl_order_items oi LEFT JOIN rsl_stock_items si ON si.order_item_id=oi.id AND si.status='sold' WHERE oi.order_id=? ORDER BY oi.id,si.id").bind(orderId).all();
return r.results;
}
export async function appendPayment(env,orderId,provider,txId,status,gross,raw){
await env.DB.prepare('INSERT INTO rsl_payments(order_id,provider,provider_tx_id,status,gross_amount,raw_status) VALUES(?,?,?,?,?,?)').bind(orderId,provider,txId||'',status,gross,raw||'').run();
}
export async function audit(env,actorType,actorId,action,entityType,entityId,meta,ip){
await env.DB.prepare('INSERT INTO rsl_audit(actor_type,actor_id,action,entity_type,entity_id,meta,ip) VALUES(?,?,?,?,?,?,?)').bind(actorType,actorId,action,entityType||'',entityId||null,meta?JSON.stringify(meta):'',ip||'').run();
}
export async function lowStock(env,threshold){
const r=await env.DB.prepare("SELECT p.id,p.app_name,p.category,p.duration,COUNT(s.id) AS avail FROM rsl_pricelist p LEFT JOIN rsl_stock_items s ON s.variant_id=p.id AND s.status='available' GROUP BY p.id HAVING avail<=? ORDER BY avail ASC,p.app_name").bind(clampInt(threshold,5,1000)).all();
return r.results;
}
export async function countNeedsAttention(env){
const r=await env.DB.prepare("SELECT COUNT(*) AS c FROM rsl_orders WHERE status='needs_attention'").first();
return r?r.c:0;
}
export async function listOrdersAdmin(env,p){
const status=String(p.status||'');
const range=String(p.range||'');
const q=String(p.q||'').trim();
const lim=clampInt(p.limit,20,100);
const off=clampInt(p.offset,0,100000);
const where=[];
const args=[];
if(status){where.push('o.status=?');args.push(status)}
if(range==='today'){where.push("DATE(o.created_at)=DATE('now')")}
else if(range==='7d'){where.push("o.created_at>=datetime('now','-7 days')")}
else if(range==='30d'){where.push("o.created_at>=datetime('now','-30 days')")}
if(q){
const like='%'+q+'%';
where.push("(o.order_code LIKE ? OR r.username LIKE ? OR r.display_name LIKE ? OR r.whatsapp LIKE ? OR oi.app_name LIKE ? OR p.provider_tx_id LIKE ?)");
args.push(like,like,like,like,like,like);
}
const whereSql=where.length?('WHERE '+where.join(' AND ')):'';
const sql=`SELECT DISTINCT o.id,o.order_code,o.status,o.total_amount,o.provider,o.created_at,o.paid_at,o.delivered_at,r.username,r.display_name,r.whatsapp FROM rsl_orders o LEFT JOIN rsl_resellers r ON r.id=o.reseller_id LEFT JOIN rsl_order_items oi ON oi.order_id=o.id LEFT JOIN rsl_payments p ON p.order_id=o.id ${whereSql} ORDER BY o.id DESC LIMIT ? OFFSET ?`;
args.push(lim,off);
const r=await env.DB.prepare(sql).bind(...args).all();
if(!r.results.length)return[];
const ids=r.results.map(o=>o.id);
const itSql=`SELECT order_id,app_name,category,duration,qty FROM rsl_order_items WHERE order_id IN (${ids.map(()=>'?').join(',')})`;
const it=await env.DB.prepare(itSql).bind(...ids).all();
const summary={};
it.results.forEach(row=>{
if(!summary[row.order_id])summary[row.order_id]=[];
summary[row.order_id].push(row);
});
return r.results.map(o=>{
const items=summary[o.id]||[];
return Object.assign({},o,{items_summary:items.map(i=>({app_name:i.app_name,category:i.category,duration:i.duration,qty:i.qty}))});
});
}
export async function getOrderAdmin(env,orderId){
const o=await env.DB.prepare('SELECT * FROM rsl_orders WHERE id=?').bind(orderId).first();
if(!o)return null;
const reseller=await env.DB.prepare('SELECT id,username,display_name,whatsapp,x_username FROM rsl_resellers WHERE id=?').bind(o.reseller_id).first();
o.reseller=reseller||null;
const items=await env.DB.prepare('SELECT * FROM rsl_order_items WHERE order_id=? ORDER BY id').bind(orderId).all();
o.items=items.results;
const pays=await env.DB.prepare('SELECT provider,provider_tx_id,status,gross_amount,raw_status,created_at FROM rsl_payments WHERE order_id=? ORDER BY id').bind(orderId).all();
o.payments=pays.results;
o.credentials=await listOrderCredentials(env,orderId);
for(const it of o.items){
const rev=await env.DB.prepare('SELECT id,fields,note,created_by,created_at FROM rsl_order_revisions WHERE order_item_id=? ORDER BY id ASC').bind(it.id).all();
it.revisions=rev.results;
}
return o;
}
export async function addOrderRevision(env,orderItemId,fieldsObj,note,createdBy){
const r=await env.DB.prepare('INSERT INTO rsl_order_revisions(order_item_id,fields,note,created_by,created_at) VALUES(?,?,?,?,?)').bind(orderItemId,JSON.stringify(fieldsObj||{}),String(note||'').slice(0,1000),createdBy||'admin',nowStr()).run();
return r.meta.last_row_id;
}
export async function setOrderStatus(env,orderId,status){
await env.DB.prepare('UPDATE rsl_orders SET status=? WHERE id=?').bind(status,orderId).run();
}
