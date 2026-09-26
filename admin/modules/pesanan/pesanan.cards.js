(function(M){
function pill(st){
if(st==='pending_payment')return{cls:'pill amber',txt:'Menunggu'};
if(st==='delivered')return{cls:'pill green',txt:'Terkirim'};
if(st==='needs_attention')return{cls:'pill red',txt:'Perhatian'};
if(st==='cancelled')return{cls:'pill gray',txt:'Dibatalkan'};
if(st==='refunded')return{cls:'pill red',txt:'Refund'};
return{cls:'pill gray',txt:st||'-'};
}
function bMod(st){if(st==='delivered')return'ok';if(st==='pending_payment')return'amber';if(st==='needs_attention')return'bad';if(st==='cancelled')return'gray';if(st==='refunded')return'bad';return'gray'}
function bTxt(st){if(st==='delivered')return'TERKIRIM';if(st==='pending_payment')return'MENUNGGU';if(st==='needs_attention')return'PERHATIAN';if(st==='cancelled')return'BATAL';if(st==='refunded')return'REFUND';return String(st||'-').toUpperCase()}
function bSvg(mod){
var ns='http://www.w3.org/2000/svg';
var s=document.createElementNS(ns,'svg');s.setAttribute('viewBox','0 0 24 24');
var c=document.createElementNS(ns,'circle');c.setAttribute('cx','12');c.setAttribute('cy','12');c.setAttribute('r','10');c.setAttribute('fill','#432f2e');s.appendChild(c);
var p=document.createElementNS(ns,'path');
var d=mod==='ok'?'M8 12.5l2.6 2.6L16 9.5':mod==='amber'?'M12 7.5V12l3 1.8':mod==='bad'?'M12 8v5M12 16h.01':'M9 9l6 6M15 9l-6 6';
p.setAttribute('d',d);p.setAttribute('fill','none');p.setAttribute('stroke','#feefb8');p.setAttribute('stroke-width','2.4');p.setAttribute('stroke-linecap','round');p.setAttribute('stroke-linejoin','round');
s.appendChild(p);
return s;
}
function cdBox(){
var w=ce('span','ord-cd');
['h','j','m'].forEach(function(u){var i=document.createElement('i');i.appendChild(ce('span','n','0'));var b=document.createElement('b');b.textContent=u;i.appendChild(b);w.appendChild(i)});
return w;
}
function logoNode(appName){
var box=ce('span','ord-nf');
var meta=Apps.get(appName);
if(meta&&meta.logo_path){var img=document.createElement('img');img.src=Apps.logoUrl(meta.logo_path);img.alt=appName||'';box.appendChild(img)}
else box.appendChild(document.createTextNode(String(appName||'?').charAt(0).toUpperCase()));
return box;
}
function build(o){
var card=ce('div','ord-card');
card.setAttribute('data-id',o.id);
var chead=ce('div','ord-chead');
var doc=ce('span','ord-doc');
doc.appendChild(admSvg('M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z M14 2v6h6 M8 13h5 M8 17h5','1.3rem','1.3rem'));
chead.appendChild(doc);
chead.appendChild(ce('div','ord-code',o.order_code||('#'+o.id)));
var cside=ce('span','ord-cside');
var mod=bMod(o.status);
var badge=ce('span','ord-badge '+mod);
var tick=ce('span','tick');
tick.appendChild(bSvg(mod));
badge.appendChild(tick);
badge.appendChild(document.createTextNode(bTxt(o.status)));
cside.appendChild(badge);
if(o.status==='delivered'&&o.expires_at){var cd=cdBox();cd.setAttribute('data-end',o.expires_at);cside.appendChild(cd)}
chead.appendChild(cside);
card.appendChild(chead);
var meta=ce('div','ord-meta');
var m1=ce('span','ord-m');
m1.appendChild(admSvg('M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2 M12 3a4 4 0 1 0 0 8 4 4 0 0 0 0-8z','.92rem','.92rem'));
m1.appendChild(document.createTextNode((o.username||'?')+(o.display_name?(' • '+o.display_name):'')));
meta.appendChild(m1);
var m2=ce('span','ord-m');
m2.appendChild(admSvg('M3 4.5h18v17H3z M3 9.5h18 M8 2.5v4 M16 2.5v4','.92rem','.92rem'));
m2.appendChild(document.createTextNode(fmtDT(o.created_at)));
meta.appendChild(m2);
card.appendChild(meta);
var items=o.items_summary||[];
if(items.length){
var it=items[0];
var row=ce('div','ord-item');
row.appendChild(logoNode(it.app_name));
row.appendChild(ce('span','ord-name',it.app_name+' ×'+it.qty));
card.appendChild(row);
if(items.length>1)card.appendChild(ce('div','ord-extra','+'+(items.length-1)+' item lainnya'));
}else{card.appendChild(ce('div','ord-extra','Tidak ada item'))}
var trow=ce('div','ord-trow');
trow.appendChild(ce('span',null,'TOTAL'));
trow.appendChild(ce('strong',null,fmtRp(o.total_amount)));
card.appendChild(trow);
var det=ce('button','ord-detail','KETUK UNTUK DETAIL');
det.type='button';
det.appendChild(admSvg('M9 5l7 7-7 7','.85rem','.85rem'));
card.appendChild(det);
card.addEventListener('click',function(){if(M.openDetail)M.openDetail(o.id)});
return card;
}
function tickCd(root){
var now=Date.now();
var els=root.querySelectorAll('.ord-cd[data-end]');
for(var i=0;i<els.length;i++){
var el=els[i];
var t=Date.parse(String(el.getAttribute('data-end')).replace(' ','T')+'Z');
var rem=isNaN(t)?0:Math.max(0,t-now);
var d=Math.floor(rem/86400000),h=Math.floor((rem%86400000)/3600000),m=Math.floor((rem%3600000)/60000);
var ns=el.querySelectorAll('.n');
if(ns.length>=3){ns[0].textContent=d;ns[1].textContent=h;ns[2].textContent=m}
el.classList.toggle('warn',rem>0&&rem<86400000);
el.classList.toggle('exp',rem<=0);
}
}
function startCd(root){Clock.sec('pesanan',function(){tickCd(root)})}
M.buildCard=build;
M.startCd=startCd;
M.tickCd=tickCd;
M.statusPill=pill;
})(AdminModules.pesanan=AdminModules.pesanan||{});
