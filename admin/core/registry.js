var REGISTRY={
beranda:{title:'Dashboard',css:['modules/beranda/beranda.css'],js:['modules/beranda/beranda.view.js','modules/beranda/beranda.js']},
katalog:{title:'Katalog Publik',css:['modules/katalog/katalog.css'],js:['modules/katalog/katalog.view.js','modules/katalog/katalog.groups.js','modules/katalog/katalog.bulk.js','modules/katalog/katalog.js']},
reseller:{title:'Pricelist & Stok',css:['modules/reseller/reseller.css'],js:['modules/reseller/reseller.view.js','modules/reseller/reseller.groups.js','modules/reseller/reseller.stock.js','modules/reseller/reseller.js']},
pesanan:{title:'Order Reseller',css:['modules/pesanan/pesanan.css'],js:['modules/pesanan/pesanan.view.js','modules/pesanan/pesanan.cards.js','modules/pesanan/pesanan.receipt.js','modules/pesanan/pesanan.js']},
akses:{title:'Akun Reseller',css:['modules/akses/akses.css'],js:['modules/akses/akses.view.js','modules/akses/akses.tokens.js','modules/akses/akses.accounts.js','modules/akses/akses.js']},
flashsale:{title:'Flash Sale',css:['modules/flashsale/flashsale.css'],js:['modules/flashsale/flashsale.view.js','modules/flashsale/flashsale.js']},
pengaturan:{title:'Pengaturan',css:['modules/pengaturan/pengaturan.css'],js:['modules/pengaturan/pengaturan.js']},
aktivitas:{title:'Aktivitas Admin',css:['modules/aktivitas/aktivitas.css'],js:['modules/aktivitas/aktivitas.js']}
};
var Reg={
def:'beranda',
get:function(n){return REGISTRY[n]||null},
has:function(n){return Object.prototype.hasOwnProperty.call(REGISTRY,n)},
names:function(){return Object.keys(REGISTRY)},
title:function(n){var m=REGISTRY[n];return m?m.title:''}
};
