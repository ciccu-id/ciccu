var RACC_FILTER='';
function resHeaders(){return{'Content-Type':'application/json','x-admin-password':sessionPass}}
function okJsonRes(r){if(!r.ok)return r.text().then(function(tx){var msg='HTTP '+r.status;try{var d=JSON.parse(tx);if(d&&d.error)msg=d.error}catch(e){}throw new Error(msg)});return r.json()}
function fmtDTLocal(s){if(!s)return'-';var t=Date.parse(String(s).replace(' ','T')+'Z');if(isNaN(t))return s;return new Date(t).toLocaleString('id-ID',{day:'2-digit',month:'short',hour:'2-digit',minute:'2-digit'})}
function durLabel(h){if(h===24)return'24 Jam';if(h===168)return'7 Hari';if(h===720)return'30 Hari';return h+' jam'}
function vName(v){v=String(v||'').trim();return v.length>=1&&v.length<=30}
function vWa(v){return/^08\d{8,18}$/.test(String(v||'').trim())}
function vX(v){return/^[A-Za-z0-9_]{1,15}$/.test(String(v||'').trim().replace(/^@+/,''))}
function waHref(wa){return'https://wa.me/62'+String(wa).slice(1)}
function xHref(x){return'https://x.com/'+encodeURIComponent(String(x))}
function copyTextRes(text,btn){
function done(){if(!btn)return;var old=btn.textContent;btn.textContent='✓ Tersalin';setTimeout(function(){btn.textContent=old},1200)}
if(navigator.clipboard&&navigator.clipboard.writeText){navigator.clipboard.writeText(text).then(done).catch(function(){fallbackCopyRes(text,done)})}
else{fallbackCopyRes(text,done)}
}
function fallbackCopyRes(text,done){var ta=document.createElement('textarea');ta.value=text;ta.style.position='fixed';ta.style.opacity='0';document.body.appendChild(ta);ta.select();try{document.execCommand('copy');done()}catch(e){}document.body.removeChild(ta)}
function raccIni(username,displayName){var src=(displayName||username||'?').trim();var parts=src.split(/\s+/);if(parts.length>=2)return(parts[0].charAt(0)+parts[1].charAt(0)).toUpperCase();return(src.charAt(0)+(src.charAt(1)||src.charAt(0))).toUpperCase()}
function raccCloseAllMenus(except){document.querySelectorAll('.racc-prof.menu-open').forEach(function(p){if(p!==except)p.classList.remove('menu-open')})}
function raccDrow(label,iconPath,valNode){
var row=ce('div','racc-drow');
var l=ce('span','racc-dl');
l.appendChild(admSvg(iconPath,'.92rem','.92rem'));
l.appendChild(document.createTextNode(label));
row.appendChild(l);
var v=ce('span','racc-dv');
if(typeof valNode==='string')v.appendChild(document.createTextNode(valNode));
else v.appendChild(valNode);
row.appendChild(v);
return row;
}
function raccChipSpan(text,mod){var c=ce('span','racc-chip '+mod,text);return c}
function raccMenuBtn(label,iconPath,act,danger){
var b=ce('button');b.type='button';
b.appendChild(admSvg(iconPath,'.9rem','.9rem'));
b.appendChild(document.createTextNode(label));
b.setAttribute('data-act',act);
if(danger)b.classList.add('danger');
return b;
}
function raccBuildMenu(r,isPending){
var m=ce('div','racc-menu');
if(!isPending){
if(r.whatsapp){var bw=ce('a');bw.href=waHref(r.whatsapp);bw.target='_blank';bw.rel='noopener';bw.appendChild(admSvg('M22 16.9v3a2 2 0 0 1-2.2 2 19.8 19.8 0 0 1-8.6-3.1 19.5 19.5 0 0 1-6-6A19.8 19.8 0 0 1 2.1 4.2 2 2 0 0 1 4.1 2h3a2 2 0 0 1 2 1.7c.1 1 .4 2 .7 2.9a2 2 0 0 1-.5 2.1L8 10a16 16 0 0 0 6 6l1.3-1.3a2 2 0 0 1 2.1-.5c.9.3 1.9.6 2.9.7a2 2 0 0 1 1.7 2z','.9rem','.9rem'));bw.appendChild(document.createTextNode('WhatsApp'));m.appendChild(bw)}
if(r.x_username){var bx=ce('a');bx.href=xHref(r.x_username);bx.target='_blank';bx.rel='noopener';bx.appendChild(admSvg('M4 4l6.5 8L4 20h2l5.5-6.8L16 20h4l-6.8-8.5L19.5 4H18l-5 6.2L9 4H4z','.9rem','.9rem'));bx.appendChild(document.createTextNode('X / Twitter'));m.appendChild(bx)}
m.appendChild(raccMenuBtn('Edit Profil','M12 20h9M16.5 3.5a2.1 2.1 0 0 1 3 3L7 19l-4 1 1-4z','edit'));
if(!isPending)m.appendChild(raccMenuBtn('Reset Password','M3 11h10a2 2 0 0 1 2 2v8H3v-8a2 2 0 0 1 2-2zM7 11V7a5 5 0 0 1 10 0','reset'));
if(!isPending)m.appendChild(raccMenuBtn(r.status==='suspended'?'Aktifkan Kembali':'Nonaktifkan','M12 3a9 9 0 1 0 9 9','toggle'));
if(!isPending)m.appendChild(raccMenuBtn('Hapus','M3 6h18M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6z','delete',true));
}else{
if(r.whatsapp){var bw2=ce('a');bw2.href=waHref(r.whatsapp);bw2.target='_blank';bw2.rel='noopener';bw2.appendChild(admSvg('M22 16.9v3a2 2 0 0 1-2.2 2 19.8 19.8 0 0 1-8.6-3.1 19.5 19.5 0 0 1-6-6A19.8 19.8 0 0 1 2.1 4.2 2 2 0 0 1 4.1 2h3a2 2 0 0 1 2 1.7c.1 1 .4 2 .7 2.9a2 2 0 0 1-.5 2.1L8 10a16 16 0 0 0 6 6l1.3-1.3a2 2 0 0 1 2.1-.5c.9.3 1.9.6 2.9.7a2 2 0 0 1 1.7 2z','.9rem','.9rem'));bw2.appendChild(document.createTextNode('WhatsApp'));m.appendChild(bw2)}
if(r.x_username){var bx2=ce('a');bx2.href=xHref(r.x_username);bx2.target='_blank';bx2.rel='noopener';bx2.appendChild(admSvg('M4 4l6.5 8L4 20h2l5.5-6.8L16 20h4l-6.8-8.5L19.5 4H18l-5 6.2L9 4H4z','.9rem','.9rem'));bx2.appendChild(document.createTextNode('X / Twitter'));m.appendChild(bx2)}
m.appendChild(raccMenuBtn('Edit Profil','M12 20h9M16.5 3.5a2.1 2.1 0 0 1 3 3L7 19l-4 1 1-4z','edit'));
}
return m;
}
function raccBind(prof,r,handlers){
var prow=prof.querySelector('.racc-prow');
var kebab=prof.querySelector('.racc-kebab');
var menu=prof.querySelector('.racc-menu');
prow.addEventListener('click',function(e){if(e.target.closest('.racc-kebab')||e.target.closest('.racc-menu'))return;prof.classList.toggle('open');raccCloseAllMenus(prof)});
kebab.addEventListener('click',function(e){e.stopPropagation();var wasOpen=prof.classList.contains('menu-open');raccCloseAllMenus(null);if(!wasOpen)prof.classList.add('menu-open')});
menu.addEventListener('click',function(e){var b=e.target.closest('button[data-act]');if(!b)return;var act=b.getAttribute('data-act');prof.classList.remove('menu-open');if(handlers[act])handlers[act]()});
}
function raccBuildReseller(r){
var prof=ce('div','racc-prof');
var prow=ce('div','racc-prow');
var ava=ce('span','racc-ava'+(r.status==='suspended'?' off':''),raccIni(r.username,r.display_name));
prow.appendChild(ava);
var who=ce('span','racc-pwho');
var b=ce('b',null,r.username);
who.appendChild(b);
var meta=ce('small','racc-pmeta',(r.display_name?(r.display_name+' • '):'')+'login '+fmtDTLocal(r.last_login_at));
who.appendChild(meta);
prow.appendChild(who);
prow.appendChild(raccChipSpan(r.status==='active'?'AKTIF':'NONAKTIF',r.status==='active'?'ok':'off'));
var keb=ce('button','racc-kebab');keb.type='button';keb.appendChild(admSvg('M12 5.5a1.7 1.7 0 1 0 0-3.4 1.7 1.7 0 0 0 0 3.4zM12 13.7a1.7 1.7 0 1 0 0-3.4 1.7 1.7 0 0 0 0 3.4zM12 22a1.7 1.7 0 1 0 0-3.4 1.7 1.7 0 0 0 0 3.4z','1rem','1rem'));
prow.appendChild(keb);
var chev=ce('span','racc-chev');chev.appendChild(admSvg('M6 9l6 6 6-6','1rem','1rem'));
prow.appendChild(chev);
prof.appendChild(prow);
prof.appendChild(raccBuildMenu(r,false));
var pbody=ce('div','racc-pbody');
var dlist=ce('div','racc-dlist');
dlist.appendChild(raccDrow('Username','M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2M12 3a4 4 0 1 0 0 8 4 4 0 0 0 0-8z',r.username));
if(r.whatsapp){var waA=document.createElement('a');waA.href=waHref(r.whatsapp);waA.target='_blank';waA.rel='noopener';waA.textContent=r.whatsapp;dlist.appendChild(raccDrow('WhatsApp','M22 16.9v3a2 2 0 0 1-2.2 2 19.8 19.8 0 0 1-8.6-3.1 19.5 19.5 0 0 1-6-6A19.8 19.8 0 0 1 2.1 4.2 2 2 0 0 1 4.1 2h3a2 2 0 0 1 2 1.7c.1 1 .4 2 .7 2.9a2 2 0 0 1-.5 2.1L8 10a16 16 0 0 0 6 6l1.3-1.3a2 2 0 0 1 2.1-.5c.9.3 1.9.6 2.9.7a2 2 0 0 1 1.7 2z',waA))}
if(r.x_username){var xA=document.createElement('a');xA.href=xHref(r.x_username);xA.target='_blank';xA.rel='noopener';xA.textContent='@'+r.x_username;dlist.appendChild(raccDrow('X / Twitter','M4 4l6.5 8L4 20h2l5.5-6.8L16 20h4l-6.8-8.5L19.5 4H18l-5 6.2L9 4H4z',xA))}
dlist.appendChild(raccDrow('Mendaftar','M3 4.5h18v17H3zM3 9.5h18M8 2.5v4M16 2.5v4',fmtDTLocal(r.created_at)));
if(r.approved_at)dlist.appendChild(raccDrow('Disetujui','M12 3a9 9 0 1 0 0 18 9 9 0 0 0 0-18zM8.5 12.5l2.5 2.5 4.5-5',fmtDTLocal(r.approved_at)));
dlist.appendChild(raccDrow('Terakhir login','M12 3a8.5 8.5 0 1 0 0 17 8.5 8.5 0 0 0 0-17zM12 7.5V12l3 1.8',fmtDTLocal(r.last_login_at)));
var failInd=ce('span','racc-ind'+((r.failed_attempts||0)>0?' bad':''));
var fi=ce('i');failInd.appendChild(fi);failInd.appendChild(document.createTextNode((r.failed_attempts||0)+' kali'));
dlist.appendChild(raccDrow('Login gagal','M12 22s8-3 8-10V5l-8-3-8 3v7c0 7 8 10 8 10zM12 8v4M12 16h.01',failInd));
dlist.appendChild(raccDrow('Status','M12 3v9M18.4 6.6a9 9 0 1 1-12.8 0',raccChipSpan(r.status==='active'?'AKTIF':'NONAKTIF',r.status==='active'?'ok':'off')));
pbody.appendChild(dlist);
prof.appendChild(pbody);
var handlers={
edit:function(){openProfileModal(r)},
toggle:function(){
var next=r.status==='suspended'?'active':'suspended';
var msg=next==='suspended'?('Nonaktifkan akun "'+r.username+'"? Reseller tidak bisa login sampai diaktifkan kembali.'):('Aktifkan kembali akun "'+r.username+'"?');
uiConfirm(msg,next==='suspended'?'Nonaktifkan Reseller':'Aktifkan Reseller',function(){
fetch('/api/admin/resellers/'+r.id,{method:'PUT',headers:resHeaders(),body:JSON.stringify({status:next})}).then(okJsonRes).then(function(){uiToast('Status diperbarui.');loadResellers()}).catch(function(e){uiAlert(e.message||'Gagal mengubah status.','Kesalahan')});
},{danger:next==='suspended',okText:next==='suspended'?'Ya, Nonaktif':'Ya, Aktif'});
},
reset:function(){
uiPrompt('Password baru untuk "'+r.username+'" (minimal 8 karakter).\nSemua sesi aktif akan dicabut.','Reset Password',function(pw){
if(!pw)return;if(pw.length<8)return uiAlert('Password minimal 8 karakter.','Kesalahan');
fetch('/api/admin/resellers/'+r.id,{method:'PUT',headers:resHeaders(),body:JSON.stringify({password:pw})}).then(okJsonRes).then(function(){uiToast('Password direset.')}).catch(function(e){uiAlert(e.message||'Gagal reset password.','Kesalahan')});
},{okText:'Reset Password'});
},
delete:function(){
uiConfirm('Hapus permanen reseller "'+r.username+'"? \nSemua sesinya dicabut. Riwayat order tetap tersimpan.','Hapus Reseller',function(){
fetch('/api/admin/resellers/'+r.id,{method:'DELETE',headers:{'x-admin-password':sessionPass}}).then(okJsonRes).then(function(){uiToast('Reseller dihapus.');loadResellers()}).catch(function(e){uiAlert(e.message||'Gagal menghapus.','Kesalahan')});
},{danger:true,okText:'Hapus'});
}
};
raccBind(prof,r,handlers);
return prof;
}
function raccBuildPending(r){
var prof=ce('div','racc-prof');
var prow=ce('div','racc-prow');
var ava=ce('span','racc-ava warn',raccIni(r.username,r.display_name));
prow.appendChild(ava);
var who=ce('span','racc-pwho');
who.appendChild(ce('b',null,r.username));
who.appendChild(ce('small','racc-pmeta',(r.display_name?(r.display_name+' • '):'')+'mendaftar '+fmtDTLocal(r.created_at)));
prow.appendChild(who);
prow.appendChild(raccChipSpan('PENDING','off'));
var keb=ce('button','racc-kebab');keb.type='button';keb.appendChild(admSvg('M12 5.5a1.7 1.7 0 1 0 0-3.4 1.7 1.7 0 0 0 0 3.4zM12 13.7a1.7 1.7 0 1 0 0-3.4 1.7 1.7 0 0 0 0 3.4zM12 22a1.7 1.7 0 1 0 0-3.4 1.7 1.7 0 0 0 0 3.4z','1rem','1rem'));
prow.appendChild(keb);
var chev=ce('span','racc-chev');chev.appendChild(admSvg('M6 9l6 6 6-6','1rem','1rem'));
prow.appendChild(chev);
prof.appendChild(prow);
prof.appendChild(raccBuildMenu(r,true));
var pbody=ce('div','racc-pbody');
var dlist=ce('div','racc-dlist');
dlist.appendChild(raccDrow('Username','M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2M12 3a4 4 0 1 0 0 8 4 4 0 0 0 0-8z',r.username));
if(r.display_name)dlist.appendChild(raccDrow('Nama','M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2M12 3a4 4 0 1 0 0 8 4 4 0 0 0 0-8z',r.display_name));
if(r.whatsapp){var waA=document.createElement('a');waA.href=waHref(r.whatsapp);waA.target='_blank';waA.rel='noopener';waA.textContent=r.whatsapp;dlist.appendChild(raccDrow('WhatsApp','M22 16.9v3a2 2 0 0 1-2.2 2 19.8 19.8 0 0 1-8.6-3.1 19.5 19.5 0 0 1-6-6A19.8 19.8 0 0 1 2.1 4.2 2 2 0 0 1 4.1 2h3a2 2 0 0 1 2 1.7c.1 1 .4 2 .7 2.9a2 2 0 0 1-.5 2.1L8 10a16 16 0 0 0 6 6l1.3-1.3a2 2 0 0 1 2.1-.5c.9.3 1.9.6 2.9.7a2 2 0 0 1 1.7 2z',waA))}
if(r.x_username){var xA=document.createElement('a');xA.href=xHref(r.x_username);xA.target='_blank';xA.rel='noopener';xA.textContent='@'+r.x_username;dlist.appendChild(raccDrow('X / Twitter','M4 4l6.5 8L4 20h2l5.5-6.8L16 20h4l-6.8-8.5L19.5 4H18l-5 6.2L9 4H4z',xA))}
dlist.appendChild(raccDrow('Mendaftar','M3 4.5h18v17H3zM3 9.5h18M8 2.5v4M16 2.5v4',fmtDTLocal(r.created_at)));
pbody.appendChild(dlist);
var pact=ce('div','racc-pact');
var okBtn=ce('button','racc-btn-butter','Setujui');okBtn.type='button';
okBtn.addEventListener('click',function(e){e.stopPropagation();uiConfirm('Setujui akun "'+r.username+'" sebagai reseller aktif?','Konfirmasi Akun',function(){
fetch('/api/admin/resellers/'+r.id,{method:'PUT',headers:resHeaders(),body:JSON.stringify({status:'active'})}).then(okJsonRes).then(function(){uiToast('Akun disetujui.');loadResellers()}).catch(function(e2){uiAlert(e2.message||'Gagal menyetujui.','Kesalahan')});
})});
var noBtn=ce('button','racc-btn-butter danger','Tolak & Hapus');noBtn.type='button';
noBtn.addEventListener('click',function(e){e.stopPropagation();uiConfirm('Tolak dan hapus pendaftaran "'+r.username+'"? \nTindakan tidak dapat dibatalkan; pendaftar butuh token baru untuk mendaftar lagi.','Tolak Pendaftaran',function(){
fetch('/api/admin/resellers/'+r.id,{method:'DELETE',headers:{'x-admin-password':sessionPass}}).then(okJsonRes).then(function(){uiToast('Pendaftaran ditolak.');loadResellers()}).catch(function(e2){uiAlert(e2.message||'Gagal menolak.','Kesalahan')});
},{danger:true,okText:'Tolak & Hapus'})});
pact.appendChild(okBtn);pact.appendChild(noBtn);
pbody.appendChild(pact);
prof.appendChild(pbody);
raccBind(prof,r,{edit:function(){openProfileModal(r)}});
return prof;
}
var _RACC_PENDING=[],_RACC_OTHERS=[];
function loadResellers(){
var pendCard=document.getElementById('cardPendingResellers');
var pendList=document.getElementById('pendingResellerList');
var list=document.getElementById('resellerList');
var pc=document.getElementById('pendingResellerCount');
var rc=document.getElementById('resellerCount');
if(!list)return;
fetch('/api/admin/resellers',{headers:{'x-admin-password':sessionPass}}).then(okJsonRes).then(function(rows){
_RACC_PENDING=(rows||[]).filter(function(r){return r.status==='pending'});
_RACC_OTHERS=(rows||[]).filter(function(r){return r.status!=='pending'});
if(pendCard)pendCard.classList.toggle('hidden',_RACC_PENDING.length===0);
if(pc)pc.textContent=String(_RACC_PENDING.length);
if(rc)rc.textContent=_RACC_OTHERS.length+' akun';
raccRenderPending();
raccRenderOthers();
loadRegTokens();
}).catch(function(e){
if(pendList){while(pendList.firstChild)pendList.removeChild(pendList.firstChild);pendList.appendChild(ce('div','racc-empty','Gagal memuat data.'))}
while(list.firstChild)list.removeChild(list.firstChild);
list.appendChild(ce('div','racc-empty','Gagal memuat data: '+(e.message||'')));
});
}
function raccMatchFilter(r){
var q=(RACC_FILTER||'').toLowerCase();if(!q)return true;
var hay=[r.username,r.display_name,r.whatsapp,r.x_username].filter(Boolean).join(' ').toLowerCase();
return hay.indexOf(q)>=0;
}
function raccRenderPending(){
var pendList=document.getElementById('pendingResellerList');
if(!pendList)return;
while(pendList.firstChild)pendList.removeChild(pendList.firstChild);
var show=_RACC_PENDING.filter(raccMatchFilter);
if(!show.length){pendList.appendChild(ce('div','racc-empty','Tidak ada akun menunggu konfirmasi.'));return}
show.forEach(function(r){pendList.appendChild(raccBuildPending(r))});
}
function raccRenderOthers(){
var list=document.getElementById('resellerList');
if(!list)return;
while(list.firstChild)list.removeChild(list.firstChild);
var show=_RACC_OTHERS.filter(raccMatchFilter);
if(!show.length){list.appendChild(ce('div','racc-empty','Belum ada reseller.'));return}
show.forEach(function(r){list.appendChild(raccBuildReseller(r))});
}
function raccSetFilter(v){RACC_FILTER=String(v||'').trim();raccRenderPending();raccRenderOthers()}
function openProfileModal(r){
var overlay=ce('div','modal-overlay');
var backdrop=ce('div','modal-backdrop');
var box=ce('div','modal-box');
var head=ce('div','modal-head');
var ht=ce('div');
ht.appendChild(ce('h3',null,'Edit Profil Reseller'));
ht.appendChild(ce('p','modal-sub',r.username));
head.appendChild(ht);
var closeBtn=ce('button','modal-close-btn','×');closeBtn.type='button';
head.appendChild(closeBtn);
box.appendChild(head);
var body=ce('div','modal-body-scroll');
var fName=ce('div','field');fName.appendChild(ce('label',null,'Nama (maks 30)'));
var iName=ce('input','form-input');iName.type='text';iName.maxLength=30;iName.value=r.display_name||'';
fName.appendChild(iName);body.appendChild(fName);
var fWa=ce('div','field');fWa.appendChild(ce('label',null,'WhatsApp (awalan 08, maks 20 digit)'));
var iWa=ce('input','form-input');iWa.type='tel';iWa.maxLength=20;iWa.value=r.whatsapp||'';
fWa.appendChild(iWa);body.appendChild(fWa);
var fX=ce('div','field');fX.appendChild(ce('label',null,'Akun X (tanpa @, 1-15 karakter)'));
var iX=ce('input','form-input');iX.type='text';iX.maxLength=15;iX.value=r.x_username||'';
fX.appendChild(iX);body.appendChild(fX);
box.appendChild(body);
var foot=ce('div','modal-actions');
var cancelBtn=ce('button','cancel-btn','Batal');cancelBtn.type='button';
var saveBtn=ce('button','submit-btn','Simpan Profil');saveBtn.type='button';
foot.appendChild(cancelBtn);foot.appendChild(saveBtn);
box.appendChild(foot);
overlay.appendChild(backdrop);overlay.appendChild(box);
function shut(){overlay.remove()}
closeBtn.addEventListener('click',shut);
cancelBtn.addEventListener('click',shut);
backdrop.addEventListener('click',shut);
saveBtn.addEventListener('click',function(){
var dn=iName.value.trim();var wa=iWa.value.trim();var xx=iX.value.trim().replace(/^@+/,'');
if(!vName(dn))return uiAlert('Nama wajib diisi (maksimal 30 karakter).','Data Belum Lengkap');
if(!vWa(wa))return uiAlert('WhatsApp wajib angka diawali 08 (maksimal 20 digit).','Data Belum Lengkap');
if(!vX(xx))return uiAlert('Akun X wajib 1-15 karakter tanpa tanda @.','Data Belum Lengkap');
saveBtn.disabled=true;saveBtn.textContent='Menyimpan...';
fetch('/api/admin/resellers/'+r.id,{method:'PUT',headers:resHeaders(),body:JSON.stringify({display_name:dn,whatsapp:wa,x_username:xx})}).then(okJsonRes).then(function(){shut();uiToast('Profil diperbarui.');loadResellers()}).catch(function(e){uiAlert(e.message||'Gagal menyimpan profil.','Kesalahan')}).finally(function(){saveBtn.disabled=false;saveBtn.textContent='Simpan Profil'});
});
document.body.appendChild(overlay);
}
function loadRegTokens(){
var list=document.getElementById('regTokenList');
var badge=document.getElementById('regTokenCount');
if(!list)return;
fetch('/api/admin/reg-tokens',{headers:{'x-admin-password':sessionPass}}).then(okJsonRes).then(function(rows){
rows=rows||[];
if(badge)badge.textContent=rows.length+' aktif';
while(list.firstChild)list.removeChild(list.firstChild);
if(!rows.length){list.appendChild(ce('div','racc-empty','Tidak ada token aktif.'));return}
rows.forEach(function(t){
var item=ce('div','racc-titem');
var head=ce('div','racc-titem-head');
var pre=ce('span','racc-titem-prefix',t.token_prefix+'…••••');
head.appendChild(pre);
if(t.label){var lab=ce('span','racc-titem-label',' — '+t.label);head.appendChild(lab)}
item.appendChild(head);
var meta=ce('p','racc-titem-meta');
meta.appendChild(document.createTextNode(durLabel(t.duration_hours)+' • dibuat '+fmtDTLocal(t.created_at)+' • sisa '));
var rm=window.fmtRemain?window.fmtRemain(t.expires_at):{text:'-',mod:'dead'};
meta.appendChild(ce('span','cd-tag '+rm.mod,rm.text));
item.appendChild(meta);
var act=ce('div','racc-titem-act');
var rvBtn=ce('button','racc-btn-butter danger','Cabut');rvBtn.type='button';
rvBtn.addEventListener('click',function(){
uiConfirm('Cabut token '+t.token_prefix+'…?\nToken tidak akan bisa dipakai mendaftar.','Cabut Token',function(){
fetch('/api/admin/reg-tokens/'+t.id,{method:'DELETE',headers:{'x-admin-password':sessionPass}}).then(okJsonRes).then(function(){uiToast('Token dicabut.');loadRegTokens()}).catch(function(e){uiAlert(e.message||'Gagal mencabut.','Kesalahan')});
},{danger:true,okText:'Cabut'});
});
act.appendChild(rvBtn);
item.appendChild(act);
list.appendChild(item);
});
}).catch(function(){while(list.firstChild)list.removeChild(list.firstChild);list.appendChild(ce('div','racc-empty','Gagal memuat token.'))});
}
function createToken(){
var durEl=document.getElementById('tokenDuration');
var labelEl=document.getElementById('tokenLabelInput');
var btn=document.getElementById('btnCreateToken');
var dh=parseInt(durEl?durEl.value:'168',10)||168;
var label=labelEl?labelEl.value.trim():'';
if(btn){btn.disabled=true;btn.textContent='Membuat...'}
fetch('/api/admin/reg-tokens',{method:'POST',headers:resHeaders(),body:JSON.stringify({duration_hours:dh,label:label})}).then(okJsonRes).then(function(d){
if(labelEl)labelEl.value='';
showTokenDialog(d.token,d.expires_at);
loadRegTokens();
}).catch(function(e){uiAlert(e.message||'Gagal membuat token.','Kesalahan')}).finally(function(){if(btn){btn.disabled=false;btn.textContent='＋ Buat Token'}});
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
var closeBtn=ce('button','modal-close-btn','×');closeBtn.type='button';
head.appendChild(closeBtn);
box.appendChild(head);
var body=ce('div','modal-body-scroll');
body.appendChild(ce('p','field-hint','Salin sekarang. Token ini TIDAK akan ditampilkan lagi setelah dialog ditutup.'));
var tokenBox=ce('div','sf-row');tokenBox.style.marginTop='.5rem';
var tv=ce('span','r-cred-val');tv.style.flex='1';tv.style.wordBreak='break-all';tv.style.fontWeight='900';tv.textContent=token;
tokenBox.appendChild(tv);
var cpBtn=ce('button','tool-btn sky','Salin');cpBtn.type='button';
cpBtn.addEventListener('click',function(){copyTextRes(token,cpBtn)});
tokenBox.appendChild(cpBtn);
body.appendChild(tokenBox);
box.appendChild(body);
var foot=ce('div','modal-actions');
var doneBtn=ce('button','submit-btn','Sudah Saya Salin');doneBtn.type='button';
foot.appendChild(doneBtn);
box.appendChild(foot);
overlay.appendChild(backdrop);overlay.appendChild(box);
function shut(){overlay.remove()}
closeBtn.addEventListener('click',shut);
doneBtn.addEventListener('click',shut);
backdrop.addEventListener('click',shut);
document.body.appendChild(overlay);
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
fetch('/api/admin/resellers',{method:'POST',headers:resHeaders(),body:JSON.stringify({username:u,display_name:dn,password:pw})}).then(okJsonRes).then(function(){e.target.reset();uiToast('Reseller dibuat (langsung aktif).');loadResellers()}).catch(function(err){uiAlert(err.message||'Gagal membuat reseller.','Kesalahan')}).finally(function(){if(btn){btn.disabled=false;btn.textContent=oldText}});
}
document.addEventListener('click',function(e){if(!e.target.closest('.racc-prof'))raccCloseAllMenus(null)});
document.addEventListener('DOMContentLoaded',function(){
var form=document.getElementById('resellerForm');
if(form)form.addEventListener('submit',submitResellerForm);
var ct=document.getElementById('btnCreateToken');
if(ct)ct.addEventListener('click',createToken);
var se=document.getElementById('resellerSearchInput');
if(se)se.addEventListener('input',function(){raccSetFilter(this.value)});
});
