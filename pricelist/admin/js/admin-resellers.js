function admHeadersJson(){return{'Content-Type':'application/json','x-admin-password':sessionPass}}
function fmtDT(s){if(!s)return'-';try{return new Date(s+'Z').toLocaleString('id-ID',{timeZone:'Asia/Jakarta'})}catch(e){return s}}
function loadResellers(){
var list=document.getElementById('resellerList');
if(!list)return;
while(list.firstChild)list.removeChild(list.firstChild);
list.appendChild(ce('div','loading-state','Memuat reseller...'));
fetch('/api/admin/resellers',{headers:{'x-admin-password':sessionPass}}).then(function(r){return r.json()}).then(function(rows){
while(list.firstChild)list.removeChild(list.firstChild);
if(!rows.length){list.appendChild(ce('div','empty-state','Belum ada reseller.'));return}
rows.forEach(function(r){
var row=ce('div','fs-item');
var info=ce('div','fs-item-info');
var locked=r.locked_until&&r.locked_until>new Date().toISOString().replace('T',' ').slice(0,19);
var badges=[];
if(r.status==='suspended')badges.push({t:'Suspended',c:'var(--brick-500)'});
if(locked)badges.push({t:'Locked',c:'var(--choco-700)'});
var nameP=ce('p','fs-item-name',r.username+(r.display_name?(' ('+r.display_name+')'):''));
badges.forEach(function(b){var span=document.createElement('span');span.className='pkg-flash-badge';span.style.color=b.c;span.textContent=b.t;nameP.appendChild(document.createTextNode(' '));nameP.appendChild(span)});
info.appendChild(nameP);
var meta=ce('p','fs-item-price','Status: '+r.status+' • Login terakhir: '+fmtDT(r.last_login_at)+' • Gagal: '+r.failed_attempts);
info.appendChild(meta);
row.appendChild(info);
var act=ce('div','fs-item-actions');
var toggleBtn=ce('button','fs-edit-btn',r.status==='suspended'?'Aktifkan':'Suspend');
toggleBtn.setAttribute('type','button');
toggleBtn.addEventListener('click',function(){
var next=r.status==='suspended'?'active':'suspended';
if(!confirm('Ubah status "'+r.username+'" menjadi '+next+'?'))return;
fetch('/api/admin/resellers/'+r.id,{method:'PUT',headers:admHeadersJson(),body:JSON.stringify({status:next})})
.then(handleResponseStatus)
.then(function(){loadResellers()})
.catch(function(){alert('Gagal mengubah status.')});
});
act.appendChild(toggleBtn);
var resetBtn=ce('button','fs-edit-btn','Reset Password');
resetBtn.setAttribute('type','button');
resetBtn.addEventListener('click',function(){
var pw=prompt('Password baru untuk "'+r.username+'" (minimal 8 karakter, semua sesi aktif akan dicabut):');
if(!pw)return;
if(pw.length<8)return alert('Password minimal 8 karakter.');
fetch('/api/admin/resellers/'+r.id,{method:'PUT',headers:admHeadersJson(),body:JSON.stringify({password:pw})})
.then(handleResponseStatus)
.then(function(){alert('Password berhasil direset.')})
.catch(function(){alert('Gagal reset password.')});
});
act.appendChild(resetBtn);
row.appendChild(act);
list.appendChild(row);
});
}).catch(function(){while(list.firstChild)list.removeChild(list.firstChild);list.appendChild(ce('div','empty-state','Gagal memuat reseller.'))});
}
function submitResellerForm(e){
e.preventDefault();
var u=document.getElementById('resUsername').value.trim();
var dn=document.getElementById('resDisplayName').value.trim()||u;
var pw=document.getElementById('resPassword').value;
if(!u||!pw||pw.length<8)return alert('Username & password minimal 8 karakter wajib diisi.');
fetch('/api/admin/resellers',{method:'POST',headers:admHeadersJson(),body:JSON.stringify({username:u,display_name:dn,password:pw})})
.then(handleResponseStatus)
.then(function(){e.target.reset();loadResellers()})
.catch(function(err){alert('Gagal membuat reseller.')});
}
document.addEventListener('DOMContentLoaded',function(){
var form=document.getElementById('resellerForm');
if(form)form.addEventListener('submit',submitResellerForm);
});
