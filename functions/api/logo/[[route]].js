export async function onRequestGet(context){
const{request,env}=context;
const url=new URL(request.url);
let slug='';
try{slug=decodeURIComponent(url.pathname.replace(/^\/api\/logo\//,'').replace(/\/+$/,'')).toLowerCase()}catch(e){slug=''}
if(!/^[a-z0-9-]{1,64}$/.test(slug))return new Response('Not found',{status:404,headers:{'Cache-Control':'public, max-age=300'}});
if(!env.LOGOS)return new Response('Binding LOGOS belum terpasang',{status:500,headers:{'Cache-Control':'no-store'}});
const obj=await env.LOGOS.get('logos/'+slug);
if(!obj)return new Response('Not found',{status:404,headers:{'Cache-Control':'public, max-age=300'}});
const h=new Headers();
h.set('Content-Type',(obj.httpMetadata&&obj.httpMetadata.contentType)||'image/png');
h.set('Cache-Control','public, max-age=3600');
if(obj.etag)h.set('ETag',obj.etag);
if(obj.uploaded)h.set('Last-Modified',new Date(obj.uploaded).toUTCString());
const inm=request.headers.get('If-None-Match');
if(inm&&obj.etag&&inm===obj.etag)return new Response(null,{status:304,headers:h});
return new Response(obj.body,{status:200,headers:h});
}
export function onRequest(){
return new Response('Method not allowed',{status:405,headers:{'Cache-Control':'no-store'}});
}
