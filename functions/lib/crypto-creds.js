export const CRED_ENC_ALG='AES-GCM';
export const CRED_ENC_VERSION=1;
function enc(s){return new TextEncoder().encode(s)}
function dec(b){return new TextDecoder().decode(b)}
function b64(buf){const u=new Uint8Array(buf);let s='';for(let i=0;i<u.length;i++)s+=String.fromCharCode(u[i]);return btoa(s)}
function unb64(s){const b=atob(String(s||'')),u=new Uint8Array(b.length);for(let i=0;i<b.length;i++)u[i]=b.charCodeAt(i);return u.buffer}
async function rawKey(secret){const t=String(secret||'').trim();try{const r=unb64(t);if(r.byteLength===32)return r}catch(e){}return crypto.subtle.digest('SHA-256',enc(t))}
async function getKey(env){const s=env&&env.CRED_ENC_KEY;if(!s)throw new Error('CRED_ENC_KEY belum diset');return crypto.subtle.importKey('raw',await rawKey(s),{name:CRED_ENC_ALG},false,['encrypt','decrypt'])}
export function isEncrypted(v){if(typeof v!=='string'||v.length<20)return false;try{const o=JSON.parse(v);return !!(o&&o.alg===CRED_ENC_ALG&&o.iv&&o.ct)}catch(e){return false}}
function plainObj(v){if(!v)return{};if(typeof v==='object')return Array.isArray(v)?{}:v;try{const o=JSON.parse(v);return o&&typeof o==='object'&&!Array.isArray(o)?o:{}}catch(e){return{}}}
export async function encryptJSON(env,obj){const key=await getKey(env);const iv=crypto.getRandomValues(new Uint8Array(12));const ct=await crypto.subtle.encrypt({name:CRED_ENC_ALG,iv},key,enc(JSON.stringify(obj==null?{}:obj)));return JSON.stringify({v:CRED_ENC_VERSION,alg:CRED_ENC_ALG,iv:b64(iv),ct:b64(ct)})}
export async function decryptJSON(env,stored){if(!isEncrypted(stored))return plainObj(stored);const o=JSON.parse(stored);const key=await getKey(env);try{const pt=await crypto.subtle.decrypt({name:CRED_ENC_ALG,iv:unb64(o.iv)},key,unb64(o.ct));return plainObj(dec(pt))}catch(e){throw new Error('Gagal mendekripsi data kredensial')}}
export async function encryptString(env,str){return encryptJSON(env,plainObj(str))}
export async function decryptToString(env,stored){return JSON.stringify(await decryptJSON(env,stored))}
