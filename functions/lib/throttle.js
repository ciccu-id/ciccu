import{nowStr,addMinutes}from'./auth-reseller.js';
const LOGIN_WINDOW_MIN=15;
const LOGIN_MAX_FAILS=20;
const LOGIN_LOCK_MIN=15;
function ts(s){if(!s)return 0;const t=Date.parse(String(s).replace(' ','T')+'Z');return isNaN(t)?0:t}
export async function checkLoginThrottle(env,ip){
if(!ip)return{ok:true};
const row=await env.DB.prepare('SELECT login_locked_until FROM rsl_ip_throttle WHERE ip=?').bind(ip).first();
if(row&&row.login_locked_until){const lu=ts(row.login_locked_until);if(lu>Date.now())return{ok:false,retry_after:Math.ceil((lu-Date.now())/60000)}}
return{ok:true};
}
export async function recordLoginFail(env,ip){
if(!ip)return;
const now=nowStr();const nowMs=Date.now();
const row=await env.DB.prepare('SELECT login_fails,login_window_start FROM rsl_ip_throttle WHERE ip=?').bind(ip).first();
let fails=0,ws=now;
if(row){const wt=ts(row.login_window_start);if(wt&&(nowMs-wt)<=LOGIN_WINDOW_MIN*60000)fails=row.login_fails||0;}
fails+=1;
let lock=null;
if(fails>=LOGIN_MAX_FAILS){lock=addMinutes(LOGIN_LOCK_MIN);fails=0;ws=now}
await env.DB.prepare('INSERT INTO rsl_ip_throttle(ip,login_fails,login_window_start,login_locked_until,updated_at) VALUES(?,?,?,?,?) ON CONFLICT(ip) DO UPDATE SET login_fails=excluded.login_fails,login_window_start=excluded.login_window_start,login_locked_until=excluded.login_locked_until,updated_at=excluded.updated_at').bind(ip,fails,ws,lock,now).run();
}
export async function clearLoginThrottle(env,ip){
if(!ip)return;
await env.DB.prepare('UPDATE rsl_ip_throttle SET login_fails=0,login_window_start=NULL,login_locked_until=NULL,updated_at=? WHERE ip=?').bind(nowStr(),ip).run();
}
