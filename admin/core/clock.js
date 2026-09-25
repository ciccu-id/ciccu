var Clock=(function(){
var reg={};
function bucket(name){if(!reg[name])reg[name]={i:[],t:[]};return reg[name]}
function every(name,fn,ms){var b=bucket(name);var id=setInterval(fn,ms);b.i.push(id);return id}
function sec(name,fn){return every(name,fn,1000)}
function timeout(name,fn,ms){var b=bucket(name);var id=setTimeout(function(){var ix=b.t.indexOf(id);if(ix>=0)b.t.splice(ix,1);fn()},ms);b.t.push(id);return id}
function clear(name,id){var b=reg[name];if(!b)return;var ix=b.i.indexOf(id);if(ix>=0){clearInterval(id);b.i.splice(ix,1);return}var ty=b.t.indexOf(id);if(ty>=0){clearTimeout(id);b.t.splice(ty,1)}}
function dispose(name){var b=reg[name];if(!b)return;b.i.forEach(function(id){clearInterval(id)});b.t.forEach(function(id){clearTimeout(id)});delete reg[name]}
function disposeAll(){Object.keys(reg).forEach(dispose)}
function cdTags(name,root,sel){return every(name,function(){var els=(root||document).querySelectorAll(sel||'[data-cd]');for(var i=0;i<els.length;i++){var el=els[i];if(!el.dataset.cdbase)el.dataset.cdbase=el.className;var r=fmtRemain(el.getAttribute('data-cd'));el.className=el.dataset.cdbase+' '+r.mod;el.textContent=r.text}},1000)}
if(window.Sec)Sec.onLockdown(disposeAll);
return{every:every,sec:sec,timeout:timeout,clear:clear,dispose:dispose,disposeAll:disposeAll,cdTags:cdTags};
})();
