const LOGO_CT=['image/png','image/jpeg','image/webp','image/gif','image/svg+xml','image/x-icon','image/vnd.microsoft.icon'];
const GOOGLE_MIN_BYTES=800;
const LOGO_MAP={'netflix':'netflix.com','disney':'disneyplus.com','youtube':'youtube.com','viu':'viu.com','iqiyi':'iq.com','amazon':'primevideo.com','prime':'primevideo.com','hbo':'hbogoasia.id','wetv':'wetv.vip','we tv':'wetv.vip','vidio':'vidio.com','crunchyroll':'crunchyroll.com','loklok':'loklok.com','loktv':'loklok.com','gagaoolala':'gagaoolala.com','dramabox':'dramaboxapp.com','apple tv':'tv.apple.com','bstation':'https://img.icons8.com/color/144/bilibili.png','viki plus':'viki.com','drakor id':'drakorid.co','mango tv':'mgtv.com','mangotv':'mgtv.com','spotify':'open.spotify.com','apple music':'music.apple.com','apple':'music.apple.com','canva':'canva.com','capcut':'capcut.com','alight motion':'alightcreative.com','alight':'alightcreative.com','chatgpt':'openai.com','claude':'anthropic.com','grok':'x.ai','grokai':'x.ai','ms365':'office.com','microsoft':'microsoft.com','turnitin':'turnitin.com','cek turnitin':'turnitin.com','cek ai':'zerogpt.com','duolingo':'https://img.icons8.com/color/144/duolingo-logo.png','picsart':'picsart.com','remini':'remini.ai','wattpad':'wattpad.com','pollar':'polarr.com','ibis paint':'ibispaint.com','quillbot':'quillbot.com','meitu':'meitu.com','camscanner':'camscanner.com','grammarly':'grammarly.com','viki rakuten':'viki.com','wink':'wink.meitu.com','aio drama':'https://img.icons8.com/color/144/clapperboard.png','aiodrama':'https://img.icons8.com/color/144/clapperboard.png','aio':'https://img.icons8.com/color/144/clapperboard.png','ilovepdf':'ilovepdf.com','wps office':'wps.com','robux':'roblox.com','youku':'youku.tv','sushiroll':'sushiroll.co.id'};
function slugify(s){return String(s).toLowerCase().replace(/[^a-z0-9]+/g,'-').replace(/^-+|-+$/g,'').slice(0,64)}
function findSource(name){const n=name.toLowerCase();for(const k in LOGO_MAP){if(n.indexOf(k)>=0){const d=LOGO_MAP[k];if(d.indexOf('http')===0)return{type:'direct',url:d};return{type:'google',domain:d}}}return null}
function googleUrl(domain,sz){return 'https://www.google.com/s2/favicons?sz='+sz+'&domain='+domain}
async function fetchCandidate(u){
const ctl=new AbortController();
const to=setTimeout(function(){ctl.abort()},8000);
try{
const res=await fetch(u,{redirect:'follow',signal:ctl.signal,headers:{'User-Agent':'CiccuLogoBot/1.0'}});
clearTimeout(to);
if(!res.ok)return null;
const ct=(res.headers.get('content-type')||'').split(';')[0].trim().toLowerCase();
if(LOGO_CT.indexOf(ct)<0)return null;
const buf=await res.arrayBuffer();
if(!buf.byteLength||buf.byteLength>307200)return null;
return{buf:buf,ct:ct};
}catch(e){clearTimeout(to);return null}
}
async function pickBest(source){
if(source.type==='direct'){const r=await fetchCandidate(source.url);return r?{r:r,note:'langsung'}:null}
let r=await fetchCandidate(googleUrl(source.domain,128));
if(r&&r.buf.byteLength>=GOOGLE_MIN_BYTES)return{r:r,note:'128px'};
const r64=await fetchCandidate(googleUrl(source.domain,64));
if(r64&&(!r||r64.buf.byteLength>r.buf.byteLength))return{r:r64,note:'64px'};
if(r)return{r:r,note:'128px kecil'};
return null;
}
function renderHtml(ctx){
const css='*{box-sizing:border-box;margin:0;padding:0}body{font-family:system-ui,-apple-system,sans-serif;background:#f3f4f6;padding:12px;max-width:600px;margin:0 auto;color:#1f2937}h2{margin-bottom:12px;font-size:20px}.bar{background:#fff;border:1px solid #e5e7eb;border-radius:8px;padding:12px;margin-bottom:12px}.progress{height:8px;background:#e5e7eb;border-radius:4px;overflow:hidden;margin-top:8px}.progress>div{height:100%;background:#2563eb;transition:width .3s}.item{padding:10px;margin:6px 0;border-left:4px solid;border-radius:6px;font-size:14px;word-break:break-word}.ok{background:#f0fdf4;border-color:#16a34a;color:#166534}.err{background:#fef2f2;border-color:#dc2626;color:#991b1b}.skip{background:#fefce8;border-color:#ca8a04;color:#854d0e}.item b{display:block;font-size:15px;margin-bottom:4px}.btn{display:block;text-align:center;padding:14px;background:#2563eb;color:#fff;text-decoration:none;border-radius:8px;font-weight:700;margin-top:12px;font-size:15px}.btn:active{background:#1d4ed8}.btn.red{background:#dc2626}.muted{font-size:12px;color:#6b7280;margin-top:6px}';
let body='<h2>🎨 Migrasi Logo ke R2</h2>';
body+='<div class="bar"><div style="display:flex;justify-content:space-between;align-items:center"><b>Progress</b><span class="muted">'+ctx.done+'/'+ctx.total+' aplikasi</span></div><div class="progress"><div style="width:'+Math.round(ctx.done/Math.max(ctx.total,1)*100)+'%"></div></div></div>';
if(ctx.error){body+='<div class="item err"><b>❌ Error</b>'+ctx.error+'</div>';return '<!DOCTYPE html><html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><style>'+css+'</style></head><body>'+body+'</body></html>'}
for(const r of ctx.results){const cls=r.status==='ok'?'ok':r.status==='err'?'err':'skip';const icon=r.status==='ok'?'✅':r.status==='err'?'❌':'⚠️';body+='<div class="item '+cls+'"><b>'+icon+' '+r.name+'</b>'+r.msg+'</div>'}
if(ctx.total===0){body+='<div class="item ok"><b>✅ Migrasi Selesai!</b>Semua aplikasi sudah punya logo atau tidak ada yang perlu diproses. Sekarang hapus file ini dari repo.</div>';body+='<a href="https://dash.cloudflare.com" class="btn red">Buka Dashboard Cloudflare</a>'}
else if(ctx.results.length===ctx.batchSize){const next=ctx.offset+ctx.batchSize;body+='<a href="'+ctx.baseUrl+'?pass='+encodeURIComponent(ctx.pass)+'&batch='+ctx.batchSize+'&offset='+next+'" class="btn">Lanjut ke batch berikutnya →</a>'}
else{body+='<div class="item ok"><b>✅ Batch Terakhir Selesai!</b>Jalankan ulang dari offset 0 untuk verifikasi akhir.</div>';body+='<a href="'+ctx.baseUrl+'?pass='+encodeURIComponent(ctx.pass)+'&batch='+ctx.batchSize+'&offset=0" class="btn">Verifikasi Ulang dari Awal</a>'}
body+='<p class="muted" style="margin-top:16px;text-align:center">⚠️ Hapus file ini dari repo setelah migrasi selesai.</p>';
return '<!DOCTYPE html><html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><style>'+css+'</style></head><body>'+body+'</body></html>';
}
export async function onRequest(context){
const{request,env}=context;
if(request.method!=='GET')return new Response('GET only',{status:405});
const url=new URL(request.url);
const pass=url.searchParams.get('pass')||'';
const batchSize=Math.min(Math.max(parseInt(url.searchParams.get('batch')||'5',10)||5,1),10);
const offset=Math.max(parseInt(url.searchParams.get('offset')||'0',10)||0,0);
const baseUrl=url.origin+url.pathname;
const ctx={pass,batchSize,offset,baseUrl,total:0,done:0,results:[],error:null};
if(!env.ADMIN_PASSWORD){ctx.error='ADMIN_PASSWORD tidak tersedia';return new Response(renderHtml(ctx),{headers:{'Content-Type':'text/html;charset=utf-8'}})}
if(!pass||pass!==env.ADMIN_PASSWORD){ctx.error='Password admin salah atau kosong';return new Response(renderHtml(ctx),{headers:{'Content-Type':'text/html;charset=utf-8'}})}
if(!env.LOGOS){ctx.error='Binding LOGOS tidak terpasang';return new Response(renderHtml(ctx),{headers:{'Content-Type':'text/html;charset=utf-8'}})}
let allApps;
try{allApps=await env.DB.prepare('SELECT app_name FROM app_metadata WHERE logo_path=? ORDER BY app_name').bind('').all();ctx.total=allApps.results.length;ctx.done=allApps.results.length}catch(e){ctx.error='Query gagal: '+(e&&e.message||e);return new Response(renderHtml(ctx),{headers:{'Content-Type':'text/html;charset=utf-8'}})}
if(ctx.total===0)return new Response(renderHtml(ctx),{headers:{'Content-Type':'text/html;charset=utf-8'}});
const batch=allApps.results.slice(offset,offset+batchSize);
if(batch.length===0){ctx.total=0;return new Response(renderHtml(ctx),{headers:{'Content-Type':'text/html;charset=utf-8'}})}
for(const row of batch){
const name=row.app_name;
const source=findSource(name);
if(!source){ctx.results.push({name,status:'skip',msg:'Tidak ada di LOGO_MAP — isi manual lewat picker nanti.'});continue}
const slug=slugify(name);
if(!slug){ctx.results.push({name,status:'err',msg:'Nama tidak bisa dislugify.'});continue}
const picked=await pickBest(source);
if(!picked){ctx.results.push({name,status:'err',msg:'Semua kandidat gambar gagal diambil.'});continue}
try{
await env.LOGOS.put('logos/'+slug,picked.r.buf,{httpMetadata:{contentType:picked.r.ct,cacheControl:'public, max-age=3600'}});
await env.DB.prepare('UPDATE app_metadata SET logo_path=? WHERE app_name=?').bind(slug,name).run();
ctx.results.push({name,status:'ok',msg:'Tersimpan: <b>'+slug+'</b> • sumber: '+picked.note+' • '+Math.round(picked.r.buf.byteLength/1024)+' KB'});
ctx.done++;
}catch(e){ctx.results.push({name,status:'err',msg:'Upload/DB gagal: '+(e&&e.message||e)})}
}
return new Response(renderHtml(ctx),{headers:{'Content-Type':'text/html;charset=utf-8'}});
}
