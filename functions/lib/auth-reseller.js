export const SESSION_COOKIE='rsl_sid';
export const SESSION_HOURS=12;
export const MAX_FAILED=5;
export const LOCK_MINUTES=15;
export const DEFAULT_ITER=150000;
function toHex(buf){return Array.from(new Uint8Array(buf)).map(b=>b.toString(16).padStart(2,'0')).join('')}
function hexToBytes(hex){const out=new Uint8Array(hex.length/2);for(let i=0;i<out.length;i++)out[i]=parseInt(hex.substr(i*2,2),16);return out}
export function nowStr(){return new Date().toISOString().replace('T',' ').slice(0,19)}
export function addHours(h){return new Date(Date.now()+h*3600000).toISOString().replace('T',' ').slice(0,19)}
export function addMinutes(m){return new Date(Date.now()+m*60000).toISOString().replace('T',' ').slice(0,19)}
export function randomHex(n){return toHex(crypto.getRandomValues(new Uint8Array(n)))}
export async function sha256hex(str){return toHex(await crypto.subtle.digest('SHA-256',new TextEncoder().encode(str)))}
export async function pbkdf2hex(password,saltHex,iter){const key=await crypto.subtle.importKey('raw',new TextEncoder().encode(password),{name:'PBKDF2'},false,['deriveBits']);const bits=await crypto.subtle.deriveBits({name:'PBKDF2',salt:hexToBytes(saltHex),iterations:iter,hash:'SHA-256'},key,256);return toHex(bits)}
export async function hashNewPassword(password,iter=DEFAULT_ITER){const salt=randomHex(16);const hash=await pbkdf2hex(password,salt,iter);return{salt,hash,iter}}
function timingSafe(a,b){if(a.length!==b.length)return false;let d=0;for(let i=0;i<a.length;i++)d|=a.charCodeAt(i)^b.charCodeAt(i);return d===0}
export async function verifyPassword(password,reseller){const h=await pbkdf2hex(password,reseller.pass_salt,reseller.pass_iter);return timingSafe(h,reseller.pass_hash)}
export function parseCookies(header){const out={};(header||'').split(';').forEach(p=>{const i=p.indexOf('=');if(i>0)out[p.slice(0,i).trim()]=decodeURIComponent(p.slice(i+1).trim())});return out}
export function isSecure(request){return new URL(request.url).protocol==='https:'}
export function sessionCookieValue(token,secure){return SESSION_COOKIE+'='+token+'; Path=/; HttpOnly; SameSite=Lax'+(secure?'; Secure':'')+'; Max-Age='+(SESSION_HOURS*3600)}
export function clearCookieValue(secure){return SESSION_COOKIE+'=; Path=/; HttpOnly; SameSite=Lax'+(secure?'; Secure':'')+'; Max-Age=0'}
export async function createSession(env,reseller,request){const token=randomHex(32);const th=await sha256hex(token);const ip=request?(request.headers.get('cf-connecting-ip')||''):'';const ua=request?((request.headers.get('user-agent')||'').slice(0,200)):'';await env.DB.prepare('INSERT INTO rsl_sessions(reseller_id,token_hash,expires_at,ip,ua) VALUES(?,?,?,?,?)').bind(reseller.id,th,addHours(SESSION_HOURS),ip,ua).run();return token}
export async function getSession(env,request){const token=parseCookies(request.headers.get('cookie')||'')[SESSION_COOKIE];if(!token)return null;const th=await sha256hex(token);const row=await env.DB.prepare('SELECT s.id AS sid,s.expires_at,s.revoked_at,r.id,r.username,r.display_name,r.status FROM rsl_sessions s JOIN rsl_resellers r ON r.id=s.reseller_id WHERE s.token_hash=?').bind(th).first();if(!row||row.revoked_at||row.expires_at<=nowStr()||row.status!=='active')return null;await env.DB.prepare('UPDATE rsl_sessions SET last_used_at=? WHERE id=?').bind(nowStr(),row.sid).run();return{id:row.id,username:row.username,display_name:row.display_name,sid:row.sid}}
export async function revokeSession(env,request){const token=parseCookies(request.headers.get('cookie')||'')[SESSION_COOKIE];if(!token)return;const th=await sha256hex(token);await env.DB.prepare('UPDATE rsl_sessions SET revoked_at=? WHERE token_hash=? AND revoked_at IS NULL').bind(nowStr(),th).run()}
export function isLocked(r){return!!(r&&r.locked_until&&r.locked_until>nowStr())}
export async function recordFailure(env,id){const r=await env.DB.prepare('SELECT failed_attempts FROM rsl_resellers WHERE id=?').bind(id).first();const n=(r?r.failed_attempts:0)+1;if(n>=MAX_FAILED)await env.DB.prepare('UPDATE rsl_resellers SET failed_attempts=0,locked_until=? WHERE id=?').bind(addMinutes(LOCK_MINUTES),id).run();else await env.DB.prepare('UPDATE rsl_resellers SET failed_attempts=? WHERE id=?').bind(n,id).run()}
export async function resetFailures(env,id){await env.DB.prepare('UPDATE rsl_resellers SET failed_attempts=0,locked_until=NULL,last_login_at=? WHERE id=?').bind(nowStr(),id).run()}

