export async function onRequestGet(context){
const{env}=context;
const headers={'Content-Type':'application/json','Cache-Control':'public, max-age=300'};
try{
const r=await env.DB.prepare('SELECT app_name,logo_path,app_type FROM app_metadata').all();
const out=(r.results||[]).map(function(x){return{n:x.app_name,l:x.logo_path||'',t:x.app_type||'lainnya'}});
return new Response(JSON.stringify(out),{headers:headers});
}catch(e){
return new Response(JSON.stringify([]),{status:500,headers:headers});
}
}
export function onRequest(){
return new Response('Method not allowed',{status:405,headers:{'Cache-Control':'no-store'}});
}
