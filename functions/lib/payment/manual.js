import{nowStr,addHours}from'../auth-reseller.js';
export const name='manual';
export async function createPayment(env,order,items){
const ref='MANUAL-'+order.id;
await env.DB.prepare('UPDATE rsl_orders SET provider_ref=? WHERE id=?').bind(ref,order.id).run();
return{ok:true,providerRef:ref,instruction:{type:'manual',order_id:order.id,total:order.total_amount,message:'Pembayaran manual: pesanan menunggu konfirmasi/settle oleh admin untuk menguji alur fulfillment.',expires_at:addHours(2),created_at:nowStr()}};
}
export async function verifyPayment(env,order){
return{status:'pending',txId:order.provider_ref||'',raw:'manual-awaiting-admin'};
}
