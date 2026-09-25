var APP_V='23';
var AdminModules={};
function ce(t,c,x){var e=document.createElement(t);if(c)e.className=c;if(x!==undefined&&x!==null)e.textContent=x;return e}
function admSvg(d,w,h){var ns='http://www.w3.org/2000/svg',s=document.createElementNS(ns,'svg');s.setAttribute('viewBox','0 0 24 24');s.setAttribute('fill','none');s.setAttribute('stroke','currentColor');s.setAttribute('stroke-width','2');s.setAttribute('stroke-linecap','round');s.setAttribute('stroke-linejoin','round');if(w)s.style.width=w;if(h)s.style.height=h;var p=document.createElementNS(ns,'path');p.setAttribute('d',d);s.appendChild(p);return s}
function frag(h){var t=document.createElement('template');t.innerHTML=String(h).trim();return t.content}
function esc(s){if(s===undefined||s===null)return'';return String(s).replace(/[&<>'"]/g,function(m){return{'&':'&amp;','<':'&lt;','>':'&gt;',"'":'&#39;','"':'&quot;'}[m]})}
function qs(s,r){return(r||document).querySelector(s)}
function qsa(s,r){return Array.prototype.slice.call((r||document).querySelectorAll(s))}
function debounce(fn,ms){var t=null;return function(){var a=arguments,c=this;clearTimeout(t);t=setTimeout(function(){fn.apply(c,a)},ms)}}
var Store={
get:function(k,d){try{var v=sessionStorage.getItem(k);return v===null?(d===undefined?null:d):JSON.parse(v)}catch(e){return d===undefined?null:d}},
set:function(k,v){try{sessionStorage.setItem(k,JSON.stringify(v))}catch(e){}},
del:function(k){try{sessionStorage.removeItem(k)}catch(e){}},
clearAll:function(){try{sessionStorage.clear()}catch(e){}}
};
