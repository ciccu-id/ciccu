var UI_REG={};
var UI_ACT={};
window.uiVersion='v3-220926';
(function(){
var style=document.createElement('style');
style.textContent='.ui-overlay{position:fixed;inset:0;z-index:300;display:flex;align-items:center;justify-content:center;padding:1rem;background:rgba(51,36,35,.45);backdrop-filter:blur(4px);opacity:0;pointer-events:none;transition:opacity .2s}.ui-overlay.show{opacity:1;pointer-events:auto}.ui-box{background:#fff;border:1px solid #c4dae8;border-radius:1rem;max-width:22rem;width:100%;padding:1.25rem;box-shadow:0 16px 24px -5px rgba(67,47,46,.12);transform:scale(.95);transition:transform .2s}.ui-overlay.show .ui-box{transform:scale(1)}.ui-title{font-family:"Fredoka",sans-serif;font-size:1rem;color:#432f2e;margin-bottom:.4rem}.ui-msg{font-size:.8125rem;color:#55403e;font-weight:600;line-height:1.5;margin-bottom:.875rem;white-space:pre-line}.ui-input{width:100%;background:#eef4f9;border:1px solid #c4dae8;border-radius:.625rem;padding:.5rem .625rem;font-size:.8125rem;font-weight:700;color:#432f2e;outline:none;margin-bottom:.875rem;font-family:inherit}.ui-actions{display:flex;gap:.5rem}.ui-btn{flex:1;padding:.55rem;border-radius:.625rem;font-weight:700;font-size:.8125rem;cursor:pointer;border:1px solid transparent;font-family:inherit;transition:opacity .15s}.ui-btn:hover{opacity:.85}.ui-btn.cancel{background:#f3f4f6;color:#4b5563;border-color:#e5e7eb}.ui-btn.ok{background:#432f2e;color:#fff8dd}.ui-btn.danger{background:#a85555;color:#fff}.ui-toast{position:fixed;top:1rem;left:50%;transform:translateX(-50%) translateY(-3rem);z-index:320;background:#432f2e;color:#fff8dd;padding:.625rem 1rem;border-radius:.875rem;font-size:.8125rem;font-weight:700;box-shadow:0 16px 24px -5px rgba(67,47,46,.2);opacity:0;transition:all .25s;pointer-events:none;max-width:90vw;text-align:center}.ui-toast.show{opacity:1;transform:translateX(-50%) translateY(0)}.ui-toast.err{background:#a85555;color:#fff}';
document.head.appendChild(style);
var overlay=null,box=null,titleEl=null,msgEl=null,inputEl=null,actionsEl=null,cancelBtn=null,okBtn=null,toastEl=null,toastTimer=null;
function build(){
if(overlay)return;
overlay=document.createElement('div');overlay.className='ui-overlay';
box=document.createElement('div');box.className='ui-box';
titleEl=document.createElement('h4');titleEl.className='ui-title';
msgEl=document.createElement('p');msgEl.className='ui-msg';
inputEl=document.createElement('input');inputEl.className='ui-input';inputEl.setAttribute('type','text');
actionsEl=document.createElement('div');actionsEl.className='ui-actions';
cancelBtn=document.createElement('button');cancelBtn.type='button';cancelBtn.className='ui-btn cancel';cancelBtn.textContent='Batal';
okBtn=document.createElement('button');okBtn.type='button';okBtn.className='ui-btn ok';okBtn.textContent='OK';
actionsEl.appendChild(cancelBtn);actionsEl.appendChild(okBtn);
box.appendChild(titleEl);box.appendChild(msgEl);box.appendChild(inputEl);box.appendChild(actionsEl);
overlay.appendChild(box);
document.body.appendChild(overlay);
toastEl=document.createElement('div');toastEl.className='ui-toast';
document.body.appendChild(toastEl);
cancelBtn.addEventListener('click',function(){closeDialog()});
overlay.addEventListener('click',function(e){if(e.target===overlay)closeDialog()});
okBtn.addEventListener('click',function(){
var cb=okBtn._cb;
var val=inputEl.value;
closeDialog();
if(cb)cb(val);
});
}
function closeDialog(){
if(!overlay)return;
overlay.classList.remove('show');
if(okBtn)okBtn._cb=null;
}
function openDialog(opt){
build();
titleEl.textContent=opt.title||'Perhatian';
msgEl.textContent=opt.message||'';
if(opt.prompt){inputEl.style.display='block';inputEl.value=opt.initial||'';setTimeout(function(){inputEl.focus()},50)}
else{inputEl.style.display='none';inputEl.value=''}
cancelBtn.style.display=opt.confirm?'block':'none';
okBtn.textContent=opt.okText||'OK';
okBtn.className='ui-btn '+(opt.danger?'danger':'ok');
okBtn._cb=opt.onOk||null;
overlay.classList.add('show');
}
window.uiToast=function(msg,isErr){
build();
toastEl.textContent=msg;
toastEl.className='ui-toast show'+(isErr?' err':'');
if(toastTimer)clearTimeout(toastTimer);
toastTimer=setTimeout(function(){toastEl.classList.remove('show')},isErr?4000:2000);
};
window.uiAlert=function(message,title){openDialog({title:title||'Informasi',message:message,confirm:false,okText:'Tutup'})};
window.uiConfirm=function(message,title,onYes,opt){opt=opt||{};openDialog({title:title||'Konfirmasi',message:message,confirm:true,okText:opt.okText||'Ya, Lanjutkan',danger:!!opt.danger,onOk:function(){if(onYes)onYes()}})};
window.uiPrompt=function(message,title,onOk,opt){opt=opt||{};openDialog({title:title||'Isi Data',message:message,confirm:true,prompt:true,initial:opt.initial||'',okText:opt.okText||'Simpan',onOk:function(val){if(onOk)onOk(val)}})};
window.uiOn=function(id,fn){UI_REG[id]=fn};
window.uiAct=function(name,fn){UI_ACT[name]=fn};
window.uiTag=function(id,act){var el=document.getElementById(id);if(el)el.setAttribute('data-act',act);return el};
document.addEventListener('click',function(e){
var node=e.target;
while(node&&node!==document){
var id=node.id;
if(id&&UI_REG[id]){e.preventDefault();UI_REG[id](e,node);return}
node=node.parentNode;
}
},true);
document.addEventListener('click',function(e){
var t=e.target;
var el=t.closest?t.closest('[data-act]'):null;
if(!el)return;
var fn=UI_ACT[el.getAttribute('data-act')];
if(!fn)return;
e.preventDefault();
try{fn(e,el)}catch(err){
window.uiAlert('Terjadi kesalahan saat aksi dijalankan:\n'+(err&&err.message?err.message:String(err))+'\n['+window.uiVersion+']','Bug Tertangkap');
}
},true);
window.addEventListener('error',function(ev){
try{window.uiToast('⚠ '+(ev.message||'Error tidak diketahui')+' ['+window.uiVersion+']',true)}catch(e){}
});
window.addEventListener('unhandledrejection',function(ev){
try{
var msg=(ev.reason&&ev.reason.message)?ev.reason.message:String(ev.reason);
window.uiToast('⚠ Gagal: '+msg+' ['+window.uiVersion+']',true);
}catch(e){}
});
})();
(function(){
window.fmtRemain=function(iso){
if(!iso)return{text:'—',mod:'dead'};
var t=Date.parse(String(iso).replace(' ','T')+'Z');
if(isNaN(t))return{text:'—',mod:'dead'};
var diff=t-Date.now();
if(diff<=0)return{text:'Berakhir',mod:'dead'};
var s=Math.floor(diff/1000);
var d=Math.floor(s/86400);s-=d*86400;
var h=Math.floor(s/3600);s-=h*3600;
var m=Math.floor(s/60);s-=m*60;
var txt;
if(d>0)txt=d+'h '+h+'j '+m+'m';
else if(h>0)txt=h+'j '+m+'m '+s+'d';
else if(m>0)txt=m+'m '+s+'d';
else txt=s+'d';
var mod='ok';
if(diff<86400000)mod='danger';
else if(diff<604800000)mod='warn';
return{text:txt,mod:mod};
};
window.uiTickCountdowns=function(){
var els=document.querySelectorAll('[data-cd]');
if(!els.length)return;
for(var i=0;i<els.length;i++){
var el=els[i];
var r=window.fmtRemain(el.getAttribute('data-cd'));
if(el.textContent!==r.text)el.textContent=r.text;
el.classList.remove('ok','warn','danger','dead');
el.classList.add(r.mod);
}
};
setInterval(function(){
if(document.querySelectorAll('[data-cd]').length)window.uiTickCountdowns();
},1000);
})();
(function(){
function ddParent(node){
var n=node;
while(n&&n!==document){
if(n.classList&&n.classList.contains('dd'))return n;
n=n.parentNode;
}
return null;
}
function closeAllDD(except){
var dds=document.querySelectorAll('.dd.open');
for(var i=0;i<dds.length;i++){if(dds[i]!==except)dds[i].classList.remove('open')}
}
document.addEventListener('click',function(e){
var t=e.target;
var btn=t.closest?t.closest('.dd-btn'):null;
if(btn){
var dd=ddParent(btn);
if(dd){e.preventDefault();closeAllDD(dd);dd.classList.toggle('open');}
return;
}
var item=t.closest?t.closest('.dd-item'):null;
if(item){
e.preventDefault();
var dd2=ddParent(item);
if(!dd2)return;
var val=item.getAttribute('data-value')||'';
var hid=dd2.querySelector('input[type="hidden"]');
if(hid){
hid.value=val;
var ev=new Event('change',{bubbles:true});
hid.dispatchEvent(ev);
}
var lbl=dd2.querySelector('.dd-btn span');
var txt=item.querySelector('span');
if(lbl&&txt)lbl.textContent=txt.textContent;
var items=dd2.querySelectorAll('.dd-item');
for(var i=0;i<items.length;i++){items[i].classList.toggle('active',items[i]===item)}
dd2.classList.remove('open');
return;
}
var inside=t.closest?t.closest('.dd'):null;
if(!inside)closeAllDD(null);
},true);
})();
