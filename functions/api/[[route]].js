const corsHeaders = {
  'Access-Control-Allow-Origin': 'https://ciccu.biz.id', 
  'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, x-admin-password',
};

function escapeHTML(str) {
  if (!str) return '';
  return String(str).replace(/[&<>'"]/g, match => ({
    '&': '&amp;', '<': '&lt;', '>': '&gt;', "'": '&#39;', '"': '&quot;'
  })[match]);
}

async function verifyTurnstile(token, secret) {
  if (!token) return false;
  const formData = new FormData();
  formData.append('secret', secret);
  formData.append('response', token);
  
  const res = await fetch('https://challenges.cloudflare.com/turnstile/v0/siteverify', {
    method: 'POST',
    body: formData
  });
  const outcome = await res.json();
  return outcome.success;
}

export async function onRequest(context) {
  const { request, env } = context;
  const url = new URL(request.url);
  const path = url.pathname;
  const method = request.method;

  if (method === 'OPTIONS') return new Response(null, { headers: corsHeaders });

  const jsonResp = (data, status = 200) => new Response(JSON.stringify(data), { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status });
  const errorResp = (msg, status = 500) => jsonResp({ error: msg }, status);

  const checkAuth = () => {
    const pass = request.headers.get('x-admin-password');
    if (pass !== env.ADMIN_PASSWORD) throw new Error("Unauthorized");
  };

  try {
    const body = method !== 'GET' ? await request.json().catch(() => ({})) : null;

    if (path === '/api/login' && method === 'POST') {
      const isValid = await verifyTurnstile(body.turnstileResponse, env.TURNSTILE_SECRET);
      if (!isValid) return errorResp("Captcha tidak valid", 400);
      if (body.password !== env.ADMIN_PASSWORD) return errorResp("Password salah", 403);
      return jsonResp({ success: true });
    }

    if (path === '/api/pricelist' && method === 'GET') {
      const { results } = await env.DB.prepare("SELECT * FROM pricelist").all();
      return jsonResp(results);
    }
    if (path === '/api/forms' && method === 'GET') {
      const { results } = await env.DB.prepare("SELECT * FROM app_forms").all();
      return jsonResp(results);
    }
    if (path === '/api/testimoni' && method === 'GET') {
      const { results } = await env.DB.prepare("SELECT * FROM testimonials ORDER BY created_at DESC").all();
      return jsonResp(results);
    }

    if (path === '/api/testimoni' && method === 'POST') {
      const isValid = await verifyTurnstile(body.turnstileResponse, env.TURNSTILE_SECRET);
      if (!isValid) return errorResp("Mohon selesaikan verifikasi keamanan", 400);

      const nama = escapeHTML(body.nama || 'Anonim');
      const komentar = escapeHTML(body.komentar || '');
      
      if (!komentar) return errorResp("Komentar tidak boleh kosong", 400);
      if (nama.length > 50) return errorResp("Nama terlalu panjang", 400);
      if (komentar.length > 500) return errorResp("Komentar terlalu panjang", 400);

      await env.DB.prepare("INSERT INTO testimonials (nama, komentar) VALUES (?, ?)").bind(nama, komentar).run();
      return jsonResp({ success: true }, 201);
    }

    try {
      if (method !== 'GET' && path !== '/api/testimoni' && path !== '/api/login' || (path === '/api/testimoni' && method !== 'POST' && method !== 'GET')) {
          checkAuth();
      }
      
      if (path === '/api/pricelist' && method === 'POST') {
        await env.DB.prepare("INSERT INTO pricelist (app_name, category, duration, price, status, notes) VALUES (?, ?, ?, ?, ?, ?)")
          .bind(body.app_name, body.category, body.duration, body.price, body.status || 'Ready', body.notes || '').run();
        return jsonResp({ success: true }, 201);
      }
      if (path.startsWith('/api/pricelist/') && method === 'PUT' && path !== '/api/pricelist/reorder') {
        const id = path.split('/').pop();
        await env.DB.prepare("UPDATE pricelist SET app_name=?, category=?, duration=?, price=?, status=?, notes=? WHERE id=?")
          .bind(body.app_name, body.category, body.duration, body.price, body.status, body.notes || '', id).run();
        return jsonResp({ success: true });
      }
      
      // KEAMANAN BARU: Validasi format Array untuk Bulk Actions
      if (path.startsWith('/api/delete/bulk') && method === 'DELETE') {
        const ids = body.ids; 
        if (!ids || !Array.isArray(ids) || ids.length === 0) return errorResp("Data tidak valid", 400);
        const placeholders = ids.map(() => '?').join(',');
        await env.DB.prepare(`DELETE FROM pricelist WHERE id IN (${placeholders})`).bind(...ids).run();
        return jsonResp({ success: true });
      }
      
      if (path.startsWith('/api/delete/') && method === 'DELETE') {
        const id = path.split('/').pop();
        await env.DB.prepare("DELETE FROM pricelist WHERE id=?").bind(id).run();
        return jsonResp({ success: true });
      }
      
      if (path.startsWith('/api/status/bulk') && method === 'PUT') {
        const ids = body.ids;
        if (!ids || !Array.isArray(ids) || ids.length === 0) return errorResp("Data tidak valid", 400);
        const placeholders = ids.map(() => '?').join(',');
        await env.DB.prepare(`UPDATE pricelist SET status=? WHERE id IN (${placeholders})`).bind(body.status, ...ids).run();
        return jsonResp({ success: true });
      }
      
      if (path.startsWith('/api/status/') && method === 'PUT') {
        const id = path.split('/').pop();
        await env.DB.prepare("UPDATE pricelist SET status=? WHERE id=?").bind(body.status, id).run();
        return jsonResp({ success: true });
      }
      
      if (path === '/api/pricelist/reorder' && method === 'PUT') {
        if (!body.order || !Array.isArray(body.order)) return errorResp("Data tidak valid", 400);
        const statements = body.order.map(item => env.DB.prepare("UPDATE pricelist SET sort_order=? WHERE id=?").bind(item.sort_order, item.id));
        await env.DB.batch(statements);
        return jsonResp({ success: true });
      }
      
      if (path === '/api/reorder-apps' && method === 'PUT') {
        if (!body.order || !Array.isArray(body.order)) return errorResp("Data tidak valid", 400);
        const statements = body.order.map(item => env.DB.prepare("UPDATE pricelist SET app_sort_order=? WHERE app_name=?").bind(item.app_sort_order, item.app_name));
        await env.DB.batch(statements);
        return jsonResp({ success: true });
      }
      
      if (path === '/api/forms' && method === 'POST') {
        await env.DB.prepare("INSERT INTO app_forms (app_name, form_fields) VALUES (?, ?) ON CONFLICT(app_name) DO UPDATE SET form_fields=excluded.form_fields")
          .bind(body.app_name, body.form_fields).run();
        return jsonResp({ success: true });
      }
      if (path.startsWith('/api/forms/') && method === 'DELETE') {
        const appName = decodeURIComponent(path.split('/').pop());
        await env.DB.prepare("DELETE FROM app_forms WHERE app_name=?").bind(appName).run();
        return jsonResp({ success: true });
      }
      if (path.startsWith('/api/testimoni/') && method === 'PUT') {
        const id = path.split('/').pop();
        const balasan = escapeHTML(body.balasan_admin || '');
        await env.DB.prepare("UPDATE testimonials SET balasan_admin=? WHERE id=?").bind(balasan, id).run();
        return jsonResp({ success: true });
      }
      if (path.startsWith('/api/testimoni/') && method === 'DELETE') {
        const id = path.split('/').pop();
        await env.DB.prepare("DELETE FROM testimonials WHERE id=?").bind(id).run();
        return jsonResp({ success: true });
      }

    } catch (authError) {
      if (authError.message === "Unauthorized") return errorResp("Password salah atau sesi tidak valid", 403);
      throw authError;
    }

    return errorResp("Endpoint tidak ditemukan", 404);

  } catch (err) {
    return errorResp("Terjadi kesalahan di server: " + err.message, 500);
  }
}
