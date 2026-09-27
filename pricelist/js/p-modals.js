import{ce,svgI,ICON}from'./p-core.js';
import{S}from'./p-state.js';
export function modalShell(o){
var el=ce('div','modal-overlay');el.classList.add('hidden');
var bd=ce('div','modal-backdrop');el.appendChild(bd);
var box=ce('div','modal-box');
var head=ce('div','modal-head');
var headRow=ce('div','modal-head-row');
var logo=null;
if(o.logo){logo=ce('div','modal-logo');headRow.appendChild(logo)}
var title=ce('h3',o.titleClass||null,o.title||'');
headRow.appendChild(title);head.appendChild(headRow);
var closeBtn=ce('button','modal-close');closeBtn.setAttribute('type','button');closeBtn.appendChild(svgI(ICON.close,'1rem','1rem'));
head.appendChild(closeBtn);
box.appendChild(head);
var body=ce('div','modal-body');
if(o.bodyStyle)for(var k in o.bodyStyle)body.style[k]=o.bodyStyle[k];
box.appendChild(body);
el.appendChild(box);
document.body.appendChild(el);
function open(){el.classList.remove('hidden');setTimeout(function(){bd.classList.add('show');box.classList.add('show')},10)}
function close(){bd.classList.remove('show');box.classList.remove('show');setTimeout(function(){el.classList.add('hidden')},300)}
bd.addEventListener('click',close);
closeBtn.addEventListener('click',close);
return{el:el,box:box,head:head,headRow:headRow,logo:logo,title:title,body:body,open:open,close:close};
}
var closedEl=null;
export function showStoreClosed(msg){
if(msg)S.storeClosedMsg=msg;
if(!closedEl){
closedEl=ce('div','store-closed-overlay');
var box=ce('div','store-closed-box');
var icon=ce('div','store-closed-icon');icon.appendChild(svgI(ICON.lock,'1.75rem','1.75rem'));box.appendChild(icon);
box.appendChild(ce('h3','font-logo','Ciccu Store Tutup 🌙'));
var p=ce('p',null,S.storeClosedMsg);p.id='storeClosedText';box.appendChild(p);
var ok=ce('button','btn btn-primary');ok.setAttribute('type','button');ok.style.width='100%';ok.textContent='Mengerti 💕';
ok.addEventListener('click',hideStoreClosed);
box.appendChild(ok);closedEl.appendChild(box);
document.body.appendChild(closedEl);
}else{
var t=document.getElementById('storeClosedText');if(t)t.textContent=S.storeClosedMsg;
closedEl.classList.remove('hidden');
}
}
export function hideStoreClosed(){if(closedEl)closedEl.classList.add('hidden')}
export function guardClosed(){if(S.storeClosed){showStoreClosed();return true}return false}
