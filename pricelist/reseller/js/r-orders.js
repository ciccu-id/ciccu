import{RES,ce,svgI,resFmtIDR,resApi,resToast,relTime}from'./r-core.js?v=6';
let ORDERS_TIMER=null;
function fmtRemainRes(iso){
if(!iso)return{text:'—',mod:'dead'};
const t=Date.parse(String(iso).replace(' ','T')+'Z');
if(isNaN(t))return{text:'—',mod:'dead'};
const diff=t-Date.now();
if(diff<=0)return{text:'Berakhir',mod:'dead'};
let s=Math.floor(diff/1000);
const d=Math.floor(s/86400);s-=d*86400;
const h=Math.floor(s/3600);s-=h*3600;
const m=Math.floor(s/60);s-=m*60;
let txt;
if(d>0)txt=d+'h '+h+'j '+m+'m';
else if(h>0)txt=h+'j '+m+'m '+s+'d';
else if(m>0)txt=m+'m '+s+'d';
else txt=s+'d';
let mod='ok';
if(diff<86400000)mod='danger';
else if(diff<604800000)mod='warn';
return{text:txt,mod:mod};
}
function tickAll(){
const els=document.querySelectorAll('[data-cd]');
if(!els.length)return;
for(let i=0;i<els.length;i++){
const el=els[i];
const r=fmtRemainRes(el.getAttribute('data-cd'));
if(el.textContent!==r.text)el.textContent=r.text;
el.classList.remove('ok','warn','danger','dead');
el.classList.add(r.mod);
}
}
function startTicker(){
if(ORDERS_TIMER)return;
ORDERS_TIMER=setInterval(tickAll,1000);
}
function cdTag(iso){
const t=ce('span','r-cd-tag','—');
t.setAttribute('data-cd',iso);
return t;
}
function orderStatusLabel(s){
const m={
'pending_payment':'Menunggu pembayaran',
'delivered':'Terkirim',
'needs_attention':'Perlu perhatian admin',
'cancelled':'Dibatalkan',
'refunded':'Direfund'
};
return m[s]||s;
}
function orderStatusPill(s){
const map={
delivered:'green',
pending_payment:'amber',
needs_attention:'amber',
cancelled:'gray',
refunded:'red'
};
return map[s]||'gray';
}
function rowPair(label,value){
const row=ce('div','r-od-row');
const p=ce('p','r-od-pair');
p.appendChild(ce('span','r-od-label',label));
p.appendChild(ce('span','r-od-value',value));
row.appendChild(p);
return row;
}
export async function loadOrders(){
const list=document.getElementById('resOrdersList');
if(!list)return;
while(list.firstChild)list.removeChild(list.firstChild);
list.appendChild(ce('div','r-loading','Memuat pesanan...'));
try{
const rows=await resApi('/api/reseller/orders?limit=50');
while(list.firstChild)list.removeChild(list.firstChild);
if(!rows||!rows.length){
list.appendChild(ce('div','r-empty','Belum ada pesanan.'));
return;
}
rows.forEach(function(o){list.appendChild(renderOrderCard(o));});
startTicker();
tickAll();
}catch(e){
while(list.firstChild)list.removeChild(list.firstChild);
list.appendChild(ce('div','r-empty','Gagal memuat pesanan.'));
}
}
function renderOrderCard(o){
const card=ce('div','r-order-card');
const head=ce('div','r-oc-head');
const left=ce('div','r-oc-left');
left.appendChild(ce('p','r-oc-id','Order #'+o.id));
left.appendChild(ce('p','r-oc-time',relTime(o.created_at)));
head.appendChild(left);
head.appendChild(ce('span','r-pill r-pill-'+orderStatusPill(o.status),orderStatusLabel(o.status)));
card.appendChild(head);
const body=ce('div','r-oc-body');
body.appendChild(ce('p','r-oc-total','Total '+resFmtIDR(o.total_amount)));
if(o.paid_at)body.appendChild(ce('p','r-oc-meta','Lunas '+relTime(o.paid_at)));
if(o.delivered_at)body.appendChild(ce('p','r-oc-meta','Terkirim '+relTime(o.delivered_at)));
card.appendChild(body);
if(o.status==='delivered'&&o.expires_at){
const cdRow=ce('div','r-oc-cd');
cdRow.style.display='flex';
cdRow.style.alignItems='center';
cdRow.style.justifyContent='space-between';
cdRow.style.gap='.5rem';
cdRow.appendChild(ce('p','r-oc-meta','Sisa masa aktif'));
cdRow.appendChild(cdTag(o.expires_at));
card.appendChild(cdRow);
}
const foot=ce('div','r-oc-foot');
const det=ce('button','r-oc-btn sky','Detail');
det.type='button';
det.addEventListener('click',function(){viewOrderDetail(o.id);});
foot.appendChild(det);
if(o.status==='delivered'){
const acc=ce('button','r-oc-btn green','🔑 Data Akses');
acc.type='button';
acc.addEventListener('click',function(){revealCredentials(o.id);});
foot.appendChild(acc);
}
card.appendChild(foot);
return card;
}
async function viewOrderDetail(id){
try{
const o=await resApi('/api/reseller/orders/'+id);
openModal('Detail Order #'+o.id,renderOrderDetailBody(o));
tickAll();
}catch(e){
resToast(e.message||'Gagal memuat detail.');
}
}
function renderOrderDetailBody(o){
const frag=document.createDocumentFragment();
const stRow=ce('div','r-od-row');
const stP=ce('p','r-od-pair');
stP.appendChild(ce('span','r-od-label','Status'));
stP.appendChild(ce('span','r-pill r-pill-'+orderStatusPill(o.status),orderStatusLabel(o.status)));
stRow.appendChild(stP);
frag.appendChild(stRow);
frag.appendChild(rowPair('Total',resFmtIDR(o.total_amount)));
frag.appendChild(rowPair('Dibuat',relTime(o.created_at)));
if(o.paid_at)frag.appendChild(rowPair('Lunas',relTime(o.paid_at)));
if(o.delivered_at)frag.appendChild(rowPair('Terkirim',relTime(o.delivered_at)));
if(o.status==='delivered'&&o.expires_at){
const row=ce('div','r-od-row');
const p=ce('p','r-od-pair');
p.appendChild(ce('span','r-od-label','Sisa masa aktif'));
p.appendChild(cdTag(o.expires_at));
row.appendChild(p);
frag.appendChild(row);
}
frag.appendChild(ce('p','r-od-sub','Item Pesanan'));
(o.items||[]).forEach(function(it){
const row=ce('div','r-od-item');
row.appendChild(ce('p','r-od-item-name',it.app_name+' • '+it.category+' • '+it.duration));
row.appendChild(ce('p','r-od-item-meta','qty '+it.qty+' × '+resFmtIDR(it.unit_price)+' = '+resFmtIDR(it.line_total)));
if(it.expires_at){
const wrap=ce('div','r-od-row');
const p=ce('p','r-od-pair');
p.appendChild(ce('span','r-od-label','Sisa'));
p.appendChild(cdTag(it.expires_at));
wrap.appendChild(p);
row.appendChild(wrap);
}
frag.appendChild(row);
});
return frag;
}
async function revealCredentials(id){
try{
const rows=await resApi('/api/reseller/orders/'+id+'/reveal',{method:'POST'});
openModal('Data Akses Order #'+id,renderCredentialsBody(rows));
}catch(e){
resToast(e.message||'Gagal memuat data akses.');
}
}
function renderCredentialsBody(rows){
const frag=document.createDocumentFragment();
if(!rows||!rows.length){
frag.appendChild(ce('p','r-empty','Data akses belum tersedia.'));
return frag;
}
rows.forEach(function(g){
const group=ce('div','r-cred-group');
group.appendChild(ce('p','r-cred-title',g.app_name+' • '+g.category+' • '+g.duration+' (qty '+g.qty+')'));
if(!g.credentials||!g.credentials.length){
group.appendChild(ce('p','r-cred-empty','Belum ada kredensial untuk item ini.'));
frag.appendChild(group);
return;
}
g.credentials.forEach(function(cr,idx){
const card=ce('div','r-cred-card');
card.appendChild(ce('p','r-cred-card-title','Kredensial #'+(idx+1)));
const fields=cr.fields||{};
Object.keys(fields).forEach(function(k){
const row=ce('div','r-cred-row');
row.appendChild(ce('span','r-cred-key',k));
const valWrap=ce('span','r-cred-val-wrap');
valWrap.appendChild(ce('span','r-cred-val',String(fields[k])));
const cp=ce('button','r-cred-copy');
cp.type='button';
cp.title='Salin';
cp.appendChild(svgI('M8 5H6a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2v-1M8 5a2 2 0 002 2h2a2 2 0 002-2M8 5a2 2 0 012-2h2a2 2 0 012 2m0 0h2a2 2 0 012 2v3m2 4H10','.75rem','.75rem'));
cp.addEventListener('click',function(){copyText(String(fields[k]),cp);});
valWrap.appendChild(cp);
row.appendChild(valWrap);
card.appendChild(row);
});
group.appendChild(card);
});
frag.appendChild(group);
});
return frag;
}
function copyText(text,btn){
if(navigator.clipboard&&navigator.clipboard.writeText){
navigator.clipboard.writeText(text).then(function(){
flashCopied(btn);
}).catch(function(){fallbackCopy(text,btn);});
}else{
fallbackCopy(text,btn);
}
}
function fallbackCopy(text,btn){
const ta=document.createElement('textarea');
ta.value=text;
ta.style.position='fixed';
ta.style.opacity='0';
document.body.appendChild(ta);
ta.select();
try{document.execCommand('copy');flashCopied(btn);}catch(e){}
document.body.removeChild(ta);
}
function flashCopied(btn){
const old=btn.innerHTML;
btn.textContent='✓';
setTimeout(function(){btn.innerHTML=old;},900);
resToast('Disalin.');
}
function openModal(title,bodyNode){
let overlay=document.getElementById('resGenericModal');
if(overlay)overlay.remove();
overlay=ce('div','r-modal-overlay');
overlay.id='resGenericModal';
const box=ce('div','r-modal-box');
const head=ce('div','r-modal-head');
head.appendChild(ce('h3',null,title));
const close=ce('button','r-modal-close','×');
close.type='button';
close.addEventListener('click',function(){overlay.remove();});
head.appendChild(close);
box.appendChild(head);
const body=ce('div','r-modal-body');
body.appendChild(bodyNode);
box.appendChild(body);
overlay.appendChild(box);
overlay.addEventListener('click',function(e){if(e.target===overlay)overlay.remove();});
document.body.appendChild(overlay);
}
export function initOrders(){
document.addEventListener('res:logged-in',function(){
if(RES.view==='orders')loadOrders();
});
document.addEventListener('res:view-changed',function(e){
if(e.detail&&e.detail.view==='orders')loadOrders();
});
document.addEventListener('res:checkout-success',function(){
if(RES.view==='orders')loadOrders();
});
}
