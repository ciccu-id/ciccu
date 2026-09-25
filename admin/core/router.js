var Router=(function(){
var cur=null,applying=false;
function navItems(){return Array.prototype.slice.call(document.querySelectorAll('[data-nav]'))}
function setActive(name){navItems().forEach(function(el){var on=el.getAttribute('data-nav')===name;el.classList.toggle('active',on);if(on)el.setAttribute('aria-current','page');else el.removeAttribute('aria-current')});var t=document.getElementById('admTopbarTitle');if(t)t.textContent=Reg.title(name)||''}
function go(name,opts){
opts=opts||{};
if(!Reg.has(name))name=Reg.def;
if(name===cur&&!opts.force)return Promise.resolve();
cur=name;
setActive(name);
if(!opts.silent){applying=true;location.hash='#/'+name;setTimeout(function(){applying=false},0)}
return Loader.mount(name);
}
function fromHash(){var h=String(location.hash||'').replace(/^#\/?/,'');return Reg.has(h)?h:null}
function reset(){cur=null}
function start(){
document.addEventListener('click',function(e){var el=e.target&&e.target.closest?e.target.closest('[data-nav]'):null;if(!el)return;e.preventDefault();go(el.getAttribute('data-nav'))});
window.addEventListener('hashchange',function(){if(applying)return;var n=fromHash();if(n&&n!==cur)go(n,{silent:true})});
go(fromHash()||Reg.def,{silent:true});
}
return{go:go,start:start,reset:reset,current:function(){return cur}};
})();
