(function(M){
var root=null,docHandler=null;
function bindToggles(){
Array.prototype.forEach.call(root.querySelectorAll('[data-racc-toggle]'),function(b){
b.addEventListener('click',function(){
var p=document.getElementById(b.getAttribute('data-racc-toggle'));
if(!p)return;
p.style.scrollMarginTop='4.2rem';
var was=p.classList.contains('collapsed');
p.classList.toggle('collapsed');
if(was)setTimeout(function(){p.scrollIntoView({behavior:'smooth',block:'start'})},60);
});
});
}
function init(host){
root=host;
root.appendChild(M.view());
bindToggles();
var se=document.getElementById('resellerSearchInput');
if(se)se.addEventListener('input',debounce(function(){M.setFilter(se.value)},250));
docHandler=function(e){if(!e.target.closest||!e.target.closest('.racc-prof'))M.closeMenus()};
document.addEventListener('click',docHandler);
Clock.cdTags('akses',root);
return Promise.all([M.tokensInit(),M.accountsInit()]).catch(function(e){uiAlert(e.message||'Gagal memuat data halaman.','Kesalahan')});
}
function destroy(){
if(docHandler){document.removeEventListener('click',docHandler);docHandler=null}
root=null;
}
M.init=init;
M.destroy=destroy;
})(AdminModules.akses=AdminModules.akses||{});
