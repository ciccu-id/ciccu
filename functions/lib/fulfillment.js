import{nowStr}from'./auth-reseller.js';
import{appendPayment,audit,expireReservations,reserveStock,listOrderItems}from'./db.js';
async function releaseOrderReservations(env,orderId){const r=await env.DB.prepare("UPDATE rsl_stock_items SET status='available',order_item_id=NULL,reserved_at=NULL,reservation_expires_at=NULL WHERE status='reserved' AND order_item_id IN (SELECT id FROM rsl_order_items WHERE order_id=?)").bind(orderId).run();return(r.meta&&r.meta.changes)||0}
export async function reserveOrderStock(env,orderId,ttlMinutes){
const order=await env.DB.prepare('SELECT id,status FROM rsl_orders WHERE id=?').bind(orderId).first();
if(!order)return{ok:false,reason:'not_found'};
if(order.status!=='pending_payment')return{ok:false,reason:'state'};
try{await expireReservations(env)}catch(e){}
const items=await listOrderItems(env,orderId);
if(!items.length)return{ok:true,reserved:0};
let total=0;
for(const it of items){
const existing=await env.DB.prepare("SELECT COUNT(*) AS c FROM rsl_stock_items WHERE order_item_id=? AND status='reserved'").bind(it.id).first();
const have=existing?existing.c:0;
const need=it.qty-have;
if(need<=0){total+=have;continue}
const got=await reserveStock(env,it.id,it.variant_id,need,ttlMinutes||20);
total+=got;
if(got<need){await releaseOrderReservations(env,orderId);return{ok:false,reason:'stock',variant_id:it.variant_id,requested:need,reserved:got}}
}
return{ok:true,reserved:total};
}
export async function allocateStock(env,orderId){
const order=await env.DB.prepare('SELECT id,status FROM rsl_orders WHERE id=?').bind(orderId).first();
if(!order)return{ok:false,reason:'not_found'};
if(order.status!=='pending_payment'&&order.status!=='needs_attention')return{ok:false,reason:'state'};
try{await expireReservations(env)}catch(e){}
const items=await env.DB.prepare('SELECT id,variant_id,qty FROM rsl_order_items WHERE order_id=?').bind(orderId).all();
const claimed=[];
for(const it of items.results){
let got=0;
const resv=await env.DB.prepare("UPDATE rsl_stock_items SET status='sold',sold_at=?,reserved_at=NULL,reservation_expires_at=NULL WHERE order_item_id=? AND status='reserved'").bind(nowStr(),it.id).run();
got+=(resv.meta&&resv.meta.changes)||0;
const need=it.qty-got;
if(need>0){
const avail=await env.DB.prepare("UPDATE rsl_stock_items SET status='sold',order_item_id=?,sold_at=?,reserved_at=NULL,reservation_expires_at=NULL WHERE id IN (SELECT id FROM rsl_stock_items WHERE variant_id=? AND status='available' ORDER BY id LIMIT ?)").bind(it.id,nowStr(),it.variant_id,need).run();
got+=(avail.meta&&avail.meta.changes)||0;
}
const ids=await env.DB.prepare("SELECT id FROM rsl_stock_items WHERE order_item_id=? AND status='sold'").bind(it.id).all();
ids.results.forEach(r=>claimed.push(r.id));
if(got<it.qty){
for(const cid of claimed)await env.DB.prepare("UPDATE rsl_stock_items SET status='available',order_item_id=NULL,sold_at=NULL,reserved_at=NULL,reservation_expires_at=NULL WHERE id=?").bind(cid).run();
await env.DB.prepare("UPDATE rsl_orders SET status='needs_attention' WHERE id=?").bind(orderId).run();
return{ok:false,reason:'stock',variant_id:it.variant_id};
}
await env.DB.prepare('UPDATE rsl_order_items SET fulfilled_qty=? WHERE id=?').bind(got,it.id).run();
}
await env.DB.prepare("UPDATE rsl_orders SET status='delivered',paid_at=COALESCE(paid_at,?),delivered_at=? WHERE id=? AND status IN ('pending_payment','needs_attention')").bind(nowStr(),nowStr(),orderId).run();
return{ok:true};
}
export async function markPaymentSettle(env,orderId,provider,txId,gross,raw){
const order=await env.DB.prepare('SELECT id,status FROM rsl_orders WHERE id=?').bind(orderId).first();
if(!order)return{ok:false,reason:'not_found'};
if(order.status==='delivered')return{ok:true,reason:'already'};
if(order.status!=='pending_payment')return{ok:false,reason:'state'};
await appendPayment(env,orderId,provider,txId,'settle',gross,raw);
await env.DB.prepare("UPDATE rsl_orders SET paid_at=? WHERE id=? AND paid_at IS NULL").bind(nowStr(),orderId).run();
return allocateStock(env,orderId);
}
export async function markPaymentFailed(env,orderId,provider,txId,status,gross,raw){
const order=await env.DB.prepare('SELECT id,status FROM rsl_orders WHERE id=?').bind(orderId).first();
if(!order)return{ok:false,reason:'not_found'};
if(order.status!=='pending_payment')return{ok:false,reason:'state'};
await releaseOrderReservations(env,order.id);
await appendPayment(env,orderId,provider,txId,status,gross,raw);
await env.DB.prepare("UPDATE rsl_orders SET status='cancelled',cancelled_at=? WHERE id=? AND status='pending_payment'").bind(nowStr(),orderId).run();
return{ok:true};
}
export async function manualSettle(env,orderId,actorId,ip){
const order=await env.DB.prepare('SELECT id,status,total_amount FROM rsl_orders WHERE id=?').bind(orderId).first();
if(!order)return{ok:false,reason:'not_found'};
if(order.status!=='pending_payment')return{ok:false,reason:'state'};
const res=await markPaymentSettle(env,orderId,'manual','','manual-settle','');
await audit(env,'admin',actorId,'payment.manual_settle','order',orderId,res,ip);
return res;
}
export async function retryFulfill(env,orderId,actorId,ip){
const order=await env.DB.prepare('SELECT id,status FROM rsl_orders WHERE id=?').bind(orderId).first();
if(!order)return{ok:false,reason:'not_found'};
if(order.status!=='needs_attention')return{ok:false,reason:'state'};
const res=await allocateStock(env,orderId);
await audit(env,'admin',actorId,'fulfill.retry','order',orderId,res,ip);
return res;
}
export async function returnStockToPool(env,orderId){
await releaseOrderReservations(env,orderId);
await env.DB.prepare("UPDATE rsl_stock_items SET status='available',order_item_id=NULL,sold_at=NULL,reserved_at=NULL,reservation_expires_at=NULL WHERE status='sold' AND order_item_id IN (SELECT id FROM rsl_order_items WHERE order_id=?)").bind(orderId).run();
await env.DB.prepare('UPDATE rsl_order_items SET fulfilled_qty=0 WHERE order_id=?').bind(orderId).run();
}
export async function refundOrder(env,orderId,actorId,ip,returnStock){
const order=await env.DB.prepare('SELECT id,status,total_amount,provider FROM rsl_orders WHERE id=?').bind(orderId).first();
if(!order)return{ok:false,reason:'not_found'};
if(order.status!=='needs_attention'&&order.status!=='delivered')return{ok:false,reason:'state'};
await releaseOrderReservations(env,orderId);
if(returnStock)await returnStockToPool(env,orderId);
await env.DB.prepare("UPDATE rsl_orders SET status='refunded',cancelled_at=? WHERE id=?").bind(nowStr(),orderId).run();
await appendPayment(env,orderId,order.provider,'','refund',order.total_amount,'refund');
await audit(env,'admin',actorId,'order.refund','order',orderId,{returnStock:!!returnStock},ip);
return{ok:true};
}
