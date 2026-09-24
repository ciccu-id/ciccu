import{nowStr}from'./auth-reseller.js';
function clampInt(v,d,m){const n=parseInt(v,10);if(isNaN(n))return d;return Math.max(0,Math.min(m,n))}
export async function getVariant(env,id){return env.DB.prepare('SELECT id,app_name,category,duration,price,status,notes FROM rsl_pricelist WHERE id=?').bind(id).first()}
export async function listCatalog(env){
const r=await env.DB.prepare("SELECT p.id,p.app_name,p.category,p.duration,p.price,p.status,p.notes,p.sort_order,p.app_sort_order,(SELECT COUNT(*) FROM rsl_stock_items s WHERE s.variant_id=p.id AND s.status='available') AS stock_available FROM rsl_pricelist p ORDER BY COALESCE(p.app_sort_order,9999),COALESCE(p.sort_order,9999),p.id").all();
return r.results;
}
export async function createVariant(env,data){
const r=await env.DB.prepare('INSERT INTO rsl_pricelist(app_name,category,duration,price,status,notes,sort_order,app_sort_order) VALUES(?,?,?,?,?,?,?,?)').bind(data.app_name,data.category,data.duration,data.price,data.status||'Ready',data.notes||'',data.sort_order||9999,data.app_sort_order||9999).run();
return r.meta.last_row_id;
}
export async function updateVariant(env,id,data){
await env.DB.prepare('UPDATE rsl_pricelist SET app_name=?,category=?,duration=?,price=?,status=?,notes=?,sort_order=?,app_sort_order=? WHERE id=?').bind(data.app_name,data.category,data.duration,data.price,data.status,data.notes||'',data.sort_order||9999,data.app_sort_order||9999,id).run();
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
export async function addStock(env,variantId,fieldsObj){
const r=await env.DB.prepare("INSERT INTO rsl_stock_items(variant_id,fields,status) VALUES(?,?, 'available')").bind(variantId,JSON.stringify(fieldsObj)).run();
return r.meta.last_row_id;
}
export async function addStockBulk(env,variantId,arr){
const stmts=arr.map(f=>env.DB.prepare("INSERT INTO rsl_stock_items(variant_id,fields,status) VALUES(?,?,'available')").bind(variantId,JSON.stringify(f)));
if(!stmts.length)return 0;
const res=await env.DB.batch(stmts);
return res.length;
}
export async function updateStockFields(env,id,fieldsObj){
await env.DB.prepare("UPDATE rsl_stock_items SET fields=? WHERE id=? AND status='available'").bind(JSON.stringify(fieldsObj),id).run();
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
const r=await env.DB.prepare('INSERT INTO rsl_orders(reseller_id,total_amount,provider,idempotency_key) VALUES(?,?,?,?)').bind(resellerId,total,provider,idemKey).run();
const orderId=r.meta.last_row_id;
try{
const stmts=lines.map(l=>env.DB.prepare('INSERT INTO rsl_order_items(order_id,variant_id,app_name,category,duration,qty,unit_price,line_total) VALUES(?,?,?,?,?,?,?,?)').bind(orderId,l.variant_id,l.app_name,l.category,l.duration,l.qty,l.unit_price,l.qty*l.unit_price));
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
const r=await env.DB.prepare('SELECT id,status,total_amount,provider,created_at,paid_at,delivered_at FROM rsl_orders WHERE reseller_id=? ORDER BY id DESC LIMIT ? OFFSET ?').bind(resellerId,lim,offset).all();
return r.results;
}
export async function listOrderCredentials(env,orderId){
const r=await env.DB.prepare("SELECT oi.id AS order_item_id,oi.app_name,oi.category,oi.duration,oi.qty,si.id AS stock_id,si.fields FROM rsl_order_items oi LEFT JOIN rsl_stock_items si ON si.order_item_id=oi.id AND si.status='sold' WHERE oi.order_id=? ORDER BY oi.id,si.id").bind(orderId).all();
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
