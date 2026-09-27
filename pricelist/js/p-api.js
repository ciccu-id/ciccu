import{S}from'./p-state.js';
const BASE='';
export function fetchJSON(url){return fetch(BASE+url).then(function(r){if(!r.ok)throw new Error('HTTP '+r.status);return r.json()})}
export function loadSettings(){return fetchJSON('/api/settings')}
export function loadPricelist(){return fetchJSON('/api/pricelist')}
export function loadForms(){return fetchJSON('/api/forms')}
export function loadMetadata(){return fetchJSON('/api/metadata').catch(function(){return[]})}
export function buildApps(data){
var apps={},minOrder={},firstId={};
data.sort(function(a,b){var aA=(a.app_sort_order&&a.app_sort_order>0)?a.app_sort_order:9999,bA=(b.app_sort_order&&b.app_sort_order>0)?b.app_sort_order:9999,aP=(a.sort_order&&a.sort_order>0)?a.sort_order:9999,bP=(b.sort_order&&b.sort_order>0)?b.sort_order:9999;return(aA-bA)||(aP-bP)||(a.id-b.id)});
data.forEach(function(item){var name=item.app_name,order=(item.app_sort_order&&item.app_sort_order>0)?item.app_sort_order:9999;
if(!apps[name]){apps[name]={packages:[]};minOrder[name]=order;firstId[name]=item.id}
else{if(order<minOrder[name])minOrder[name]=order;if(item.id<firstId[name])firstId[name]=item.id}
apps[name].packages.push({category:item.category,duration:item.duration,price:item.price,notes:item.notes||'',status:item.status||'Ready',id:item.id,flash_price:item.flash_price||'',flash_sort_order:item.flash_sort_order||9999})});
S.apps=apps;
S.appOrder=Object.keys(apps);
S.appOrder.sort(function(a,b){return(minOrder[a]-minOrder[b])||(firstId[a]-firstId[b])});
}
export function buildForms(forms){S.appForms={};if(Array.isArray(forms))forms.forEach(function(f){S.appForms[String(f.app_name).toLowerCase().trim()]=f.form_fields})}
export function buildMeta(meta){S.appMeta={};if(Array.isArray(meta))meta.forEach(function(m){S.appMeta[String(m.n).toLowerCase().trim()]=m})}
