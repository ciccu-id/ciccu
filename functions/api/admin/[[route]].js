import{hashNewPassword,nowStr}from'../../lib/auth-reseller.js';
import{listCatalog,createVariant,updateVariant,deleteVariant,setTemplate,listStock,addStock,addStockBulk,updateStockFields,disableStock,deleteAvailableStock,countAvailable,lowStock,getOrder,listOrderCredentials,audit}from'../../lib/db.js';
import{manualSettle,retryFulfill,refundOrder}from'../../lib/fulfillment.js';
const corsHeaders={'Access-Control-Allow-Origin':'https://ciccu.biz.id','Access-Control-Allow-Methods':'GET, POST, PUT, DELETE, OPTIONS','Access-Control-Allow-Headers':'Content-Type, x-admin-password'};
function truncate(s,m){return s?String(s).slice(0,m):''}
function validTime(s){return s&&/^([01]\d|2[0-3]):[0-5]\d$/.test(s)}
function validDT(s){return!s||/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}/.test(s)}
const num=s=>parseInt(s,10);
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
export async function onRequest(context){
const{request,env}=context;
const url=new URL(request.url);const p=url.pathname;const m=request.method;
if(m==='OPTIONS')return new Response(null,{headers:corsHeaders});
const json=(d,s=200)=>new Response(JSON.stringify(d),{headers:{...corsHeaders,'Content-Type':'application/json','Cache-Control':'no-store'},status:s});
const err=(msg,s=500)=>json({error:msg},s);
if(request.headers.get('x-admin-password')!==env.ADMIN_PASSWORD)return err('Password salah atau sesi tidak valid',403);
const ip=request.headers.get('cf-connecting-ip')||'';
try{
const b=m!=='GET'?await request.json().catch(()=>({})):null;
const q=p.replace(/^\/api\/admin/,'')||'/';
if(q==='/settings'&&m==='GET'){
const{results}=await env.DB.prepare('SELECT * FROM store_settings WHERE id=1').all();
if(!results||!results.length)return json({});
const s=results[0];
return json({is_manual_closed:s.is_closed===1,auto_schedule:s.auto_schedule===1,open_time:s.open_time,close_time:s.close_time,message:s.close_message||'',flash_sale_start:s.flash_sale_start||'',flash_sale_end:s.flash_sale_end||'',flash_sale_name:s.flash_sale_name||'Flash Sale',flash_sale_description:s.flash_sale_description||''});
}
if(q==='/stats'&&m==='GET'){
const oc=await env.DB.prepare('SELECT COUNT(*) AS c FROM rsl_orders').first();
const dv=await env.DB.prepare("SELECT COUNT(*) AS c, COALESCE(SUM(total_amount),0) AS rev FROM rsl_orders WHERE status='delivered'").first();
const pd=await env.DB.prepare("SELECT COUNT(*) AS c FROM rsl_orders WHERE status='pending_payment'").first();
const sa=await env.DB.prepare("SELECT COUNT(*) AS c FROM rsl_stock_items WHERE status='available'").first();
const ls=await env.DB.prepare("SELECT COUNT(*) AS c FROM (SELECT p.id FROM rsl_pricelist p JOIN rsl_stock_items s ON s.variant_id=p.id GROUP BY p.id HAVING SUM(CASE WHEN s.status='available' THEN 1 ELSE 0 END)<=5)").first();
const ro=await env.DB.prepare("SELECT o.id,o.total_amount,o.status,o.created_at,COALESCE(r.username,'') AS username FROM rsl_orders o LEFT JOIN rsl_resellers r ON r.id=o.reseller_id ORDER BY o.id DESC LIMIT 5").all();
const lsl=await env.DB.prepare("SELECT p.id,p.app_name,p.category,p.duration,SUM(CASE WHEN s.status='available' THEN 1 ELSE 0 END) AS avail FROM rsl_pricelist p JOIN rsl_stock_items s ON s.variant_id=p.id GROUP BY p.id,p.app_name,p.category,p.duration HAVING avail<=5 ORDER BY avail ASC,p.app_name LIMIT 5").all();
const st=await env.DB.prepare('SELECT flash_sale_name,flash_sale_start,flash_sale_end FROM store_settings WHERE id=1').first();
const fi=await env.DB.prepare("SELECT COUNT(*) AS c FROM pricelist WHERE flash_price IS NOT NULL AND flash_price<>''").first();
let flash={name:'',start:'',end:'',active:false,items:0};
if(st){
const norm=x=>String(x||'').replace('T',' ').slice(0,16);
const nnow=nowStr().slice(0,16);
const ns=norm(st.flash_sale_start),ne=norm(st.flash_sale_end);
flash={name:st.flash_sale_name||'Flash Sale',start:st.flash_sale_start||'',end:st.flash_sale_end||'',active:!!(ns&&ne&&ns<=nnow&&nnow<=ne),items:fi?fi.c:0};
}
return json({orders:{total:oc?oc.c:0,delivered:dv?dv.c:0,pending:pd?pd.c:0},revenue:dv?dv.rev:0,stock:{available:sa?sa.c:0,low:ls?ls.c:0},recent_orders:ro.results,low_stock:lsl.results,flash_sale:flash});
}
if(q==='/pricelist'&&m==='GET'){const{results}=await env.DB.prepare('SELECT * FROM pricelist').all();return json(results)}
if(q==='/forms'&&m==='GET'){const{results}=await env.DB.prepare('SELECT * FROM app_forms').all();return json(results)}
if(q==='/testimoni'&&m==='GET'){const{results}=await env.DB.prepare('SELECT * FROM testimonials ORDER BY created_at DESC').all();return json(results)}
if(q==='/settings'&&m==='PUT'){
const cm=truncate(b.close_message||'',500),fn=truncate(b.flash_sale_name||'Flash Sale',100),fd=truncate(b.flash_sale_description||'',200);
const fs=b.flash_sale_start||'',fe=b.flash_sale_end||'',ot=b.open_time||'05:00',ct=b.close_time||'23:00';
if(!validTime(ot))return err('Format jam buka tidak valid',400);
if(!validTime(ct))return err('Format jam tutup tidak valid',400);
if(!validDT(fs))return err('Format waktu mulai flash sale tidak valid',400);
if(!validDT(fe))return err('Format waktu selesai flash sale tidak valid',400);
await env.DB.prepare('UPDATE store_settings SET is_closed=?,auto_schedule=?,open_time=?,close_time=?,close_message=?,flash_sale_start=?,flash_sale_end=?,flash_sale_name=?,flash_sale_description=? WHERE id=1').bind(b.is_closed?1:0,b.auto_schedule?1:0,ot,ct,cm,fs,fe,fn,fd).run();
return json({success:true});
}
if(q==='/pricelist'&&m==='POST'){
const an=truncate(b.app_name,100),cat=truncate(b.category,100),dur=truncate(b.duration,100),pr=truncate(b.price,50),nt=truncate(b.notes||'',500),fp=truncate(b.flash_price||'',50);
if(!an||!cat||!dur||!pr)return err('Data tidak lengkap',400);
await env.DB.prepare('INSERT INTO pricelist (app_name,category,duration,price,status,notes,flash_price) VALUES (?,?,?,?,?,?,?)').bind(an,cat,dur,pr,b.status||'Ready',nt,fp).run();
return json({success:true},201);
}
if(q==='/pricelist/reorder'&&m==='PUT'){
if(!b.order||!Array.isArray(b.order)||b.order.length>200)return err('Data tidak valid',400);
const stmts=b.order.map(i=>{const id=num(i.id),so=num(i.sort_order);return(isNaN(id)||isNaN(so))?null:env.DB.prepare('UPDATE pricelist SET sort_order=? WHERE id=?').bind(so,id)}).filter(Boolean);
if(!stmts.length)return err('Data tidak valid',400);
await env.DB.batch(stmts);return json({success:true});
}
if(q==='/flashsale/reorder'&&m==='PUT'){
if(!b.order||!Array.isArray(b.order)||b.order.length>100)return err('Data tidak valid',400);
const stmts=b.order.map(i=>{const id=num(i.id),fso=num(i.flash_sort_order);return(isNaN(id)||isNaN(fso))?null:env.DB.prepare('UPDATE pricelist SET flash_sort_order=? WHERE id=?').bind(fso,id)}).filter(Boolean);
if(!stmts.length)return err('Data tidak valid',400);
await env.DB.batch(stmts);return json({success:true});
}
if(q==='/reorder-apps'&&m==='PUT'){
if(!b.order||!Array.isArray(b.order)||b.order.length>100)return err('Data tidak valid',400);
const stmts=b.order.map(i=>{const aso=num(i.app_sort_order);return(isNaN(aso)||!i.app_name)?null:env.DB.prepare('UPDATE pricelist SET app_sort_order=? WHERE app_name=?').bind(aso,truncate(i.app_name,100))}).filter(Boolean);
if(!stmts.length)return err('Data tidak valid',400);
await env.DB.batch(stmts);return json({success:true});
}
if(q==='/delete/bulk'&&m==='DELETE'){
if(!b.ids||!Array.isArray(b.ids)||!b.ids.length||b.ids.length>100)return err('Data tidak valid',400);
const ids=b.ids.map(i=>num(i)).filter(i=>!isNaN(i));
if(!ids.length)return err('ID tidak valid',400);
await env.DB.prepare(`DELETE FROM pricelist WHERE id IN (${ids.map(()=>'?').join(',')})`).bind(...ids).run();
return json({success:true});
}
if(q==='/status/bulk'&&m==='PUT'){
if(!b.ids||!Array.isArray(b.ids)||!b.ids.length||b.ids.length>100)return err('Data tidak valid',400);
const ids=b.ids.map(i=>num(i)).filter(i=>!isNaN(i));
if(!ids.length)return err('ID tidak valid',400);
await env.DB.prepare(`UPDATE pricelist SET status=? WHERE id IN (${ids.map(()=>'?').join(',')})`).bind(b.status,...ids).run();
return json({success:true});
}
if(q.startsWith('/pricelist/')&&m==='PUT'){
const id=num(q.split('/').pop());
if(isNaN(id))return err('ID tidak valid',400);
const an=truncate(b.app_name,100),cat=truncate(b.category,100),dur=truncate(b.duration,100),pr=truncate(b.price,50),nt=truncate(b.notes||'',500),fp=truncate(b.flash_price||'',50);
await env.DB.prepare('UPDATE pricelist SET app_name=?,category=?,duration=?,price=?,status=?,notes=?,flash_price=? WHERE id=?').bind(an,cat,dur,pr,b.status,nt,fp,id).run();
return json({success:true});
}
if(q.startsWith('/pricelist/')&&m==='DELETE'){
const id=num(q.split('/').pop());
if(isNaN(id))return err('ID tidak valid',400);
await env.DB.prepare('DELETE FROM pricelist WHERE id=?').bind(id).run();
return json({success:true});
}
if(q.startsWith('/status/')&&m==='PUT'){
const id=num(q.split('/').pop());
if(isNaN(id))return err('ID tidak valid',400);
await env.DB.prepare('UPDATE pricelist SET status=? WHERE id=?').bind(b.status,id).run();
return json({success:true});
}
if(q==='/forms'&&m==='POST'){
const an=truncate(b.app_name,100),ff=truncate(b.form_fields,2000);
if(!an)return err('Nama aplikasi tidak boleh kosong',400);
await env.DB.prepare('INSERT INTO app_forms (app_name,form_fields) VALUES (?,?) ON CONFLICT(app_name) DO UPDATE SET form_fields=excluded.form_fields').bind(an,ff).run();
return json({success:true});
}
if(q.startsWith('/forms/')&&m==='DELETE'){
const an=decodeURIComponent(q.split('/').pop());
await env.DB.prepare('DELETE FROM app_forms WHERE app_name=?').bind(an).run();
return json({success:true});
}
if(q.startsWith('/testimoni/')&&m==='PUT'){
const id=num(q.split('/').pop());
if(isNaN(id))return err('ID tidak valid',400);
await env.DB.prepare('UPDATE testimonials SET balasan_admin=? WHERE id=?').bind(truncate(b.balasan_admin||'',500),id).run();
return json({success:true});
}
if(q.startsWith('/testimoni/')&&m==='DELETE'){
const id=num(q.split('/').pop());
if(isNaN(id))return err('ID tidak valid',400);
await env.DB.prepare('DELETE FROM testimonials WHERE id=?').bind(id).run();
return json({success:true});
}
if(q==='/rpricelist'&&m==='GET'){const rows=await listCatalog(env);return json(rows)}
if(q==='/rpricelist'&&m==='POST'){
const an=truncate(b.app_name,100),cat=truncate(b.category,100),dur=truncate(b.duration,100),pr=truncate(b.price,50),nt=truncate(b.notes||'',500);
if(!an||!cat||!dur||!pr)return err('Data tidak lengkap',400);
const st=(b.status==='Sold')?'Sold':'Ready';
const id=await createVariant(env,{app_name:an,category:cat,duration:dur,price:pr,status:st,notes:nt,sort_order:num(b.sort_order)||9999,app_sort_order:num(b.app_sort_order)||9999});
await audit(env,'admin',null,'rpricelist.create','variant',id,{app:an},ip);
return json({success:true,id:id},201);
}
const rpm=q.match(/^\/rpricelist\/(\d+)$/);
if(rpm&&m==='PUT'){
const id=num(rpm[1]);
const an=truncate(b.app_name,100),cat=truncate(b.category,100),dur=truncate(b.duration,100),pr=truncate(b.price,50),nt=truncate(b.notes||'',500);
if(!an||!cat||!dur||!pr)return err('Data tidak lengkap',400);
const st=(b.status==='Sold')?'Sold':'Ready';
await updateVariant(env,id,{app_name:an,category:cat,duration:dur,price:pr,status:st,notes:nt,sort_order:num(b.sort_order)||9999,app_sort_order:num(b.app_sort_order)||9999});
await audit(env,'admin',null,'rpricelist.update','variant',id,{app:an},ip);
return json({success:true});
}
if(rpm&&m==='DELETE'){
const id=num(rpm[1]);
await deleteVariant(env,id);
await audit(env,'admin',null,'rpricelist.delete','variant',id,{},ip);
return json({success:true});
}
if(q==='/cred-templates'&&m==='GET'){const r=await env.DB.prepare('SELECT app_name,fields,updated_at FROM rsl_cred_templates ORDER BY app_name').all();return json(r.results)}
const tm=q.match(/^\/cred-templates\/(.+)$/);
if(tm&&m==='PUT'){
const app=decodeURIComponent(tm[1]);
let arr=[];
if(Array.isArray(b.fields))arr=b.fields.map(f=>String(f).trim()).filter(Boolean).slice(0,30);
else if(typeof b.fields==='string')arr=b.fields.split(',').map(s=>s.trim()).filter(Boolean).slice(0,30);
await setTemplate(env,app,arr);
await audit(env,'admin',null,'template.set','app',null,{app,count:arr.length},ip);
return json({success:true});
}
const sm=q.match(/^\/stock\/(\d+)(\/(bulk|disable))?$/);
if(sm){
const id=num(sm[1]);const sub=sm[3];
if(m==='GET'&&!sub){const rows=await listStock(env,id,url.searchParams.get('status'),url.searchParams.get('limit'),url.searchParams.get('offset'));const c=await countAvailable(env,id);return json({available:c,items:rows})}
if(m==='POST'&&!sub){const f=b.fields;if(!f||typeof f!=='object'||Array.isArray(f))return err('fields wajib objek',400);const nid=await addStock(env,id,f);await audit(env,'admin',null,'stock.add','variant',id,{stock:nid},ip);return json({success:true,id:nid},201)}
if(m==='POST'&&sub==='bulk'){const arr=Array.isArray(b.items)?b.items:[];if(!arr.length||arr.length>500)return err('items tidak valid',400);const n=await addStockBulk(env,id,arr);await audit(env,'admin',null,'stock.bulk','variant',id,{count:n},ip);return json({success:true,added:n})}
if(m==='PUT'&&!sub){const f=b.fields;if(!f||typeof f!=='object'||Array.isArray(f))return err('fields wajib objek',400);await updateStockFields(env,id,f);await audit(env,'admin',null,'stock.update','stock',id,{},ip);return json({success:true})}
if(m==='POST'&&sub==='disable'){await disableStock(env,id);await audit(env,'admin',null,'stock.disable','stock',id,{},ip);return json({success:true})}
if(m==='DELETE'&&!sub){await deleteAvailableStock(env,id);await audit(env,'admin',null,'stock.delete','stock',id,{},ip);return json({success:true})}
}
if(q.startsWith('/low-stock')&&m==='GET'){const rows=await lowStock(env,url.searchParams.get('threshold'));return json(rows)}
if(q==='/orders'&&m==='GET'){
const st=url.searchParams.get('status')||'';
const lim=Math.min(num(url.searchParams.get('limit'))||20,100);
const off=Math.max(num(url.searchParams.get('offset'))||0,0);
const r=await env.DB.prepare("SELECT o.id,o.reseller_id,o.status,o.total_amount,o.provider,o.created_at,o.paid_at,o.delivered_at,COALESCE(r.username,'') AS username FROM rsl_orders o LEFT JOIN rsl_resellers r ON r.id=o.reseller_id WHERE (?='' OR o.status=?) ORDER BY o.id DESC LIMIT ? OFFSET ?").bind(st,st,lim,off).all();
const orders=r.results;
if(orders.length){
const ids=orders.map(o=>o.id);
const it=await env.DB.prepare(`SELECT order_id,duration FROM rsl_order_items WHERE order_id IN (${ids.map(()=>'?').join(',')})`).bind(...ids).all();
const minMs={};
it.results.forEach(row=>{const ms=durationMs(row.duration);if(ms>0&&(minMs[row.order_id]===undefined||ms<minMs[row.order_id]))minMs[row.order_id]=ms});
orders.forEach(o=>{
if(o.status==='delivered'&&o.delivered_at&&minMs[o.id]!==undefined)o.expires_at=addMsToIso(o.delivered_at,minMs[o.id]);
else o.expires_at=null;
});
}
return json(orders);
}
const om=q.match(/^\/orders\/(\d+)(\/(settle|fulfill|refund))?$/);
if(om){
const id=num(om[1]);const act=om[3];
if(m==='GET'&&!act){const o=await getOrder(env,id,null);if(!o)return err('Order tidak ditemukan',404);const pays=await env.DB.prepare('SELECT provider,provider_tx_id,status,gross_amount,raw_status,created_at FROM rsl_payments WHERE order_id=? ORDER BY id').bind(id).all();o.payments=pays.results;o.credentials=await listOrderCredentials(env,id);if(o.delivered_at&&o.items)o.items.forEach(it=>{const ms=durationMs(it.duration);it.expires_at=ms>0?addMsToIso(o.delivered_at,ms):null});return json(o)}
if(m==='POST'&&act==='settle'){const r=await manualSettle(env,id,null,ip);return json(r)}
if(m==='POST'&&act==='fulfill'){const r=await retryFulfill(env,id,null,ip);return json(r)}
if(m==='POST'&&act==='refund'){const r=await refundOrder(env,id,null,ip,!!b.return_stock);return json(r)}
}
if(q==='/audit'&&m==='GET'){
const lim=Math.min(num(url.searchParams.get('limit'))||50,200);
const r=await env.DB.prepare('SELECT id,actor_type,actor_id,action,entity_type,entity_id,meta,ip,created_at FROM rsl_audit ORDER BY id DESC LIMIT ?').bind(lim).all();
return json(r.results);
}
if(q==='/resellers'&&m==='GET'){const r=await env.DB.prepare('SELECT id,username,display_name,status,failed_attempts,locked_until,last_login_at,created_at FROM rsl_resellers ORDER BY id').all();return json(r.results)}
if(q==='/resellers'&&m==='POST'){
const username=String(b.username||'').trim().slice(0,50);
const password=String(b.password||'').slice(0,200);
const dn=String(b.display_name||'').slice(0,100);
if(!username||!password||password.length<8)return err('Username & password minimal 8 karakter wajib',400);
const ex=await env.DB.prepare('SELECT id FROM rsl_resellers WHERE username=?').bind(username).first();
if(ex)return err('Username sudah dipakai',400);
const h=await hashNewPassword(password,env.RES_PEPPER||'');
await env.DB.prepare('INSERT INTO rsl_resellers(username,pass_hash,pass_salt,pass_iter,display_name) VALUES(?,?,?,?,?)').bind(username,h.hash,h.salt,h.iter,dn||username).run();
await audit(env,'admin',null,'reseller.create','reseller',null,{username},ip);
return json({success:true},201);
}
const rm=q.match(/^\/resellers\/(\d+)$/);
if(rm&&m==='PUT'){
const id=num(rm[1]);
const sets=[];const args=[];
if(b.display_name!==undefined){sets.push('display_name=?');args.push(String(b.display_name).slice(0,100))}
if(b.status!==undefined){const st=String(b.status);if(st!=='active'&&st!=='suspended')return err('Status tidak valid',400);sets.push('status=?');args.push(st)}
if(b.password){const pw=String(b.password).slice(0,200);if(pw.length<8)return err('Password minimal 8 karakter',400);const h=await hashNewPassword(pw,env.RES_PEPPER||'');sets.push('pass_hash=?','pass_salt=?','pass_iter=?');args.push(h.hash,h.salt,h.iter);await env.DB.prepare('UPDATE rsl_sessions SET revoked_at=? WHERE reseller_id=? AND revoked_at IS NULL').bind(nowStr(),id).run()}
if(!sets.length)return err('Tidak ada perubahan',400);
args.push(id);
await env.DB.prepare('UPDATE rsl_resellers SET '+sets.join(',')+' WHERE id=?').bind(...args).run();
await audit(env,'admin',null,'reseller.update','reseller',id,{},ip);
return json({success:true});
}
return err('Endpoint tidak ditemukan',404);
}catch(e){
console.error('Admin API error:',e);
return err('Terjadi kesalahan di server.',500);
}
}
