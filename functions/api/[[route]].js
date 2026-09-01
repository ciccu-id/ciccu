const corsHeaders = {
  'Access-Control-Allow-Origin': 'https://ciccu.biz.id', 
  'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, x-admin-password',
};

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

    if (path === '/api/settings' && method === 'GET') {
      const { results } = await env.DB.prepare("SELECT * FROM store_settings WHERE id = 1").all();
      
      if (!results || results.length === 0) {
         return jsonResp({ is_closed: false });
      }
      
      const settings = results[0];
      let isClosed = settings.is_closed === 1;

      if (settings.auto_schedule === 1) {
          const nowStr = new Intl.DateTimeFormat('en-GB', {
              timeZone: 'Asia/Jakarta',
              hour: '2-digit',
              minute: '2-digit',
              hour12: false
          }).format(new Date()); 
          
          const [currentH, currentM] = nowStr.split(':').map(Number);
          const [openH, openM] = settings.open_time.split(':').map(Number);
          const [closeH, closeM] = settings.close_time.split(':').map(Number);
          
          const currentTotalMins = currentH * 60 + currentM;
          const openTotalMins = openH * 60 + openM;
          const closeTotalMins = closeH * 60 + closeM;
          
          if (openTotalMins < closeTotalMins) {
              if (currentTotalMins < openTotalMins || currentTotalMins >= closeTotalMins) {
                  isClosed = true;
              } else {
                  isClosed = false; 
              }
          } else {
              if (currentTotalMins >= closeTotalMins && currentTotalMins < openTotalMins) {
                  isClosed = true; 
              } else {
                  isClosed = false; 
              }
          }
      }

      return jsonResp({
          is_closed: isClosed,
          is_manual_closed: settings.is_closed === 1,
          auto_schedule: settings.auto_schedule === 1,
          open_time: settings.open_time,
          close_time: settings.close_time,
          message: settings.close_message
      });
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

      const nama = body.nama || 'Anonim';
      const komentar = body.komentar || '';
      
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
      
      if (path === '/api/settings' && method === 'PUT') {
        await env.DB.prepare(
          "UPDATE store_settings SET is_closed=?, auto_schedule=?, open_time=?, close_time=?, close_message=? WHERE id=1"
        ).bind(
          body.is_closed ? 1 : 0, 
          body.auto_schedule ? 1 : 0, 
          body.open_time, 
          body.close_time, 
          body.close_message || ''
        ).run();
        return jsonResp({ success: true });
      }

      if (path === '/api/pricelist' && method === 'POST') {
        await env.DB.prepare("INSERT INTO pricelist (app_name, category, duration, price, status, notes) VALUES (?, ?, ?, ?, ?, ?)")
          .bind(body.app_name, body.category, body.duration, body.price, body.status || 'Ready', body.notes || '').run();
        return jsonResp({ success: true }, 201);
      }
      
      if (path.startsWith('/api/pricelist/') && method === 'PUT' && path !== '/api/pricelist/reorder') {
        const id = parseInt(path.split('/').pop(), 10);
        if (isNaN(id)) return errorResp("ID tidak valid", 400);
        await env.DB.prepare("UPDATE pricelist SET app_name=?, category=?, duration=?, price=?, status=?, notes=? WHERE id=?")
          .bind(body.app_name, body.category, body.duration, body.price, body.status, body.notes || '', id).run();
        return jsonResp({ success: true });
      }
      
      if (path.startsWith('/api/delete/bulk') && method === 'DELETE') {
        const ids = body.ids; 
        if (!ids || !Array.isArray(ids) || ids.length === 0) return errorResp("Data tidak valid", 400);
        const validIds = ids.map(id => parseInt(id, 10)).filter(id => !isNaN(id));
        if (validIds.length === 0) return errorResp("ID tidak valid", 400);
        const placeholders = validIds.map(() => '?').join(',');
        await env.DB.prepare(`DELETE FROM pricelist WHERE id IN (${placeholders})`).bind(...validIds).run();
        return jsonResp({ success: true });
      }
      
      if (path.startsWith('/api/delete/') && method === 'DELETE') {
        const id = parseInt(path.split('/').pop(), 10);
        if (isNaN(id)) return errorResp("ID tidak valid", 400);
        await env.DB.prepare("DELETE FROM pricelist WHERE id=?").bind(id).run();
        return jsonResp({ success: true });
      }
      
      if (path.startsWith('/api/status/bulk') && method === 'PUT') {
        const ids = body.ids;
        if (!ids || !Array.isArray(ids) || ids.length === 0) return errorResp("Data tidak valid", 400);
        const validIds = ids.map(id => parseInt(id, 10)).filter(id => !isNaN(id));
        if (validIds.length === 0) return errorResp("ID tidak valid", 400);
        const placeholders = validIds.map(() => '?').join(',');
        await env.DB.prepare(`UPDATE pricelist SET status=? WHERE id IN (${placeholders})`).bind(body.status, ...validIds).run();
        return jsonResp({ success: true });
      }
      
      if (path.startsWith('/api/status/') && method === 'PUT') {
        const id = parseInt(path.split('/').pop(), 10);
        if (isNaN(id)) return errorResp("ID tidak valid", 400);
        await env.DB.prepare("UPDATE pricelist SET status=? WHERE id=?").bind(body.status, id).run();
        return jsonResp({ success: true });
      }
      
      if (path === '/api/pricelist/reorder' && method === 'PUT') {
        if (!body.order || !Array.isArray(body.order)) return errorResp("Data tidak valid", 400);
        const statements = body.order.map(item => {
          const id = parseInt(item.id, 10);
          const sortOrder = parseInt(item.sort_order, 10);
          if (isNaN(id) || isNaN(sortOrder)) return null;
          return env.DB.prepare("UPDATE pricelist SET sort_order=? WHERE id=?").bind(sortOrder, id);
        }).filter(s => s !== null);
        if (statements.length === 0) return errorResp("Data tidak valid", 400);
        await env.DB.batch(statements);
        return jsonResp({ success: true });
      }
      
      if (path === '/api/reorder-apps' && method === 'PUT') {
        if (!body.order || !Array.isArray(body.order)) return errorResp("Data tidak valid", 400);
        const statements = body.order.map(item => {
          const appSortOrder = parseInt(item.app_sort_order, 10);
          if (isNaN(appSortOrder) || !item.app_name) return null;
          return env.DB.prepare("UPDATE pricelist SET app_sort_order=? WHERE app_name=?").bind(appSortOrder, item.app_name);
        }).filter(s => s !== null);
        if (statements.length === 0) return errorResp("Data tidak valid", 400);
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
        const id = parseInt(path.split('/').pop(), 10);
        if (isNaN(id)) return errorResp("ID tidak valid", 400);
        const balasan = body.balasan_admin || '';
        await env.DB.prepare("UPDATE testimonials SET balasan_admin=? WHERE id=?").bind(balasan, id).run();
        return jsonResp({ success: true });
      }
      if (path.startsWith('/api/testimoni/') && method === 'DELETE') {
        const id = parseInt(path.split('/').pop(), 10);
        if (isNaN(id)) return errorResp("ID tidak valid", 400);
        await env.DB.prepare("DELETE FROM testimonials WHERE id=?").bind(id).run();
        return jsonResp({ success: true });
      }

    } catch (authError) {
      if (authError.message === "Unauthorized") return errorResp("Password salah atau sesi tidak valid", 403);
      throw authError;
    }

    return errorResp("Endpoint tidak ditemukan", 404);

  } catch (err) {
    console.error("Server error:", err);
    return errorResp("Terjadi kesalahan di server.", 500);
  }
}
