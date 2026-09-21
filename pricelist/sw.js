var CACHE='ciccu-v1';
var ASSETS=['./index.html','./css/style.css','./css/custom.css','./js/flashsale.js','./js/cart.js','./js/pricelist.js','./js/welcome.js','./js/app.js','./manifest.json','./icon-192.png','./icon-512.png'];
self.addEventListener('install',function(e){
e.waitUntil(caches.open(CACHE).then(function(c){return c.addAll(ASSETS)}));
});
self.addEventListener('activate',function(e){
e.waitUntil(caches.keys().then(function(keys){
return Promise.all(keys.map(function(k){if(k!==CACHE)return caches.delete(k)}));
}));
});
self.addEventListener('fetch',function(e){
e.respondWith(fetch(e.request).catch(function(){return caches.match(e.request)}));
});
