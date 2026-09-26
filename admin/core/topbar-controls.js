var TopbarControls=(function(){
var mq=window.matchMedia?window.matchMedia('(min-width:768px)'):null;
var bound=false,slot=null,cur=null;
function getSlot(){if(!slot)slot=document.getElementById('topbarControls');return slot}
function isDesktop(){return mq?mq.matches:(window.innerWidth>=768)}
function toTopbar(){
if(!cur)return;
var s=getSlot();if(!s)return;
var node=cur.node;
if(node.parentNode===s)return;
s.appendChild(node);
node.classList.add('tc-in-topbar');
}
function toOrigin(){
if(!cur)return;
var node=cur.node,p=cur.parent,nx=cur.next;
if(node.parentNode===p){node.classList.remove('tc-in-topbar');return}
if(nx&&nx.parentNode===p)p.insertBefore(node,nx);
else if(p)p.appendChild(node);
node.classList.remove('tc-in-topbar');
}
function place(){if(isDesktop())toTopbar();else toOrigin()}
function onChange(){place()}
function ensureListener(){
if(bound||!mq)return;
if(mq.addEventListener)mq.addEventListener('change',onChange);
else if(mq.addListener)mq.addListener(onChange);
bound=true;
}
function attach(node){
if(!node)return;
if(cur&&cur.node===node){place();return}
if(cur)toOrigin();
cur={node:node,parent:node.parentNode,next:node.nextSibling};
ensureListener();
place();
}
function detach(node){
if(!node)return;
if(cur&&cur.node===node){toOrigin();cur=null}
}
return{attach:attach,detach:detach};
})();
