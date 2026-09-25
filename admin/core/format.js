function fmtRp(n){return'Rp '+Number(n||0).toLocaleString('id-ID')}
function fmtRpShort(n){n=Number(n||0);if(n>=1e9)return'Rp '+(n/1e9).toLocaleString('id-ID',{maximumFractionDigits:1})+' M';if(n>=1e6)return'Rp '+(n/1e6).toLocaleString('id-ID',{maximumFractionDigits:1})+' jt';if(n>=1e3)return'Rp '+(n/1e3).toLocaleString('id-ID',{maximumFractionDigits:1})+' rb';return fmtRp(n)}
function fmtParse(s){if(!s)return NaN;return Date.parse(String(s).replace(' ','T')+'Z')}
function fmtDT(s){var t=fmtParse(s);if(isNaN(t))return s||'-';return new Date(t).toLocaleString('id-ID',{day:'2-digit',month:'short',hour:'2-digit',minute:'2-digit'})}
function fmtDate(s){var t=fmtParse(s);if(isNaN(t))return s||'-';return new Date(t).toLocaleDateString('id-ID',{day:'2-digit',month:'short',year:'numeric'})}
function fmtTime(s){var t=fmtParse(s);if(isNaN(t))return s||'-';return new Date(t).toLocaleTimeString('id-ID',{hour:'2-digit',minute:'2-digit'})}
function fmtRemain(iso){var t=fmtParse(iso);if(isNaN(t))return{text:'-',mod:'dead'};var ms=t-Date.now();if(ms<=0)return{text:'Kedaluwarsa',mod:'dead'};var m=Math.floor(ms/60000);var d=Math.floor(m/1440);var h=Math.floor((m%1440)/60);var mm=m%60;var text=d>0?(d+'h '+h+'j '+mm+'m'):(h>0?(h+'j '+mm+'m'):(mm+'m'));var mod=d>=1?'ok':(h>=1?'warn':'danger');return{text:text,mod:mod}}
function durLabel(h){if(h===24)return'24 Jam';if(h===168)return'7 Hari';if(h===720)return'30 Hari';return h+' jam'}
function slugify(s){return String(s||'').toLowerCase().replace(/[^a-z0-9]+/g,'-').replace(/^-+|-+$/g,'').slice(0,64)}
