import{RES,ce,svgI,resNum}from'./r-core.js';
export const FlashSale={
startMs:null,endMs:null,timer:null,active:false,name:'Flash Sale Reseller',desc:'',items:[],wasUpcoming:false,el:null,itemsEl:null,onAdd:null,onExpire:null,
init:function(s){
this.stop();
this.name=(s&&s.name)||'Flash Sale Reseller';
this.desc=(s&&s.description)||'';
this.itemsEl=null;
this.active=false;
if(!s||!s.start||!s.end)return;
this.startMs=this.parseWIB(s.start);
this.endMs=this.parseWIB(s.end);
if(!this.startMs||!this.endMs||this.endMs<=this.startMs)return;
this.active=true;
this.wasUpcoming=Date.now()<this.startMs
},
setItems:function(rows){
if(!this.active){this.items=[];return}
this.items=this.extract(rows||[])
},
extract:function(rows){
var items=[];
for(var i=0;i<rows.length;i++){
var p=rows[i];
if(p.flash_price&&String(p.flash_price).trim()!==''){
var fv=resNum(p.flash_price),nv=resNum(p.price);
if(fv>0&&fv<nv)items.push({variant_id:p.id,app_name:p.app_name,category:p.category,duration:p.duration,price:p.price,flash_price:p.flash_price,status:p.status||'Ready',flash_sort_order:(p.flash_sort_order&&p.flash_sort_order>0&&p.flash_sort_order<9999)?p.flash_sort_order:9999})
}
}
items.sort(function(a,b){return(a.flash_sort_order-b.flash_sort_order)||String(a.app_name).localeCompare(String(b.app_name))});
return items
},
parseWIB:function(str){
if(!str)return null;
try{
var parts=String(str).split('T');
if(parts.length<2)return null;
var d=parts[0].split('-').map(Number),t=parts[1].split(':').map(Number);
if(d.length<3||t.length<2)return null;
if([d[0],d[1],d[2],t[0],t[1]].some(isNaN))return null;
return Date.UTC(d[0],d[1]-1,d[2],t[0]-7,t[1],0)
}catch(e){return null}
},
isActive:function(){return this.active&&Date.now()>=this.startMs&&Date.now()<=this.endMs},
isUpcoming:function(){return this.active&&Date.now()<this.startMs},
getEffectivePrice:function(item){
if(!this.isActive())return{price:item.price,isFlash:false,originalPrice:item.price};
if(item.flash_price&&String(item.flash_price).trim()!==''){
var fv=resNum(item.flash_price),nv=resNum(item.price);
if(fv>0&&fv<nv)return{price:item.flash_price,isFlash:true,originalPrice:item.price}
}
return{price:item.price,isFlash:false,originalPrice:item.price}
},
startCountdown:function(){this.stop();this.update();var self=this;this.timer=setInterval(function(){self.update()},1000)},
stop:function(){if(this.timer){clearInterval(this.timer);this.timer=null}},
update:function(){
var now=Date.now();
if(now>this.endMs){this.stop();this.active=false;this.hide();if(this.onExpire)this.onExpire();return}
var upcoming=now<this.startMs,target=upcoming?this.startMs:this.endMs;
if(this.wasUpcoming&&!upcoming){this.wasUpcoming=false;this.renderItems()}
var st=document.getElementById('rFsStatusText');
if(st)st.textContent=upcoming?'Mulai dalam':'Berakhir dalam';
var diff=Math.max(0,Math.floor((target-now)/1000)),h=Math.floor(diff/3600),m=Math.floor((diff%3600)/60),s=diff%60;
var pill=document.getElementById('rFsCountdownPill');
if(pill)pill.textContent=String(h).padStart(2,'0')+':'+String(m).padStart(2,'0')+':'+String(s).padStart(2,'0')
},
render:function(){
if(!this.active)return null;
var sec=ce('div','r-fs-section');
var hdr=ce('div','r-fs-header');
var left=ce('div','r-fs-head-left');
var title=ce('h2','r-fs-title');
title.appendChild(ce('span',null,'⚡'));
title.appendChild(ce('span',null,this.name));
left.appendChild(title);
if(this.desc)left.appendChild(ce('p','r-fs-desc',this.desc));
hdr.appendChild(left);
var right=ce('div','r-fs-head-right');
var status=ce('p','r-fs-status',this.isUpcoming()?'Mulai dalam':'Berakhir dalam');
status.id='rFsStatusText';
right.appendChild(status);
var pill=ce('div','r-fs-pill','00:00:00');
pill.id='rFsCountdownPill';
right.appendChild(pill);
hdr.appendChild(right);
sec.appendChild(hdr);
sec.appendChild(ce('div','r-fs-divider'));
var items=ce('div','r-fs-items');
this.itemsEl=items;
sec.appendChild(items);
this.el=sec;
this.renderItems();
this.startCountdown();
return sec
},
renderItems:function(){
var container=this.itemsEl;
if(!container)return;
while(container.firstChild)container.removeChild(container.firstChild);
if(!this.items.length){if(this.el)this.el.classList.add('hidden');return}
if(this.el)this.el.classList.remove('hidden');
var isUpcoming=this.isUpcoming(),self=this;
for(var i=0;i<this.items.length;i++){
var item=this.items[i],isSold=item.status&&String(item.status).toLowerCase()!=='ready';
var card=ce('div','r-fs-card');
card.appendChild(ce('div','r-fs-card-badge','⚡'));
var top=ce('div','r-fs-card-top');
var logoWrap=ce('div','r-fs-card-logo');
logoWrap.appendChild(ce('span',null,String(item.app_name).charAt(0).toUpperCase()));
top.appendChild(logoWrap);
top.appendChild(ce('p','r-fs-card-name',item.app_name));
card.appendChild(top);
card.appendChild(ce('p','r-fs-card-pkg',item.category+' • '+item.duration));
var prices=ce('div','r-fs-card-prices');
prices.appendChild(ce('span','r-fs-card-old',item.price));
prices.appendChild(ce('span','r-fs-card-new',item.flash_price));
card.appendChild(prices);
var btn=ce('button','r-fs-card-btn');
btn.setAttribute('type','button');
if(isSold){btn.textContent='Kosong';btn.classList.add('sold');btn.disabled=true}
else if(isUpcoming){btn.textContent='Belum Mulai';btn.classList.add('disabled');btn.disabled=true}
else{
btn.textContent='+ Keranjang';
(function(vid,b){b.addEventListener('click',function(){if(self.onAdd)self.onAdd(vid);self._updateBtn(b,vid)})})(item.variant_id,btn)
}
card.appendChild(btn);
container.appendChild(card)
}
},
_updateBtn:function(btn,vid){
var qty=0;
for(var i=0;i<RES.cart.length;i++){if(RES.cart[i].variant_id===vid){qty=RES.cart[i].qty;break}}
if(qty>0){btn.textContent=qty+' pcs ✓';btn.classList.add('active')}
else{btn.textContent='+ Keranjang';btn.classList.remove('active')}
},
hide:function(){if(this.el)this.el.classList.add('hidden')}
};
