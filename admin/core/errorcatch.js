(function(){
function show(msg){
var d=document.getElementById('errBanner');
if(!d){
d=document.createElement('div');
d.id='errBanner';
d.style.cssText='position:fixed;top:0;left:0;right:0;z-index:999999;background:#a85555;color:#fff;padding:.6rem .75rem;font-size:.72rem;font-weight:700;white-space:pre-wrap;box-shadow:0 4px 12px rgba(0,0,0,.3);font-family:ui-monospace,monospace;';
document.documentElement.appendChild(d);
}
d.textContent='\u26A0 '+msg;
}
window.addEventListener('error',function(ev){
show((ev.message||'Error')+' @ '+(ev.filename?String(ev.filename).split('/').pop():'')+':'+(ev.lineno||''));
},true);
window.addEventListener('unhandledrejection',function(ev){
var r=ev.reason;
show('Promise: '+((r&&r.message)?r.message:String(r)));
});
})();
