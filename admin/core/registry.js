var Reg=(function(){
var REGISTRY={
beranda:{title:'Dashboard',files:['beranda.view.js','beranda.js'],css:'beranda.css'},
public:{title:'Katalog Publik',files:['public.view.js','public.groups.js','public.js'],css:'public.css'},
reseller:{title:'Pricelist & Stok',files:['reseller.view.js','reseller.groups.js','reseller.stock.js','reseller.js'],css:'reseller.css'},
pesanan:{title:'Order Reseller',files:['pesanan.view.js','pesanan.cards.js','pesanan.receipt.js','pesanan.js'],css:'pesanan.css'},
akses:{title:'Akun Reseller',files:['akses.view.js','akses.tokens.js','akses.accounts.js','akses.js'],css:'akses.css'},
flashsale:{title:'Flash Sale',files:['flashsale.view.js','flashsale.js'],css:'flashsale.css'},
pengaturan:{title:'Pengaturan',files:['pengaturan.view.js','pengaturan.js'],css:'pengaturan.css'},
aktivitas:{title:'Aktivitas Admin',files:['aktivitas.view.js','aktivitas.js'],css:'aktivitas.css'}
};
var cssLoaded={};
function title(name){var r=REGISTRY[name];return r?r.title:'Admin'}
function files(name){var r=REGISTRY[name];return r?r.files:[]}
function css(name){var r=REGISTRY[name];return r?r.css:null}
function has(name){return!!REGISTRY[name]}
function all(){return Object.keys(REGISTRY)}
function loadCss(name){
var c=css(name);
if(!c||cssLoaded[name])return Promise.resolve();
return new Promise(function(resolve,reject){
var link=document.createElement('link');
link.rel='stylesheet';
link.href='modules/'+name+'/'+c+'?v='+APP_V;
link.onload=function(){cssLoaded[name]=true;resolve()};
link.onerror=reject;
document.head.appendChild(link);
});
}
return{title:title,files:files,css:css,has:has,all:all,loadCss:loadCss};
})();
