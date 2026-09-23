const LOGO_CT=['image/png','image/jpeg','image/webp','image/gif','image/svg+xml','image/x-icon','image/vnd.microsoft.icon'];
function slugify(s){return String(s).toLowerCase().replace(/[^a-z0-9]+/g,'-').replace(/^-+|-+$/g,'').slice(0,64)}
function html(parts){
const body=parts.map(function(p){
const c=p.status==='ok'?'#16a34a':p.status==='err'?'#dc2626':'#ca8a04';
const bg=p.status==='ok'?'#f0fdf4':p.status==='err'?'#fef2f2':'#fefce8';
return '<div style="padding:12px;margin:6px 0;border-left:4px solid '+c+';background:'+bg+';border-radius:6px"><div style="font-weight:800;color:'+c+'">'+p.label+'</div><div style="color:#333;font-size:13px;margin-top:4px;word-break:break-all">'+p.msg+'</div></div>';
}).join('');
return '<!DOCTYPE html><html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Logo Test</title></head><body style="font-family:system-ui,sans-serif;background:#f3f4f6;padding:12px;max-width:600px;margin:0 auto"><h2 style="color:#1f2937">Debug Logo Endpoint</h2>'+body+'</body></html>';
}
async function onGet(request,env){
const url=new URL(request.url);
const pass=url.searchParams.get('pass')||'';
const appName=url.searchParams.get('app_name')||'';
const targetUrl=url.searchParams.get('url')||'';
const parts=[];
if(!env.ADMIN_PASSWORD){parts.push({status:'err',label:'ADMIN_PASSWORD',msg:'Variabel lingkungan ADMIN_PASSWORD tidak ada di Pages'});return new Response(html(parts),{headers:{'Content-Type':'text/html;charset=utf-8'}})}
if(!pass){parts.push({status:'warn',label:'Parameter',msg:'Parameter "pass" belum ada. Buka URL dengan format: /api/logo-test?pass=PASSWORD_ADMIN&app_name=Netflix&url=URL_GAMBAR'});return new Response(html(parts),{headers:{'Content-Type':'text/html;charset=utf-8'}})}
if(pass!==env.ADMIN_PASSWORD){parts.push({status:'err',label:'Autentikasi',msg:'Password admin salah'});return new Response(html(parts),{headers:{'Content-Type':'text/html;charset=utf-8'}})}
parts.push({status:'ok',label:'Autentikasi',msg:'Password admin valid'});
if(!env.LOGOS){parts.push({status:'err',label:'Binding R2',msg:'Binding LOGOS tidak terpasang'});return new Response(html(parts),{headers:{'Content-Type':'text/html;charset=utf-8'}})}
parts.push({status:'ok',label:'Binding R2',msg:'Binding LOGOS tersedia'});
if(!appName||!targetUrl){parts.push({status:'warn',label:'Parameter',msg:'Parameter app_name atau url belum ada. Lengkapi URL untuk uji ingest.'});return new Response(html(parts),{headers:{'Content-Type':'text/html;charset=utf-8'}})}
const slug=slugify(appName);
parts.push({status:'ok',label:'Slug',msg:'Akan disimpan dengan key: logos/'+slug});
let u;
try{u=new URL(targetUrl)}catch(e){parts.push({status:'err',label:'URL Sumber',msg:'URL tidak valid: '+e.message});return new Response(html(parts),{headers:{'Content-Type':'text/html;charset=utf-8'}})}
parts.push({status:'ok',label:'URL Sumber',msg:u.href});
const ctl=new AbortController();
const to=setTimeout(function(){ctl.abort()},8000);
let res;
try{res=await fetch(u.href,{redirect:'follow',signal:ctl.signal,headers:{'User-Agent':'CiccuLogoBot/1.0'}})}catch(e){clearTimeout(to);parts.push({status:'err',label:'Fetch Sumber',msg:'Gagal: '+(e&&e.message||String(e))});return new Response(html(parts),{headers:{'Content-Type':'text/html;charset=utf-8'}})}
clearTimeout(to);
parts.push({status:'ok',label:'Fetch Sumber',msg:'HTTP '+res.status});
const ct=(res.headers.get('content-type')||'').split(';')[0].trim().toLowerCase();
if(LOGO_CT.indexOf(ct)<0){parts.push({status:'err',label:'Content-Type',msg:'Bukan gambar: '+ct});return new Response(html(parts),{headers:{'Content-Type':'text/html;charset=utf-8'}})}
parts.push({status:'ok',label:'Content-Type',msg:ct});
const buf=await res.arrayBuffer();
parts.push({status:'ok',label:'Ukuran',msg:buf.byteLength+' bytes'});
if(buf.byteLength>307200){parts.push({status:'err',label:'Validasi',msg:'Terlalu besar (maks 300 KB)'});return new Response(html(parts),{headers:{'Content-Type':'text/html;charset=utf-8'}})}
try{await env.LOGOS.put('logos/'+slug,buf,{httpMetadata:{contentType:ct,cacheControl:'public, max-age=3600'}});parts.push({status:'ok',label:'Upload R2',msg:'Berhasil: logos/'+slug})}catch(e){parts.push({status:'err',label:'Upload R2',msg:'Gagal: '+(e&&e.message||String(e))});return new Response(html(parts),{headers:{'Content-Type':'text/html;charset=utf-8'}})}
let existing;
try{existing=await env.LOGOS.get('logos/'+slug)}catch(e){parts.push({status:'err',label:'Verifikasi',msg:'Tidak bisa baca balik: '+(e&&e.message||String(e))});return new Response(html(parts),{headers:{'Content-Type':'text/html;charset=utf-8'}})}
if(!existing){parts.push({status:'err',label:'Verifikasi',msg:'File tidak muncul setelah upload'});return new Response(html(parts),{headers:{'Content-Type':'text/html;charset=utf-8'}})}
parts.push({status:'ok',label:'Verifikasi',msg:'File ada di R2, ukuran '+existing.size+' bytes'});
parts.push({status:'ok',label:'Selanjutnya',msg:'Buka <a href="/api/logo/'+slug+'" style="color:#2563eb">/api/logo/'+slug+'</a> untuk melihat gambar. Hasil ini murni R2, belum menyentuh database.'});
return new Response(html(parts),{headers:{'Content-Type':'text/html;charset=utf-8'}});
}
export function onRequest(context){
const{request,env}=context;
if(request.method!=='GET')return new Response('GET only',{status:405});
return onGet(request,env);
}
