(function(M){
var pending=[],others=[],filter='';
function vName(v){v=String(v||'').trim();return v.length>=1&&v.length<=30}
function vWa(v){return/^08\d{8,18}$/.test(String(v||'').trim())}
function vX(v){return/^[A-Za-z0-9_]{1,15}$/.test(String(v||'').trim().replace(/^@+/,''))}
function waHref(wa){return'https://wa.me/62'+String(wa).slice(1)}
function xHref(x){return'https://x.com/'+encodeURIComponent(String(x))}
function ini(u,d){var s=String(d||u||'?').trim();var p=s.split(/\s+/);if(p.length>=2)return(p[0].charAt(0)+p[1].charAt(0)).toUpperCase();return(s.charAt(0)+(s.charAt(1)||s.charAt(0))).toUpperCase()}
function drow(label,icon,valNode){
var row=ce('div','racc-drow');
var l=ce('span','racc-dl');
l.appendChild(admSvg(icon,'.92rem','.92rem'));
l.appendChild(document.createTextNode(label));
row.appendChild(l);
var v=ce('span','racc-dv');
if(typeof valNode==='string')v.appendChild(document.createTextNode(valNode));
else v.appendChild(valNode);
row.appendChild(v);
return row;
}
function linkNode(href,text){var a=document.createElement('a');a.href=href;a.target='_blank';a.rel='noopener';a.textContent=text;return a}
function menuBtn(label,icon,act,danger){
var b=ce('button');b.type='button';
b.appendChild(admSvg(icon,'.9rem','.9rem'));
b.appendChild(document.createTextNode(label));
b.setAttribute('data-act',act);
if(danger)b.classList.add('danger');
return b;
}
function bindCard(prof,handlers){
var prow=prof.querySelector('.racc-prow');
var kebab=prof.querySelector('.racc-kebab');
var menu=prof.querySelector('.racc-menu');
prow.addEventListener('click',function(e){if(e.target.closest('.racc-kebab')||e.target.closest('.racc-menu'))return;prof.classList.toggle('open')});
kebab.addEventListener('click',function(e){e.stopPropagation();var was=prof.classList.contains('menu-open');M.closeMenus();if(!was)prof.classList.add('menu-open')});
menu.addEventListener('click',function(e){var b=e.target.closest('button[data-act]');if(!b)return;var act=b.getAttribute('data-act');prof.classList.remove('menu-open');if(handlers[act])handlers[act]()});
}
function headRow(r,avaMod,metaText,chipText,chipMod){
var prow=ce('div','racc-prow');
prow.appendChild(ce('span','racc-ava'+(avaMod?' '+avaMod:''),ini(r.username,r.display_name)));
var who=ce('span','racc-pwho');
who.appendChild(ce('b',null,r.username));
who.appendChild(ce('small','racc-pmeta',metaText));
prow.appendChild(who);
if(chipText)prow.appendChild(ce('span','racc-chip '+chipMod,chipText));
var keb=ce('button','racc-kebab');keb.type='button';
keb.appendChild(admSvg('M12 5.5a1.7 1.7 0 1 0 0-3.4 1.7 1.7 0 0 0 0 3.4zM12 13.7a1.7 1.7 0 1 0 0-3.4 1.7 1.7 0 0 0 0 3.4zM12 22a1.7 1.7 0 1 0 0-3.4 1.7 1.7 0 0 0 0 3.4z','1rem','1rem'));
prow.appendChild(keb);
var chev=ce('span','racc-chev');
chev.appendChild(admSvg('M6 9l6 6 6-6','1rem','1rem'));
prow.appendChild(chev);
return prow;
}
function profileRows(r,withName){
var dlist=ce('div','racc-dlist');
dlist.appendChild(drow('Username','M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2M12 3a4 4 0 1 0 0 8 4 4 0 0 0 0-8z',r.username));
if(withName&&r.display_name)dlist.appendChild(drow('Nama','M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2M12 3a4 4 0 1 0 0 8 4 4 0 0 0 0-8z',r.display_name));
if(r.whatsapp)dlist.appendChild(drow('WhatsApp','M22 16.9v3a2 2 0 0 1-2.2 2 19.8 19.8 0 0 1-8.6-3.1 19.5 19.5 0 0 1-6-6A19.8 19.8 0 0 1 2.1 4.2 2 2 0 0 1 4.1 2h3a2 2 0 0 1 2 1.7c.1 1 .4 2 .7 2.9a2 2 0 0 1-.5 2.1L8 10a16 16 0 0 0 6 6l1.3-1.3a2 2 0 0 1 2.1-.5c.9.3 1.9.6 2.9.7a2 2 0 0 1 1.7 2z',linkNode(waHref(r.whatsapp),r.whatsapp)));
if(r.x_username)dlist.appendChild(drow('X / Twitter','M4 4l6.5 8L4 20h2l5.5-6.8L16 20h4l-6.8-8.5L19.5 4H18l-5 6.2L9 4H4z',linkNode(xHref(r.x_username),'@'+r.x_username)));
dlist.appendChild(drow('Mendaftar','M3 4.5h18v17H3zM3 9.5h18M8 2.5v4M16 2.5v4',fmtDT(r.created_at)));
return dlist;
}
function openProfile(r){
var s=ModalKit.shell({title:'Edit Profil Reseller',sub:r.username});
var fName=ce('div','field');fName.appendChild(ce('label',null,'Nama (maks 30)'));
var iName=ce('input','form-input');iName.type='text';iName.maxLength=30;iName.value=r.display_name||'';
fName.appendChild(iName);s.body.appendChild(fName);
var fWa=ce('div','field');fWa.appendChild(ce('label',null,'WhatsApp (awalan 08, maks 20 digit)'));
var iWa=ce('input','form-input');iWa.type='tel';iWa.maxLength=20;iWa.value=r.whatsapp||'';
fWa.appendChild(iWa);s.body.appendChild(fWa);
var fX=ce('div','field');fX.appendChild(ce('label',null,'Akun X (tanpa @, 1-15 karakter)'));
var iX=ce('input','form-input');iX.type='text';iX.maxLength=15;iX.value=r.x_username||'';
fX.appendChild(iX);s.body.appendChild(fX);
var save=ModalKit.btn('Simpan Profil','submit-btn',function(){
var dn=iName.value.trim(),wa=iWa.value.trim(),xx=iX.value.trim().replace(/^@+/,'');
if(!vName(dn))return uiAlert('Nama wajib diisi (maksimal 30 karakter).','Data Belum Lengkap');
if(!vWa(wa))return uiAlert('WhatsApp wajib angka diawali 08 (maksimal 20 digit).','Data Belum Lengkap');
if(!vX(xx))return uiAlert('Akun X wajib 1-15 karakter tanpa tanda @.','Data Belum Lengkap');
save.disabled=true;save.textContent='Menyimpan...';
Sec.raw('/api/admin/resellers/'+r.id,{method:'PUT',headers:{'Content-Type':'application/json'},body:JSON.stringify({display_name:dn,whatsapp:wa,x_username:xx})}).then(function(){s.close();uiToast('Profil diperbarui.');load()}).catch(function(e){uiAlert(e.message||'Gagal menyimpan profil.','Kesalahan')}).finally(function(){save.disabled=false;save.textContent='Simpan Profil'});
});
s.foot.appendChild(ModalKit.btn('Batal','cancel-btn',s.close));
s.foot.appendChild(save);
document.body.appendChild(s.overlay);
}
function put(id,body,msg){return Sec.raw('/api/admin/resellers/'+id,{method:'PUT',headers:{'Content-Type':'application/json'},body:JSON.stringify(body)}).then(function(){if(msg)uiToast(msg);load()})}
function del(id,msg){return Sec.raw('/api/admin/resellers/'+id,{method:'DELETE'}).then(function(){if(msg)uiToast(msg);load()})}
function resellerCard(r){
var prof=ce('div','racc-prof');
prof.appendChild(headRow(r,r.status==='suspended'?'off':'',(r.display_name?(r.display_name+' • '):'')+'login '+fmtDT(r.last_login_at),'',''));
var menu=ce('div','racc-menu');
menu.appendChild(menuBtn('Edit Profil','M12 20h9M16.5 3.5a2.1 2.1 0 0 1 3 3L7 19l-4 1 1-4z','edit'));
menu.appendChild(menuBtn('Reset Password','M3 11h10a2 2 0 0 1 2 2v8H3v-8a2 2 0 0 1 2-2zM7 11V7a5 5 0 0 1 10 0','reset'));
menu.appendChild(menuBtn(r.status==='suspended'?'Aktifkan Kembali':'Nonaktifkan','M12 3a9 9 0 1 0 9 9','toggle'));
menu.appendChild(menuBtn('Hapus','M3 6h18M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6z','delete',true));
prof.appendChild(menu);
var pbody=ce('div','racc-pbody');
var dlist=profileRows(r,false);
if(r.approved_at)dlist.appendChild(drow('Disetujui','M12 3a9 9 0 1 0 0 18 9 9 0 0 0 0-18zM8.5 12.5l2.5 2.5 4.5-5',fmtDT(r.approved_at)));
dlist.appendChild(drow('Terakhir login','M12 3a8.5 8.5 0 1 0 0 17 8.5 8.5 0 0 0 0-17zM12 7.5V12l3 1.8',fmtDT(r.last_login_at)));
var ind=ce('span','racc-ind'+((r.failed_attempts||0)>0?' bad':''));
ind.appendChild(ce('i'));
ind.appendChild(document.createTextNode((r.failed_attempts||0)+' kali'));
dlist.appendChild(drow('Login gagal','M12 22s8-3 8-10V5l-8-3-8 3v7c0 7 8 10 8 10zM12 8v4M12 16h.01',ind));
dlist.appendChild(drow('Status','M12 3v9M18.4 6.6a9 9 0 1 1-12.8 0',ce('span','racc-chip '+(r.status==='active'?'ok':'off'),r.status==='active'?'AKTIF':'NONAKTIF')));
pbody.appendChild(dlist);
prof.appendChild(pbody);
bindCard(prof,{
edit:function(){openProfile(r)},
reset:function(){
uiPrompt('Password baru untuk "'+r.username+'" (minimal 8 karakter).\nSemua sesi aktif akan dicabut.','Reset Password',function(pw){
if(!pw)return;
if(pw.length<8)return uiAlert('Password minimal 8 karakter.','Kesalahan');
put(r.id,{password:pw},'Password direset.');
},{okText:'Reset Password'});
},
toggle:function(){
var next=r.status==='suspended'?'active':'suspended';
var msg=next==='suspended'?('Nonaktifkan akun "'+r.username+'"? Reseller tidak bisa login sampai diaktifkan kembali.'):('Aktifkan kembali akun "'+r.username+'"?');
uiConfirm(msg,next==='suspended'?'Nonaktifkan Reseller':'Aktifkan Reseller',function(){put(r.id,{status:next},'Status diperbarui.')},{danger:next==='suspended',okText:next==='suspended'?'Ya, Nonaktif':'Ya, Aktif'});
},
delete:function(){
uiConfirm('Hapus permanen reseller "'+r.username+'"? \nSemua sesinya dicabut. Riwayat order tetap tersimpan.','Hapus Reseller',function(){del(r.id,'Reseller dihapus.')},{danger:true,okText:'Hapus'});
}
});
return prof;
}
function pendingCard(r){
var prof=ce('div','racc-prof');
prof.appendChild(headRow(r,'warn','mendaftar '+fmtDT(r.created_at),'PENDING','off'));
var menu=ce('div','racc-menu');
menu.appendChild(menuBtn('Edit Profil','M12 20h9M16.5 3.5a2.1 2.1 0 0 1 3 3L7 19l-4 1 1-4z','edit'));
prof.appendChild(menu);
var pbody=ce('div','racc-pbody');
pbody.appendChild(profileRows(r,true));
var pact=ce('div','racc-pact');
var ok=ce('button','racc-btn-butter','Setujui');ok.type='button';
ok.addEventListener('click',function(e){e.stopPropagation();uiConfirm('Setujui akun "'+r.username+'" sebagai reseller aktif?','Konfirmasi Akun',function(){put(r.id,{status:'active'},'Akun disetujui.')})});
var no=ce('button','racc-btn-butter danger','Tolak & Hapus');no.type='button';
no.addEventListener('click',function(e){e.stopPropagation();uiConfirm('Tolak dan hapus pendaftaran "'+r.username+'"? \nTindakan tidak dapat dibatalkan; pendaftar butuh token baru untuk mendaftar lagi.','Tolak Pendaftaran',function(){del(r.id,'Pendaftaran ditolak.')},{danger:true,okText:'Tolak & Hapus'})});
pact.appendChild(ok);pact.appendChild(no);
pbody.appendChild(pact);
prof.appendChild(pbody);
bindCard(prof,{edit:function(){openProfile(r)}});
return prof;
}
function match(r){var q=filter.toLowerCase();if(!q)return true;return[r.username,r.display_name,r.whatsapp,r.x_username].filter(Boolean).join(' ').toLowerCase().indexOf(q)>=0}
function render(){
var pl=document.getElementById('pendingResellerList');
var ol=document.getElementById('resellerList');
if(pl){while(pl.firstChild)pl.removeChild(pl.firstChild);var ps=pending.filter(match);if(!ps.length)pl.appendChild(ce('div','racc-empty','Tidak ada akun menunggu konfirmasi.'));else ps.forEach(function(r){pl.appendChild(pendingCard(r))})}
if(ol){while(ol.firstChild)ol.removeChild(ol.firstChild);var os=others.filter(match);if(!os.length)ol.appendChild(ce('div','racc-empty','Belum ada reseller.'));else os.forEach(function(r){ol.appendChild(resellerCard(r))})}
}
function load(){
return Sec.json('/api/admin/resellers').then(function(rows){
rows=rows||[];
pending=rows.filter(function(r){return r.status==='pending'});
others=rows.filter(function(r){return r.status!=='pending'});
var pc=document.getElementById('pendingResellerCount');if(pc)pc.textContent=String(pending.length);
var rc=document.getElementById('resellerCount');if(rc)rc.textContent=others.length+' akun';
var card=document.getElementById('cardPendingResellers');if(card)card.classList.toggle('hidden',pending.length===0);
render();
}).catch(function(){
var ol=document.getElementById('resellerList');
if(ol){while(ol.firstChild)ol.removeChild(ol.firstChild);ol.appendChild(ce('div','racc-empty','Gagal memuat data.'))}
});
}
M.accountsInit=function(){return load()};
M.loadAccounts=load;
M.renderAccounts=render;
M.setFilter=function(v){filter=String(v||'').trim();render()};
M.closeMenus=function(){Array.prototype.forEach.call(document.querySelectorAll('.racc-prof.menu-open'),function(p){p.classList.remove('menu-open')})};
})(AdminModules.akses=AdminModules.akses||{});
