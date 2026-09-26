var TopbarControls=(function(){
var mq=window.matchMedia?window.matchMedia('(min-width:768px)'):null;
var bound=false,slot=null,reg=[];
function getSlot(){if(!slot)slot=document.getElementById('topbarControls');return slot}
function isDesktop(){return mq?mq.matches:(window.innerWidth>=768)}
function toTopbar(rec){
var s=getSlot();if(!s)return;
if(rec.node.parentNode===s)return;
s.appendChild(rec.node);
rec.node.classList.add('tc-in-topbar');
}
function toOrigin(rec){
var p=rec.parent;
if(!p||rec.node.parentNode===p){rec.node.classList.remove('tc-in-topbar');return}
if(rec.next&&rec.next.parentNode===p)p.insertBefore(rec.node,rec.next);
else p.appendChild(rec.node);
rec.node.classList.remove('tc-in-topbar');
}
function place(){var d=isDesktop();for(var i=0;i<reg.length;i++){if(d)toTopbar(reg[i]);else toOrigin(reg[i])}}
function onChange(){place()}
function ensureListener(){
if(bound||!mq)return;
if(mq.addEventListener)mq.addEventListener('change',onChange);
else if(mq.addListener)mq.addListener(onChange);
bound=true;
}
function attach(node){
if(!node)return;
for(var i=0;i<reg.length;i++){if(reg[i].node===node)return}
reg.push({node:node,parent:node.parentNode,next:node.nextSibling});
ensureListener();
place();
}
function detach(node){
for(var i=0;i<reg.length;i++){
if(reg[i].node===node){toOrigin(reg[i]);reg.splice(i,1);return}
}
}
return{attach:attach,detach:detach};
})();
