var Apps=(function(){
var meta=null,forms=null,pendMeta=null,pendForms=null;
function loadMeta(){if(meta)return Promise.resolve(meta);if(pendMeta)return pendMeta;pendMeta=Sec.json('/api/admin/app-metadata').then(function(rows){meta={};(rows||[]).forEach(function(m){meta[String(m.app_name).toLowerCase().trim()]=m});pendMeta=null;return meta}).catch(function(e){pendMeta=null;throw e});return pendMeta}
function loadForms(){if(forms)return Promise.resolve(forms);if(pendForms)return pendForms;pendForms=Sec.json('/api/admin/forms').then(function(rows){forms={};(rows||[]).forEach(function(f){forms[String(f.app_name).toLowerCase().trim()]=f});pendForms=null;return forms}).catch(function(e){pendForms=null;throw e});return pendForms}
function get(name){if(!meta)return null;return meta[String(name).toLowerCase().trim()]||null}
function form(name){if(!forms)return null;return forms[String(name).toLowerCase().trim()]||null}
function logoUrl(slug){return slug?'/api/logo/'+encodeURIComponent(slug):''}
function invalidate(which){if(!which||which==='meta')meta=null;if(!which||which==='forms')forms=null}
function reset(){meta=null;forms=null;pendMeta=null;pendForms=null}
if(window.Sec)Sec.onLockdown(reset);
return{meta:loadMeta,forms:loadForms,get:get,form:form,logoUrl:logoUrl,invalidate:invalidate,reset:reset};
})();
