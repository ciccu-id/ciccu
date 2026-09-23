function resHeaders(){return{'Content-Type':'application/json','x-admin-password':sessionPass}}
function okJsonRes(r){
if(!r.ok){
return r.text().then(function(tx){var msg='HTTP '+r.status;try{var d=JSON.parse(tx);if(d&&d.error)msg=d.error}catch(e){}throw new Error(msg)});
}
return r.json();
}
function fmtDTLocal(s){
if(!s)return'-';
var t=Date.parse(String(s).replace(' ','T')+'Z');
if(isNaN(t))return s;
return new Date(t).toLocaleString('id-ID',{day:'2-digit',month:'short',hour:'2-digit',minute:'2-digit'});
}
function durLabel(h){
if(h===24)return'24 Jam';
if(h===168)return'7 Hari';
if(h===720)return'30 Hari';
return h+' jam';
}
function vName(v){v=String(v||'').trim();return v.length>=1&&v.length<=30}
function vWa(v){return/^08\d{8,18}$/.test(String(v||'').trim())}
function vX(v){return/^[A-Za-z0-9_]{1,15}$/.test(String(v||'').trim().replace(/^@+/,''))}
function waHref(wa){return'https://wa.me/62'+String(wa).slice(1)}
function xHref(x){return'https://x.com/'+encodeURIComponent(String(x))}
function copyTextRes(text,btn){
function done(){
if(!btn)return;
var old=btn.textContent;
btn.textContent='✓ Tersalin';
setTimeout(function(){btn.textContent=old},1200);
}
if(navigator.clipboard&&navigator.clipboard.writeText){
navigator.clipboard.writeText(text).then(done).catch(function(){fallbackCopyRes(text,done)});
}else{
fallbackCopyRes(text,done);
}
}
function fallbackCopyRes(text,done){
var ta=document.createElement('textarea');
ta.value=text;
ta.style.position='fixed';
ta.style.opacity='0';
document.body.appendChild(ta);
ta.select();
try{document.execCommand('copy');done()}catch(e){}
document.body.removeChild(ta);
}
function linkBtn(href,label){
var a=document.createElement('a');
a.className='fs-edit-btn';
a.href=href;
a.target='_blank';
a.rel='noopener';
a.textContent=label;
a.style.textDecoration='none';
return a;
}
function loadResellers(){
var pendCard=document.getElementById('cardPendingResellers');
var pendList=document.getElementById('pendingResellerList');
var list=document.getElementById('resellerList');
if(!list)return;
fetch('/api/admin/resellers',{headers:{'x-admin-password':sessionPass}})
.then(okJsonRes)
.then(function(rows){
var pending=(rows||[]).filter(function(r){return r.status==='pending'});
var others=(rows||[]).filter(function(r){return r.status!=='pending'});
if(pendCard)pendCard.classList.toggle('hidden',pending.length===0);
var pc=document.getElementById('pendingResellerCount');
if(pc)pc.textContent=String(pending.length);
if(pendList){
while(pendList.firstChild)pendList.removeChild(pendList.firstChild);
if(!pending.length)pendList.appendChild(ce('div','empty-state','Tidak ada akun menunggu konfirmasi.'));
pending.forEach(function(r){pendList.appendChild(buildPendingRow(r))});
}
while(list.firstChild)list.removeChild(list.firstChild);
if(!others.length)list.appendChild(ce('div','empty-state','Belum ada reseller.'));
others.forEach(function(r){list.appendChild(buildResellerRow(r))});
loadRegTokens();
})
.catch(function(e){
if(pendList){while(pendList.firstChild)pendList.removeChild(pendList.firstChild);pendList.appendChild(ce('div','empty-state','Gagal memuat data.'))}
while(list.firstChild)list.removeChild(list.firstChild);
list.appendChild(ce('div','empty-state','Gagal memuat data: '+(e.message||'')));
});
}
function profileActions(r,act){
if(r.whatsapp)act.appendChild(linkBtn(waHref(r.whatsapp),'WA'));
if(r.x_username)act.appendChild(linkBtn(xHref(r.x_username),'X'));
var edBtn=ce('button','fs-edit-btn','Edit Profil');
edBtn.type='button';
edBtn.addEventListener('click',function(){openProfileModal(r)});
act.appendChild(edBtn);
}
function buildPendingRow(r){
var row=ce('div','fs-item');
var info=ce('div','fs-item-info');
info.appendChild(ce('p','fs-item-name',r.username+(r.display_name?(' ('+r.display_name+')'):'')));
info.appendChild(ce('p','fs-item-price','Mendaftar '+fmtDTLocal(r.created_at)+' • menunggu konfirmasi'));
row.appendChild(info);
var act=ce('div','fs-item-actions');
profileActions(r,act);
var okBtn=ce('button','fs-edit-btn','Setujui');
okBtn.type='button';
okBtn.style.color='var(--sage-600)';
okBtn.style.borderColor='var(--sage-200)';
okBtn.addEventListener('click',function(){
uiConfirm('Setujui akun "'+r.username+'" sebagai reseller aktif?','Konfirmasi Akun',function(){
fetch('/api/admin/resellers/'+r.id,{method:'PUT',headers:resHeaders(),body:JSON.stringify({status:'active'})})
.then(okJsonRes)
.then(function(){uiToast('Akun disetujui.');loadResellers()})
.catch(function(e){uiAlert(e.message||'Gagal menyetujui.','Kesalahan')});
});
});
act.appendChild(okBtn);
var noBtn=ce('button','fs-remove-btn','Tolak');
noBtn.type='button';
noBtn.addEventListener('click',function(){
uiConfirm('Tolak dan hapus pendaftaran "'+r.username+'"?\nTindakan tidak dapat dibatalkan; pendaftar butuh token baru untuk mendaftar lagi.','Tolak Pendaftaran',function(){
fetch('/api/admin/resellers/'+r.id,{method:'DELETE',headers:{'x-admin-password':sessionPass}})
.then(okJsonRes)
.then(function(){uiToast('Pendaftaran ditolak.');loadResellers()})
.catch(function(e){uiAlert(e.message||'Gagal menolak.','Kesalahan')});
},{danger:true,okText:'Tolak & Hapus'});
});
act.appendChild(noBtn);
row.appendChild(act);
return row;
}
function buildResellerRow(r){
var row=ce('div','fs-item'+(r.status==='suspended'?' sold':''));
var info=ce('div','fs-item-info');
var nameP=ce('p','fs-item-name',r.username+(r.display_name?(' ('+r.display_name+')'):''));
nameP.appendChild(document.createTextNode(' '));
nameP.appendChild(ce('span','pill '+(r.status==='active'?'green':'red'),r.status==='active'?'Aktif':'Nonaktif'));
info.appendChild(nameP);
info.appendChild(ce('p','fs-item-price','Login terakhir '+fmtDTLocal(r.last_login_at)+' • gagal '+r.failed_attempts));
row.appendChild(info);
var act=ce('div','fs-item-actions');
profileActions(r,act);
var togBtn=ce('button','fs-edit-btn',r.status==='suspended'?'Aktifkan':'Nonaktif');
togBtn.type='button';
togBtn.addEventListener('click',function(){
var next=r.status==='suspended'?'active':'suspended';
var msg=next==='suspended'?('Nonaktifkan akun "'+r.username+'"? Reseller tidak bisa login sampai diaktifkan kembali.'):('Aktifkan kembali akun "'+r.username+'"?');
uiConfirm(msg,next==='suspended'?'Nonaktifkan Reseller':'Aktifkan Reseller',function(){
fetch('/api/admin/resellers/'+r.id,{method:'PUT',headers:resHeaders(),body:JSON.stringify({status:next})})
.then(okJsonRes)
.then(function(){uiToast('Status diperbarui.');loadResellers()})
.catch(function(e){uiAlert(e.message||'Gagal mengubah status.','Kesalahan')});
},{danger:next==='suspended',okText:next==='suspended'?'Ya, Nonaktif':'Ya, Aktif'});
});
act.appendChild(togBtn);
var rpBtn=ce('button','fs-edit-btn','Reset PW');
rpBtn.type='button';
rpBtn.addEventListener('click',function(){
uiPrompt('Password baru untuk "'+r.username+'" (minimal 8 karakter).\nSemua sesi aktif akan dicabut.','Reset Password',function(pw){
if(!pw)return;
if(pw.length<8)return uiAlert('Password minimal 8 karakter.','Kesalahan');
fetch('/api/admin/resellers/'+r.id,{method:'PUT',headers:resHeaders(),body:JSON.stringify({password:pw})})
.then(okJsonRes)
.then(function(){uiToast('Password direset.')})
.catch(function(e){uiAlert(e.message||'Gagal reset password.','Kesalahan')});
},{okText:'Reset Password'});
});
act.appendChild(rpBtn);
var delBtn=ce('button','fs-remove-btn','Hapus');
delBtn.type='button';
delBtn.addEventListener('click',function(){
uiConfirm('Hapus permanen reseller "'+r.username+'"?\nSemua sesinya dicabut. Riwayat order tetap tersimpan.','Hapus Reseller',function(){
fetch('/api/admin/resellers/'+r.id,{method:'DELETE',headers:{'x-admin-password':sessionPass}})
.then(okJsonRes)
.then(function(){uiToast('Reseller dihapus.');loadResellers()})
.catch(function(e){uiAlert(e.message||'Gagal menghapus.','Kesalahan')});
},{danger:true,okText:'Hapus'});
});
act.appendChild(delBtn);
row.appendChild(act);
return row;
}
function openProfileModal(r){
var overlay=ce('div','modal-overlay');
var backdrop=ce('div','modal-backdrop');
var box=ce('div','modal-box');
var head=ce('div','modal-head');
var ht=ce('div');
ht.appendChild(ce('h3',null,'Edit Profil Reseller'));
ht.appendChild(ce('p','modal-sub',r.username));
head.appendChild(ht);
var closeBtn=ce('button','modal-close-btn','×');
closeBtn.type='button';
head.appendChild(closeBtn);
box.appendChild(head);
var body=ce('div','modal-body-scroll');
var fName=ce('div','field');
fName.appendChild(ce('label',null,'Nama (maks 30)'));
var iName=ce('input','form-input');iName.type='text';iName.maxLength=30;iName.value=r.display_name||'';
fName.appendChild(iName);
body.appendChild(fName);
var fWa=ce('div','field');
fWa.appendChild(ce('label',null,'WhatsApp (awalan 08, maks 20 digit)'));
var iWa=ce('input','form-input');iWa.type='tel';iWa.maxLength=20;iWa.value=r.whatsapp||'';
fWa.appendChild(iWa);
body.appendChild(fWa);
var fX=ce('div','field');
fX.appendChild(ce('label',null,'Akun X (tanpa @, 1-15 karakter)'));
var iX=ce('input','form-input');iX.type='text';iX.maxLength=15;iX.value=r.x_username||'';
fX.appendChild(iX);
body.appendChild(fX);
box.appendChild(body);
var foot=ce('div','modal-actions');
var cancelBtn=ce('button','cancel-btn','Batal');
cancelBtn.type='button';
var saveBtn=ce('button','submit-btn','Simpan Profil');
saveBtn.type='button';
foot.appendChild(cancelBtn);
foot.appendChild(saveBtn);
box.appendChild(foot);
overlay.appendChild(backdrop);
overlay.appendChild(box);
function shut(){overlay.remove()}
closeBtn.addEventListener('click',shut);
cancelBtn.addEventListener('click',shut);
backdrop.addEventListener('click',shut);
saveBtn.addEventListener('click',function(){
var dn=iName.value.trim();
var wa=iWa.value.trim();
var xx=iX.value.trim().replace(/^@+/,'');
if(!vName(dn))return uiAlert('Nama wajib diisi (maksimal 30 karakter).','Data Belum Lengkap');
if(!vWa(wa))return uiAlert('WhatsApp wajib angka diawali 08 (maksimal 20 digit).','Data Belum Lengkap');
if(!vX(xx))return uiAlert('Akun X wajib 1-15 karakter tanpa tanda @.','Data Belum Lengkap');
saveBtn.disabled=true;saveBtn.textContent='Menyimpan...';
fetch('/api/admin/resellers/'+r.id,{method:'PUT',headers:resHeaders(),body:JSON.stringify({display_name:dn,whatsapp:wa,x_username:xx})})
.then(okJsonRes)
.then(function(){shut();uiToast('Profil diperbarui.');loadResellers()})
.catch(function(e){uiAlert(e.message||'Gagal menyimpan profil.','Kesalahan')})
.finally(function(){saveBtn.disabled=false;saveBtn.textContent='Simpan Profil'});
});
document.body.appendChild(overlay);
setTimeout(function(){backdrop.classList.add('show');box.classList.add('show')},10);
}
function loadRegTokens(){
var list=document.getElementById('regTokenList');
var badge=document.getElementById('regTokenCount');
if(!list)return;
fetch('/api/admin/reg-tokens',{headers:{'x-admin-password':sessionPass}})
.then(okJsonRes)
.then(function(rows){
rows=rows||[];
if(badge)badge.textContent=rows.length+' aktif';
while(list.firstChild)list.removeChild(list.firstChild);
if(!rows.length){list.appendChild(ce('div','empty-state','Tidak ada token aktif.'));return}
rows.forEach(function(t){
var row=ce('div','fs-item');
var info=ce('div','fs-item-info');
info.appendChild(ce('p','fs-item-name',t.token_prefix+'…••••'+(t.label?(' — '+t.label):'')));
var metaP=ce('p','fs-item-price');
metaP.appendChild(document.createTextNode(durLabel(t.duration_hours)+' • dibuat '+fmtDTLocal(t.created_at)+' • sisa '));
var rm=window.fmtRemain?window.fmtRemain(t.expires_at):{text:'-',mod:'dead'};
metaP.appendChild(ce('span','cd-tag '+rm.mod,rm.text));
info.appendChild(metaP);
row.appendChild(info);
var act=ce('div','fs-item-actions');
var rvBtn=ce('button','fs-remove-btn','Cabut');
rvBtn.type='button';
rvBtn.addEventListener('click',function(){
uiConfirm('Cabut token '+t.token_prefix+'…?\nToken tidak akan bisa dipakai mendaftar.','Cabut Token',function(){
fetch('/api/admin/reg-tokens/'+t.id,{method:'DELETE',headers:{'x-admin-password':sessionPass}})
.then(okJsonRes)
.then(function(){uiToast('Token dicabut.');loadRegTokens()})
.catch(function(e){uiAlert(e.message||'Gagal mencabut.','Kesalahan')});
},{danger:true,okText:'Cabut'});
});
act.appendChild(rvBtn);
row.appendChild(act);
list.appendChild(row);
});
})
.catch(function(){
while(list.firstChild)list.removeChild(list.firstChild);
list.appendChild(ce('div','empty-state','Gagal memuat token.'));
});
}
function createToken(){
var durEl=document.getElementById('tokenDuration');
var labelEl=document.getElementById('tokenLabelInput');
var btn=document.getElementById('btnCreateToken');
var dh=parseInt(durEl?durEl.value:'168',10)||168;
var label=labelEl?labelEl.value.trim():'';
if(btn){btn.disabled=true;btn.textContent='Membuat...'}
fetch('/api/admin/reg-tokens',{method:'POST',headers:resHeaders(),body:JSON.stringify({duration_hours:dh,label:label})})
.then(okJsonRes)
.then(function(d){
if(labelEl)labelEl.value='';
showTokenDialog(d.token,d.expires_at);
loadRegTokens();
})
.catch(function(e){uiAlert(e.message||'Gagal membuat token.','Kesalahan')})
.finally(function(){if(btn){btn.disabled=false;btn.textContent='＋ Buat Token'}});
}
function showTokenDialog(token,expires){
var overlay=ce('div','modal-overlay');
var backdrop=ce('div','modal-backdrop');
var box=ce('div','modal-box');
var head=ce('div','modal-head');
var ht=ce('div');
ht.appendChild(ce('h3',null,'Token Pendaftaran Baru'));
ht.appendChild(ce('p','modal-sub','Berlaku sampai '+fmtDTLocal(expires)));
head.appendChild(ht);
var closeBtn=ce('button','modal-close-btn','×');
closeBtn.type='button';
head.appendChild(closeBtn);
box.appendChild(head);
var body=ce('div','modal-body-scroll');
body.appendChild(ce('p','field-hint','Salin sekarang. Token ini TIDAK akan ditampilkan lagi setelah dialog ditutup.'));
var tokenBox=ce('div','sf-row');
tokenBox.style.marginTop='.5rem';
var tv=ce('span','r-cred-val');
tv.style.flex='1';
tv.style.wordBreak='break-all';
tv.style.fontWeight='900';
tv.textContent=token;
tokenBox.appendChild(tv);
var cpBtn=ce('button','tool-btn sky','Salin');
cpBtn.type='button';
cpBtn.addEventListener('click',function(){copyTextRes(token,cpBtn)});
tokenBox.appendChild(cpBtn);
body.appendChild(tokenBox);
box.appendChild(body);
var foot=ce('div','modal-actions');
var doneBtn=ce('button','submit-btn','Sudah Saya Salin');
doneBtn.type='button';
foot.appendChild(doneBtn);
box.appendChild(foot);
overlay.appendChild(backdrop);
overlay.appendChild(box);
function shut(){overlay.remove()}
closeBtn.addEventListener('click',shut);
doneBtn.addEventListener('click',shut);
backdrop.addEventListener('click',shut);
document.body.appendChild(overlay);
setTimeout(function(){backdrop.classList.add('show');box.classList.add('show')},10);
}
function submitResellerForm(e){
e.preventDefault();
var u=document.getElementById('resUsername').value.trim();
var dn=document.getElementById('resDisplayName').value.trim();
var pw=document.getElementById('resPassword').value;
if(!u||!pw||pw.length<8)return uiAlert('Username & password minimal 8 karakter wajib diisi.','Data Belum Lengkap');
var btn=e.target.querySelector('button[type="submit"]');
var oldText=btn?btn.textContent:'';
if(btn){btn.disabled=true;btn.textContent='Membuat...'}
fetch('/api/admin/resellers',{method:'POST',headers:resHeaders(),body:JSON.stringify({username:u,display_name:dn,password:pw})})
.then(okJsonRes)
.then(function(){e.target.reset();uiToast('Reseller dibuat (langsung aktif).');loadResellers()})
.catch(function(err){uiAlert(err.message||'Gagal membuat reseller.','Kesalahan')})
.finally(function(){if(btn){btn.disabled=false;btn.textContent=oldText}});
}
document.addEventListener('DOMContentLoaded',function(){
var form=document.getElementById('resellerForm');
if(form)form.addEventListener('submit',submitResellerForm);
var ct=document.getElementById('btnCreateToken');
if(ct)ct.addEventListener('click',createToken);
});
