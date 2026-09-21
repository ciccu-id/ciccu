function ce(t,c,x){var e=document.createElement(t);if(c)e.className=c;if(x!==undefined&&x!==null)e.textContent=x;return e}
var FlashSale={
startMs:null,endMs:null,timer:null,active:false,name:'Flash Sale',desc:'',onExpire:null,items:[],wasUpcoming:false,el:null,itemsEl:null,
init:function(s,cb){
this.stop();this.onExpire=cb||null;this.name=s.name||'Flash Sale';this.desc=s.description||'';
this.itemsEl=null;
if(!s.start||!s.end){this.active=false;return}
this.startMs=this.parseWIB(s.start);this.endMs=this.parseWIB(s.end);
if(!this.startMs||!this.endMs||this.endMs<=this.startMs){this.active=false;return}
this.active=true;this.wasUpcoming=Date.now()<this.startMs;
},
setItems:function(apps){if(!this.active)return;this.items=this.extract(apps)},
extract:function(apps){
var items=[],names=Object.keys(apps);
for(var i=0;i<names.length;i++){
var info=apps[names[i]];if(!info||!info.packages)continue;
for(var j=0;j<info.packages.length;j++){
var p=info.packages[j];
if(p.flash_price&&p.flash_price.trim()!==''){
var fv=typeof extractNumK==='function'?extractNumK(p.flash_price):0;
var nv=typeof extractNumK==='function'?extractNumK(p.price):0;
if(fv>0&&fv<nv)items.push({appName:names[i],category:p.category,duration:p.duration,price:p.price,flash_price:p.flash_price,status:p.status||'Ready',flash_sort_order:(p.flash_sort_order&&p.flash_sort_order>0&&p.flash_sort_order<9999)?p.flash_sort_order:9999});
}}}
items.sort(function(a,b){return(a.flash_sort_order-b.flash_sort_order)||a.appName.localeCompare(b.appName)});
return items;
},
parseWIB:function(str){
if(!str)return null;
try{
var parts=str.split('T');if(parts.length<2)return null;
var d=parts[0].split('-').map(Number),t=parts[1].split(':').map(Number);
if(d.length<3||t.length<2)return null;
if([d[0],d[1],d[2],t[0],t[1]].some(isNaN))return null;
return Date.UTC(d[0],d[1]-1,d[2],t[0]-7,t[1],0);
}catch(e){return null}
},
isActive:function(){return this.active&&Date.now()>=this.startMs&&Date.now()<=this.endMs},
isUpcoming:function(){return this.active&&Date.now()<this.startMs},
getEffectivePrice:function(item){
if(!this.isActive())return{price:item.price,isFlash:false};
if(item.flash_price&&item.flash_price.trim()!==''){
var fv=typeof extractNumK==='function'?extractNumK(item.flash_price):0;
var nv=typeof extractNumK==='function'?extractNumK(item.price):0;
if(fv>0&&fv<nv)return{price:item.flash_price,originalPrice:item.price,isFlash:true};
}
return{price:item.price,isFlash:false};
},
startCountdown:function(){this.stop();this.update();var self=this;this.timer=setInterval(function(){self.update()},1000)},
stop:function(){if(this.timer){clearInterval(this.timer);this.timer=null}},
update:function(){
var now=Date.now();
if(now>this.endMs){this.stop();this.active=false;this.hide();if(this.onExpire)this.onExpire();return}
var upcoming=now<this.startMs;
var target=upcoming?this.startMs:this.endMs;
if(this.wasUpcoming&&!upcoming){this.wasUpcoming=false;this.renderItems()}
var st=document.getElementById('fsStatusText');
if(st)st.textContent=upcoming?'Mulai dalam':'Berakhir dalam';
var diff=Math.max(0,Math.floor((target-now)/1000));
var h=Math.floor(diff/3600),m=Math.floor((diff%3600)/60),s=diff%60;
var pill=document.getElementById('fsCountdownPill');
if(pill)pill.textContent=String(h).padStart(2,'0')+':'+String(m).padStart(2,'0')+':'+String(s).padStart(2,'0');
},
render:function(){
if(!this.active)return null;
var sec=ce('div','fs-section fade-in-down');
var hdr=ce('div','fs-header');
var left=ce('div','fs-head-left');
var title=ce('h2','fs-title');
title.appendChild(ce('span',null,'⚡'));
title.appendChild(ce('span',null,this.name));
left.appendChild(title);
if(this.desc)left.appendChild(ce('p','fs-desc',this.desc));
hdr.appendChild(left);
var right=ce('div','fs-head-right');
var status=ce('p','fs-status',this.isUpcoming()?'Mulai dalam':'Berakhir dalam');
status.id='fsStatusText';
right.appendChild(status);
var pill=ce('div','fs-pill','00:00:00');
pill.id='fsCountdownPill';
right.appendChild(pill);
hdr.appendChild(right);
sec.appendChild(hdr);
sec.appendChild(ce('div','fs-divider'));
var items=ce('div','fs-items');
this.itemsEl=items;
sec.appendChild(items);
this.el=sec;
this.renderItems();
this.startCountdown();
return sec;
},
renderItems:function(){
var container=this.itemsEl;
if(!container)return;
while(container.firstChild)container.removeChild(container.firstChild);
if(!this.items.length){if(this.el)this.el.classList.add('hidden');return}
if(this.el)this.el.classList.remove('hidden');
var isUpcoming=this.isUpcoming();
for(var i=0;i<this.items.length;i++){
var item=this.items[i],isSold=item.status&&item.status.toLowerCase()!=='ready';
var card=ce('div','fs-card');
card.appendChild(ce('div','fs-card-badge','⚡'));
var top=ce('div','fs-card-top');
var logoWrap=ce('div','fs-card-logo');
var logoUrl=typeof getLogoUrl==='function'?getLogoUrl(item.appName):'';
if(logoUrl){var img=ce('img');img.setAttribute('src',logoUrl);img.setAttribute('alt',item.appName);img.setAttribute('loading','lazy');logoWrap.appendChild(img)}
else logoWrap.appendChild(ce('span',null,item.appName.charAt(0)));
top.appendChild(logoWrap);
top.appendChild(ce('p','fs-card-name',item.appName));
card.appendChild(top);
card.appendChild(ce('p','fs-card-pkg',item.category+' • '+item.duration));
var prices=ce('div','fs-card-prices');
prices.appendChild(ce('span','fs-card-old',item.price));
prices.appendChild(ce('span','fs-card-new',item.flash_price));
card.appendChild(prices);
var btn=ce('button','fs-card-btn');
btn.setAttribute('type','button');
btn.setAttribute('data-app',item.appName);
btn.setAttribute('data-cat',item.category);
btn.setAttribute('data-dur',item.duration);
btn.setAttribute('data-price',item.flash_price);
if(isSold){btn.textContent='Kosong';btn.classList.add('sold');btn.disabled=true}
else if(isUpcoming){btn.textContent='Belum Mulai';btn.classList.add('disabled');btn.disabled=true}
else{
btn.textContent='+ Tambah';
var self=this;
btn.addEventListener('click',function(){
var a=this.getAttribute('data-app'),c=this.getAttribute('data-cat'),d=this.getAttribute('data-dur'),p=this.getAttribute('data-price');
if(typeof addToCart==='function')addToCart(a,c,d,p);
self._updateBtn(this,a,c,d);
});
}
card.appendChild(btn);
container.appendChild(card);
}
},
_updateBtn:function(btn,app,cat,dur){
if(typeof cart==='undefined')return;
var qty=0;
for(var i=0;i<cart.length;i++){if(cart[i].app===app&&cart[i].cat===cat&&cart[i].dur===dur){qty=cart[i].qty;break}}
if(qty>0){btn.textContent=qty+' pcs ✓';btn.classList.add('active')}
else{btn.textContent='+ Tambah';btn.classList.remove('active')}
},
hide:function(){if(this.el)this.el.classList.add('hidden')}
};
