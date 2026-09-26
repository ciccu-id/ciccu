(function(M){
var full={},dd=null,listRoot=null;
function fallbackCopy(v,done){var ta=document.createElement('textarea');ta.value=v;ta.style.position='fixed';ta.style.opacity='0';document.body.appendChild(ta);ta.select();try{document.execCommand('copy');done()}catch(e){}document.body.removeChild(ta)}
function copyText(v){function done(){uiToast('Token disalin.')}if(navigator.clipboard&&navigator.clipboard.writeText){navigator.clipboard.writeText(v).then(done).catch(function(){fallbackCopy(v,done)})}else{fallbackCopy(v,done)}}
function buildDuration(){dd=DD.build({options:[{value:'24',label:'24 Jam'},{value:'168',label:'7 Hari'},{value:'720',label:'30 Hari'}],value:'168'});var slot=document.getElementById('tokenDurationSlot');if(slot){while(slot.firstChild)slot.removeChild(slot.firstChild);slot.appendChild(dd.el)}}
function tokenItem(t){
var fv=full[t.token_prefix]||'';
var item=ce('div','racc-titem');
var head=ce('div','racc-titem-head');
head.appendChild(ce('span','racc-titem-prefix',fv||t.token_prefix));
if(!fv)head.appendChild(ce('span','racc-titem-label','••••'));
if(t.label)head.appendChild(ce('span','racc-titem-label','— '+t.label));
var act=ce('div','racc-titem-act');
var cp=ce('button','racc-btn-butter');cp.type='button';cp.title='Salin token';
cp.appendChild(admSvg('M9 9h11v11H9zM5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1','.85rem','.85rem'));
cp.addEventListener('click',function(){copyText(fv||t.token_prefix)});
act.appendChild(cp);
var rv=ce('button','racc-btn-butter danger');rv.type='button';
rv.appendChild(admSvg('M3 6h18M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6z','.8rem','.8rem'));
rv.appendChild(document.createTextNode('Cabut'));
rv.addEventListener('click',function(){revoke(t)});
act.appendChild(rv);
head.appendChild(act);
item.appendChild(head);
var meta=ce('p','racc-titem-meta');
meta.appendChild(document.createTextNode(durLabel(t.duration_hours)+' • dibuat '+fmtDT(t.created_at)+' • sisa '));
var r=fmtRemain(t.expires_at);
var tag=ce('span','cd-tag '+r.mod,r.text);
tag.setAttribute('data-cd',t.expires_at);
meta.appendChild(tag);
item.appendChild(meta);
return item;
}
function loadTokens(){
listRoot=document.getElementById('regTokenList');
var badge=document.getElementById('regTokenCount');
if(!listRoot)return Promise.resolve();
return Sec.json('/api/admin/reg-tokens').then(function(rows){
rows=rows||[];
if(badge)badge.textContent=rows.length+' aktif';
while(listRoot.firstChild)listRoot.removeChild(listRoot.firstChild);
if(!rows.length){listRoot.classList.remove('has-items');listRoot.appendChild(ce('div','racc-empty','Tidak ada token aktif.'));return}
listRoot.classList.add('has-items');
rows.forEach(function(t){listRoot.appendChild(tokenItem(t))});
}).catch(function(){
while(listRoot.firstChild)listRoot.removeChild(listRoot.firstChild);
listRoot.appendChild(ce('div','racc-empty','Gagal memuat token.'));
});
}
function revoke(t){
uiConfirm('Cabut token '+t.token_prefix+'…?\nToken tidak akan bisa dipakai mendaftar.','Cabut Token',function(){
Sec.raw('/api/admin/reg-tokens/'+t.id,{method:'DELETE'}).then(function(){delete full[t.token_prefix];uiToast('Token dicabut.');loadTokens()}).catch(function(e){uiAlert(e.message||'Gagal mencabut.','Kesalahan')});
},{danger:true,okText:'Cabut'});
}
function dialogToken(token,expires){
var s=ModalKit.shell({title:'Token Pendaftaran Baru',sub:'Berlaku sampai '+fmtDT(expires),scroll:true});
s.body.appendChild(ce('p','field-hint','Salin sekarang. Token ini TIDAK akan ditampilkan lagi setelah halaman dimuat ulang.'));
var item=ce('div','racc-titem');
var head=ce('div','racc-titem-head');
head.appendChild(ce('span','racc-titem-prefix',token));
var act=ce('div','racc-titem-act');
var cp=ce('button','racc-btn-butter');cp.type='button';cp.title='Salin token';
cp.appendChild(admSvg('M9 9h11v11H9zM5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1','.85rem','.85rem'));
cp.addEventListener('click',function(){copyText(token)});
act.appendChild(cp);
head.appendChild(act);
item.appendChild(head);
s.body.appendChild(item);
s.foot.appendChild(ModalKit.btn('Tutup','submit-btn',s.close));
document.body.appendChild(s.overlay);
}
function create(){
var btn=document.getElementById('btnCreateToken');
var labelEl=document.getElementById('tokenLabelInput');
var dh=parseInt(dd?dd.get():'168',10)||168;
var label=labelEl?labelEl.value.trim():'';
Sec.once(btn,function(){
btn.disabled=true;
Sec.raw('/api/admin/reg-tokens',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({duration_hours:dh,label:label})}).then(function(r){return r.json()}).then(function(d){
if(labelEl)labelEl.value='';
full[String(d.token).slice(0,10)]=d.token;
dialogToken(d.token,d.expires_at);
loadTokens();
}).catch(function(e){uiAlert(e.message||'Gagal membuat token.','Kesalahan')}).finally(function(){btn.disabled=false});
});
}
function init(){
buildDuration();
var btn=document.getElementById('btnCreateToken');
if(btn)btn.addEventListener('click',create);
return loadTokens();
}
M.tokensInit=init;
M.loadTokens=loadTokens;
M.copyText=copyText;
})(AdminModules.akses=AdminModules.akses||{});
