var DD=(function(){
function closeAll(except){Array.prototype.forEach.call(document.querySelectorAll('.dd.open'),function(d){if(d!==except)d.classList.remove('open')})}
document.addEventListener('click',function(e){if(!e.target.closest||!e.target.closest('.dd'))closeAll(null)});
function build(cfg){
cfg=cfg||{};
var el=ce('div','dd'+(cfg.cls?' '+cfg.cls:''));
var btn=ce('button','dd-btn');btn.type='button';
if(cfg.leading)btn.appendChild(cfg.leading);
var label=ce('span','dd-label',cfg.placeholder||'');
btn.appendChild(label);
btn.appendChild(admSvg('M19 9l-7 7-7-7','.75rem','.75rem'));
el.appendChild(btn);
var menu=ce('div','dd-menu');
var items=cfg.options||[];
var cur=(cfg.value!==undefined&&cfg.value!==null)?cfg.value:(items.length?items[0].value:null);
items.forEach(function(opt){
var it=ce('div','dd-item');
it.setAttribute('data-value',String(opt.value));
it.appendChild(ce('span',null,opt.label));
it.appendChild(ce('span','dd-check'));
it.addEventListener('click',function(){set(opt.value,true);closeAll(null)});
menu.appendChild(it);
});
el.appendChild(menu);
btn.addEventListener('click',function(e){e.stopPropagation();var will=!el.classList.contains('open');closeAll(null);if(will)el.classList.add('open')});
function set(v,fire){
cur=v;
Array.prototype.forEach.call(menu.children,function(it){
var on=it.getAttribute('data-value')===String(v);
it.classList.toggle('active',on);
if(on&&it.firstChild)label.textContent=it.firstChild.textContent;
});
if(fire&&cfg.onChange)cfg.onChange(v);
}
set(cur,false);
return{el:el,get:function(){return cur},set:function(v){set(v,false)},fire:function(){if(cfg.onChange)cfg.onChange(cur)},label:label};
}
return{build:build,closeAll:closeAll};
})();
