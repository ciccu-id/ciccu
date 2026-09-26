var Apps=(function(){
var meta=null,forms=null,pendMeta=null,pendForms=null;
function loadMeta(){
if(meta)return meta;
meta=Sec.json('/api/admin/app-metadata').then(function(rows){
var m={};
(rows||[]).forEach(function(r){m[String(r.app_name).toLowerCase().trim()]=r});
meta=m;
return m;
}).catch(function(){meta={};return{}});
return meta;
}
function loadForms(){
if(forms)return forms;
forms=Sec.json('/api/admin/forms').then(function(rows){
var f={};
(rows||[]).forEach(function(r){f[String(r.app_name).toLowerCase().trim()]=r});
forms=f;
return f;
}).catch(function(){forms={};return{}});
return forms;
}
function get(name){
if(!meta)return null;
if(meta.then)return null;
return meta[String(name).toLowerCase().trim()]||null;
}
function form(name){
if(!forms)return null;
if(forms.then)return null;
return forms[String(name).toLowerCase().trim()]||null;
}
function logoUrl(slug){
return slug?'/api/logo/'+encodeURIComponent(slug):'';
}
function fieldsFrom(str){
if(!str)return[];
try{
if(String(str).trim().startsWith('['))return JSON.parse(str).map(function(i){return i.name||i});
}catch(e){}
return String(str).split(',').map(function(s){return s.trim()}).filter(Boolean);
}
function fields(name){
var f=form(name);
return f?fieldsFrom(f.form_fields||''):[];
}
function invalidate(which){
if(!which||which==='meta'){meta=null}
if(!which||which==='forms'){forms=null}
}
function reset(){meta=null;forms=null;pendMeta=null;pendForms=null}
if(window.Sec)Sec.onLockdown(reset);
return{meta:loadMeta,forms:loadForms,get:get,form:form,logoUrl:logoUrl,fields:fields,fieldsFrom:fieldsFrom,invalidate:invalidate,reset:reset};
})();
