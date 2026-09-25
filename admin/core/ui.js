var Ui=(function(){
var root=null,dlg=null,state=null;
function ensureRoot(){if(root)return root;root=ce('div','ui-toast-root');document.body.appendChild(root);return root}
function toast(msg){var r=ensureRoot();var t=ce('div','ui-toast',msg);r.appendChild(t);setTimeout(function(){t.classList.add('out');setTimeout(function(){if(t.parentNode)t.parentNode.removeChild(t)},300)},2200)}
function ensureDlg(){
if(dlg)return dlg;
dlg=ce('div','ui-dlg');
dlg.appendChild(frag('<div class="ui-dlg-back"></div><div class="ui-dlg-box"><p class="ui-dlg-title"></p><div class="ui-dlg-msg"></div><input class="ui-dlg-input" type="text" autocomplete="off"><div class="ui-dlg-actions"><button type="button" class="ui-dlg-cancel">Batal</button><button type="button" class="ui-dlg-ok">OK</button></div></div>'));
document.body.appendChild(dlg);
dlg.querySelector('.ui-dlg-back').addEventListener('click',close);
dlg.querySelector('.ui-dlg-cancel').addEventListener('click',close);
dlg.querySelector('.ui-dlg-ok').addEventListener('click',function(){
var s=state;close();
if(!s||!s.cb)return;
if(s.prompt){var inp=dlg.querySelector('.ui-dlg-input');s.cb(inp.value)}else{s.cb()}
});
dlg.addEventListener('keydown',function(e){if(e.key==='Escape')close()});
return dlg;
}
function close(){if(!dlg)return;dlg.classList.remove('on');state=null}
function open(cfg){
var d=ensureDlg();state=cfg;
d.querySelector('.ui-dlg-title').textContent=cfg.title||'';
var m=d.querySelector('.ui-dlg-msg');m.textContent=cfg.msg||'';
var inp=d.querySelector('.ui-dlg-input');
if(cfg.prompt){inp.style.display='';inp.value=cfg.value||'';inp.placeholder=cfg.placeholder||''}else{inp.style.display='none'}
var ok=d.querySelector('.ui-dlg-ok');ok.textContent=cfg.okText||'OK';ok.className='ui-dlg-ok'+(cfg.danger?' danger':'');
d.querySelector('.ui-dlg-cancel').style.display=cfg.alert?'none':'';
d.classList.add('on');
if(cfg.prompt)setTimeout(function(){inp.focus()},60);
}
function uiToast(m){toast(m)}
function uiAlert(m,t){open({alert:true,title:t||'Perhatian',msg:m,okText:'Tutup'})}
function uiConfirm(m,t,cb,o){o=o||{};open({title:t||'Konfirmasi',msg:m,okText:o.okText||'Ya',danger:!!o.danger,cb:cb})}
function uiPrompt(m,t,cb,o){o=o||{};open({prompt:true,title:t||'Isi Data',msg:m,okText:o.okText||'Simpan',placeholder:o.placeholder||'',cb:cb})}
window.uiToast=uiToast;window.uiAlert=uiAlert;window.uiConfirm=uiConfirm;window.uiPrompt=uiPrompt;
return{toast:uiToast,alert:uiAlert,confirm:uiConfirm,prompt:uiPrompt,close:close};
})();
