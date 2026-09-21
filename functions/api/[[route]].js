const corsHeaders = {
'Access-Control-Allow-Origin': 'https://ciccu.biz.id',
'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
'Access-Control-Allow-Headers': 'Content-Type'
};
async function verifyTurnstile(token, secret) {
if (!token) return false;
const fd = new FormData();
fd.append('secret', secret);
fd.append('response', token);
const res = await fetch('https://challenges.cloudflare.com/turnstile/v0/siteverify', { method: 'POST', body: fd });
const out = await res.json();
return out.success;
}
function truncate(str, max) { return str ? String(str).slice(0, max) : ''; }
export async function onRequest(context) {
const { request, env } = context;
const url = new URL(request.url);
const path = url.pathname;
const method = request.method;
if (method === 'OPTIONS') return new Response(null, { headers: corsHeaders });
const jsonResp = (data, status = 200, cache = 0) => {
const h = { ...corsHeaders, 'Content-Type': 'application/json', 'Cache-Control': cache > 0 ? `public, max-age=${cache}` : 'no-store' };
return new Response(JSON.stringify(data), { headers: h, status });
};
const err = (msg, status = 500) => jsonResp({ error: msg }, status);
try {
const body = method === 'POST' ? await request.json().catch(() => ({})) : null;
if (path === '/api/login' && method === 'POST') {
if (!await verifyTurnstile(body.turnstileResponse, env.TURNSTILE_SECRET)) return err('Captcha tidak valid', 400);
if (body.password !== env.ADMIN_PASSWORD) return err('Password salah', 403);
return jsonResp({ success: true });
}
if (path === '/api/settings' && method === 'GET') {
const { results } = await env.DB.prepare('SELECT * FROM store_settings WHERE id = 1').all();
if (!results || !results.length) return jsonResp({ is_closed: false, message: '', flash_sale_start: '', flash_sale_end: '', flash_sale_name: 'Flash Sale', flash_sale_description: '' }, 200, 10);
const s = results[0];
let closed = s.is_closed === 1;
if (s.auto_schedule === 1) {
const now = new Intl.DateTimeFormat('en-GB', { timeZone: 'Asia/Jakarta', hour: '2-digit', minute: '2-digit', hour12: false }).format(new Date());
const [cH, cM] = now.split(':').map(Number);
const [oH, oM] = (s.open_time || '05:00').split(':').map(Number);
const [xH, xM] = (s.close_time || '23:00').split(':').map(Number);
const cur = cH * 60 + cM, op = oH * 60 + oM, cl = xH * 60 + xM;
closed = op < cl ? (cur < op || cur >= cl) : (cur >= cl && cur < op);
}
return jsonResp({ is_closed: closed, message: s.close_message || '', flash_sale_start: s.flash_sale_start || '', flash_sale_end: s.flash_sale_end || '', flash_sale_name: s.flash_sale_name || 'Flash Sale', flash_sale_description: s.flash_sale_description || '' }, 200, 10);
}
if (path === '/api/pricelist' && method === 'GET') {
const { results } = await env.DB.prepare('SELECT * FROM pricelist').all();
return jsonResp(results, 200, 30);
}
if (path === '/api/forms' && method === 'GET') {
const { results } = await env.DB.prepare('SELECT * FROM app_forms').all();
return jsonResp(results, 200, 30);
}
if (path === '/api/testimoni' && method === 'GET') {
const { results } = await env.DB.prepare('SELECT * FROM testimonials ORDER BY created_at DESC').all();
return jsonResp(results, 200, 30);
}
if (path === '/api/testimoni' && method === 'POST') {
if (!await verifyTurnstile(body.turnstileResponse, env.TURNSTILE_SECRET)) return err('Mohon selesaikan verifikasi keamanan', 400);
const nama = truncate(body.nama || 'Anonim', 50);
const komentar = truncate(body.komentar || '', 500);
if (!komentar) return err('Komentar tidak boleh kosong', 400);
await env.DB.prepare('INSERT INTO testimonials (nama, komentar) VALUES (?, ?)').bind(nama, komentar).run();
return jsonResp({ success: true }, 201);
}
return err('Endpoint tidak ditemukan', 404);
} catch (e) {
console.error('Server error:', e);
return err('Terjadi kesalahan di server.', 500);
}
}
