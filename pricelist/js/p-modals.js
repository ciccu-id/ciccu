import{ce,svgI,ICON}from'./p-core.js';
import{S}from'./p-state.js';
var _uid=0;
var FOCUS_SEL='a[href],button:not([disabled]),input:not([disabled]),select:not([disabled]),textarea:not([disabled]),[tabindex]:not([tabindex="-1"])';
export function dialogA11y(el,box,opts){
opts=opts||{};
el.setAttribute('role','dialog');
el.setAttribute('aria-modal','true');
box.setAttribute('tabindex','-1');
function active(){return opts.isActive?opts.isActive():!el.classList.contains('hidden')}
function list(){return box.querySelectorAll(FOCUS_SEL)}
function onKey(e){
if(!active())return;
if(e.key==='Escape'){if(opts.escape!==false){e.preventDefault();if(opts.onEscape)opts.onEscape()}return}
if(e.key!=='Tab')return;
var f=list();
if(!f.length){e.preventDefault();box.focus();return}
var first=f[0],last=f[f.length-1],ae=document.activeElement;
if(e.shiftKey){if(ae===first||ae===box||!box.contains(ae)){e.preventDefault();last.focus()}}
else{if(ae===last||!box.contains(ae)){e.preventDefault();first.focus()}}
}
el.addEventListener('keydown',onKey);
return{
focusFirst:function(){var f=list();if(f.length)f[0].focus();else box.focus()},
focusLast:function(){var f=list();if(f.length)f[f.length-1].focus();else box.focus()}
}
}
export function modalShell(o){
var el=ce('div','modal-overlay');el.classList.add('hidden');
var bd=ce('div','modal-backdrop');el.appendChild(bd);
var box=ce('div','modal-box');
var head=ce('div','modal-head');
var headRow=ce('div','modal-head-row');
var logo=null;
if(o.logo){logo=ce('div','modal-logo');headRow.appendChild(logo)}
var title=ce('h3',o.titleClass||null,o.title||'');
var tid='md-t-'+(++_uid);title.id=tid;
headRow.appendChild(title);head.appendChild(headRow);
var closeBtn=ce('button','modal-close');closeBtn.setAttribute('type','button');closeBtn.appendChild(svgI(ICON.close,'1rem','1rem'));
head.appendChild(closeBtn);
box.appendChild(head);
box.setAttribute('aria-labelledby',tid);
var body=ce('div','modal-body');
if(o.bodyStyle)for(var k in o.bodyStyle)body.style[k]=o.bodyStyle[k];
box.appendChild(body);
el.appendChild(box);
document.body.appendChild(el);
var isOpen=false,savedFocus=null;
var a11y=dialogA11y(el,box,{isActive:function(){return isOpen},onEscape:function(){close()}});
function open(){
if(isOpen)return;
isOpen=true;
savedFocus=document.activeElement;
el.classList.remove('hidden');
requestAnimationFrame(function(){
bd.classList.add('show');box.classList.add('show');
requestAnimationFrame(function(){box.focus()});
});
}
function close(){
if(!isOpen)return;
isOpen=false;
bd.classList.remove('show');box.classList.remove('show');
setTimeout(function(){el.classList.add('hidden')},300);
if(savedFocus&&typeof savedFocus.focus==='function'){try{savedFocus.focus()}catch(e){}}
savedFocus=null;
}
bd.addEventListener('click',close);
closeBtn.addEventListener('click',close);
return{el:el,box:box,head:head,headRow:headRow,logo:logo,title:title,body:body,open:open,close:close,a11y:a11y};
}
var closedEl=null,scA11y=null,scOk=null;
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
scA11y=dialogA11y(closedEl,box,{escape:false});
scOk=ok;
}else{
var t=document.getElementById('storeClosedText');if(t)t.textContent=S.storeClosedMsg;
closedEl.classList.remove('hidden');
}
requestAnimationFrame(function(){if(scOk)scOk.focus()});
}
export function hideStoreClosed(){if(closedEl)closedEl.classList.add('hidden')}
export function guardClosed(){if(S.storeClosed){showStoreClosed();return true}return false}

