export async function onRequest(context) {
  const request = context.request;
  const url = new URL(request.url);

  // Jika pengunjung datang menggunakan link pages.dev
  if (url.hostname.includes('.pages.dev')) {
    // Alihkan langsung secara permanen (301) ke domain utama
    return Response.redirect(`https://ciccu.biz.id${url.pathname}${url.search}`, 301);
  }

  // Jika sudah pakai ciccu.biz.id, biarkan proses berjalan normal
  return context.next();
}
