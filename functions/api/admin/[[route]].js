const corsHeaders = {
'Access-Control-Allow-Origin': 'https://ciccu.biz.id',
'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
'Access-Control-Allow-Headers': 'Content-Type, x-admin-password'
};
function truncate(s, m) { return s ? String(s).slice(0, m) : ''; }
function validTime(s) { return s && /^([01]\d|2[0-3]):[0-5]\d$/.test(s); }
function validDT(s) { return !s || /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}/.test(s); }
export async function onRequest(context) {
const { request, env } = context;
const url = new URL(request.url);
const p = url.pathname;
const m = request.method;
if (m === 'OPTIONS') return new Response(null, { headers: corsHeaders });
const json = (d, s = 200) => new Response(JSON.stringify(d), { headers: { ...corsHeaders, 'Content-Type': 'application/json', 'Cache-Control': 'no-store' }, status: s });
const err = (msg, s = 500) => json({ error: msg }, s);
if (request.headers.get('x-admin-password') !== env.ADMIN_PASSWORD) return err('Password salah atau sesi tidak valid', 403);
try {
const b = m !== 'GET' ? await request.json().catch(() => ({})) : null;
if (p === '/api/admin/settings' && m === 'PUT') {
const cm = truncate(b.close_message || '', 500), fn = truncate(b.flash_sale_name || 'Flash Sale', 100), fd = truncate(b.flash_sale_description || '', 200);
const fs = b.flash_sale_start || '', fe = b.flash_sale_end || '', ot = b.open_time || '05:00', ct = b.close_time || '23:00';
if (!validTime(ot)) return err('Format jam buka tidak valid', 400);
if (!validTime(ct)) return err('Format jam tutup tidak valid', 400);
if (!validDT(fs)) return err('Format waktu mulai flash sale tidak valid', 400);
if (!validDT(fe)) return err('Format waktu selesai flash sale tidak valid', 400);
await env.DB.prepare('UPDATE store_settings SET is_closed=?,auto_schedule=?,open_time=?,close_time=?,close_message=?,flash_sale_start=?,flash_sale_end=?,flash_sale_name=?,flash_sale_description=? WHERE id=1').bind(b.is_closed?1:0, b.auto_schedule?1:0, ot, ct, cm, fs, fe, fn, fd).run();
return json({ success: true });
}
if (p === '/api/admin/settings' && m === 'GET') {
const { results } = await env.DB.prepare('SELECT * FROM store_settings WHERE id=1').all();
if (!results || !results.length) return json({});
const s = results[0];
return json({ is_manual_closed: s.is_closed === 1, auto_schedule: s.auto_schedule === 1, open_time: s.open_time, close_time: s.close_time, message: s.close_message || '', flash_sale_start: s.flash_sale_start || '', flash_sale_end: s.flash_sale_end || '', flash_sale_name: s.flash_sale_name || 'Flash Sale', flash_sale_description: s.flash_sale_description || '' });
}
if (p === '/api/admin/pricelist' && m === 'POST') {
const an = truncate(b.app_name, 100), cat = truncate(b.category, 100), dur = truncate(b.duration, 100), pr = truncate(b.price, 50), nt = truncate(b.notes || '', 500), fp = truncate(b.flash_price || '', 50);
if (!an || !cat || !dur || !pr) return err('Data tidak lengkap', 400);
await env.DB.prepare('INSERT INTO pricelist (app_name,category,duration,price,status,notes,flash_price) VALUES (?,?,?,?,?,?,?)').bind(an, cat, dur, pr, b.status || 'Ready', nt, fp).run();
return json({ success: true }, 201);
}
if (p === '/api/admin/pricelist/reorder' && m === 'PUT') {
if (!b.order || !Array.isArray(b.order) || b.order.length > 200) return err('Data tidak valid', 400);
const stmts = b.order.map(i => { const id = parseInt(i.id, 10), so = parseInt(i.sort_order, 10); return (isNaN(id) || isNaN(so)) ? null : env.DB.prepare('UPDATE pricelist SET sort_order=? WHERE id=?').bind(so, id); }).filter(Boolean);
if (!stmts.length) return err('Data tidak valid', 400);
await env.DB.batch(stmts);
return json({ success: true });
}
if (p === '/api/admin/flashsale/reorder' && m === 'PUT') {
if (!b.order || !Array.isArray(b.order) || b.order.length > 100) return err('Data tidak valid', 400);
const stmts = b.order.map(i => { const id = parseInt(i.id, 10), fso = parseInt(i.flash_sort_order, 10); return (isNaN(id) || isNaN(fso)) ? null : env.DB.prepare('UPDATE pricelist SET flash_sort_order=? WHERE id=?').bind(fso, id); }).filter(Boolean);
if (!stmts.length) return err('Data tidak valid', 400);
await env.DB.batch(stmts);
return json({ success: true });
}
if (p === '/api/admin/reorder-apps' && m === 'PUT') {
if (!b.order || !Array.isArray(b.order) || b.order.length > 100) return err('Data tidak valid', 400);
const stmts = b.order.map(i => { const aso = parseInt(i.app_sort_order, 10); return (isNaN(aso) || !i.app_name) ? null : env.DB.prepare('UPDATE pricelist SET app_sort_order=? WHERE app_name=?').bind(aso, truncate(i.app_name, 100)); }).filter(Boolean);
if (!stmts.length) return err('Data tidak valid', 400);
await env.DB.batch(stmts);
return json({ success: true });
}
if (p === '/api/admin/delete/bulk' && m === 'DELETE') {
if (!b.ids || !Array.isArray(b.ids) || !b.ids.length || b.ids.length > 100) return err('Data tidak valid', 400);
const ids = b.ids.map(i => parseInt(i, 10)).filter(i => !isNaN(i));
if (!ids.length) return err('ID tidak valid', 400);
await env.DB.prepare(`DELETE FROM pricelist WHERE id IN (${ids.map(() => '?').join(',')})`).bind(...ids).run();
return json({ success: true });
}
if (p === '/api/admin/status/bulk' && m === 'PUT') {
if (!b.ids || !Array.isArray(b.ids) || !b.ids.length || b.ids.length > 100) return err('Data tidak valid', 400);
const ids = b.ids.map(i => parseInt(i, 10)).filter(i => !isNaN(i));
if (!ids.length) return err('ID tidak valid', 400);
await env.DB.prepare(`UPDATE pricelist SET status=? WHERE id IN (${ids.map(() => '?').join(',')})`).bind(b.status, ...ids).run();
return json({ success: true });
}
if (p.startsWith('/api/admin/pricelist/') && m === 'PUT') {
const id = parseInt(p.split('/').pop(), 10);
if (isNaN(id)) return err('ID tidak valid', 400);
const an = truncate(b.app_name, 100), cat = truncate(b.category, 100), dur = truncate(b.duration, 100), pr = truncate(b.price, 50), nt = truncate(b.notes || '', 500), fp = truncate(b.flash_price || '', 50);
await env.DB.prepare('UPDATE pricelist SET app_name=?,category=?,duration=?,price=?,status=?,notes=?,flash_price=? WHERE id=?').bind(an, cat, dur, pr, b.status, nt, fp, id).run();
return json({ success: true });
}
if (p.startsWith('/api/admin/pricelist/') && m === 'DELETE') {
const id = parseInt(p.split('/').pop(), 10);
if (isNaN(id)) return err('ID tidak valid', 400);
await env.DB.prepare('DELETE FROM pricelist WHERE id=?').bind(id).run();
return json({ success: true });
}
if (p.startsWith('/api/admin/status/') && m === 'PUT') {
const id = parseInt(p.split('/').pop(), 10);
if (isNaN(id)) return err('ID tidak valid', 400);
await env.DB.prepare('UPDATE pricelist SET status=? WHERE id=?').bind(b.status, id).run();
return json({ success: true });
}
if (p === '/api/admin/forms' && m === 'POST') {
const an = truncate(b.app_name, 100), ff = truncate(b.form_fields, 2000);
if (!an) return err('Nama aplikasi tidak boleh kosong', 400);
await env.DB.prepare('INSERT INTO app_forms (app_name,form_fields) VALUES (?,?) ON CONFLICT(app_name) DO UPDATE SET form_fields=excluded.form_fields').bind(an, ff).run();
return json({ success: true });
}
if (p.startsWith('/api/admin/forms/') && m === 'DELETE') {
const an = decodeURIComponent(p.split('/').pop());
await env.DB.prepare('DELETE FROM app_forms WHERE app_name=?').bind(an).run();
return json({ success: true });
}
if (p.startsWith('/api/admin/testimoni/') && m === 'PUT') {
const id = parseInt(p.split('/').pop(), 10);
if (isNaN(id)) return err('ID tidak valid', 400);
await env.DB.prepare('UPDATE testimonials SET balasan_admin=? WHERE id=?').bind(truncate(b.balasan_admin || '', 500), id).run();
return json({ success: true });
}
if (p.startsWith('/api/admin/testimoni/') && m === 'DELETE') {
const id = parseInt(p.split('/').pop(), 10);
if (isNaN(id)) return err('ID tidak valid', 400);
await env.DB.prepare('DELETE FROM testimonials WHERE id=?').bind(id).run();
return json({ success: true });
}
return err('Endpoint tidak ditemukan', 404);
} catch (e) {
console.error('Admin API error:', e);
return err('Terjadi kesalahan di server.', 500);
}
}
