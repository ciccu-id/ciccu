(function(M){
M.view=function(){return frag(`
<div class="beranda-titlehead">
<h2>Dashboard<svg class="spark" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 3l2.1 6.9L21 12l-6.9 2.1L12 21l-2.1-6.9L3 12l6.9-2.1z"/></svg></h2>
<p class="beranda-desc">Pantau <b>pesanan</b>, <b>stok</b>, dan <b>pendapatan</b> toko dalam satu tampilan ringkas — diperbarui langsung hari ini.</p>
</div>
<section class="beranda-hero">
<div><b>Selamat datang, Admin.</b><p>Berikut ringkasan aktivitas toko Anda.</p></div>
<div class="beranda-hero-r">
<a href="../" target="_blank" rel="noopener" class="beranda-btn-toko"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="M7 17 17 7"/><path d="M9 7h8v8"/></svg>Lihat Toko</a>
<span id="berandaDate" class="beranda-hero-date"></span>
</div>
</section>
<section class="beranda-stats">
<div class="beranda-stat bs-choco">
<span class="bs-ic"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M6 6h15l-1.5 8.5H8"/><path d="M6 6 5 3H2"/><circle cx="9.5" cy="20" r="1.5"/><circle cx="18" cy="20" r="1.5"/></svg></span>
<div><span class="bs-lb">TOTAL ORDER</span><strong id="statOrders" class="bs-v">0</strong><span id="statOrdersSub" class="bs-s ok">-</span></div>
</div>
<div class="beranda-stat bs-butter">
<span class="bs-ic"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="2.5" y="6" width="19" height="12" rx="2"/><circle cx="12" cy="12" r="2.5"/><path d="M6 12h.01M18 12h.01"/></svg></span>
<div><span class="bs-lb">PENDAPATAN</span><strong id="statRevenue" class="bs-v">0</strong><span id="statRevenueSub" class="bs-s ok">-</span></div>
</div>
<div class="beranda-stat bs-blue">
<span class="bs-ic"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="4" width="18" height="5" rx="1.5"/><path d="M5 9v9a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V9"/><path d="M10 13h4"/></svg></span>
<div><span class="bs-lb">STOK TERSEDIA</span><strong id="statStock" class="bs-v">0</strong><span id="statStockSub" class="bs-s">unit siap kirim</span></div>
</div>
<div class="beranda-stat bs-warn">
<span class="bs-ic"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 3.5 2.8 19.5h18.4z"/><path d="M12 9.5v4.5"/><path d="M12 17h.01"/></svg></span>
<div><span class="bs-lb">STOK RENDAH</span><strong id="statLow" class="bs-v">0</strong><span id="statLowSub" class="bs-s">-</span></div>
</div>
</section>
<section class="beranda-panel">
<div class="bp-head">
<div><h3>Order Terbaru</h3><p>Aktivitas pesanan terbaru</p></div>
<button id="berandaOrdersAll" type="button" class="bp-link">Lihat semua →</button>
</div>
<div class="bp-tbl-zone">
<div class="bp-tbl-wrap">
<div id="berandaOrdersTable" class="bp-tbl">
<span class="bp-th">KODE</span><span class="bp-th">RESELLER</span><span class="bp-th">TOTAL</span><span class="bp-th">STATUS</span><span class="bp-th">DIBUAT</span>
</div>
</div>
<i class="bp-tbl-fade"></i>
</div>
</section>
<section class="beranda-panel">
<div class="bp-head">
<div><h3>Kondisi Stok</h3><p>Perlu perhatian</p></div>
<button id="berandaStockAll" type="button" class="bp-link">Kelola →</button>
</div>
<div id="berandaLowStockBody"></div>
</section>
<section class="beranda-panel">
<div class="bp-head">
<div><h3>Flash Sale</h3><p>Promo toko</p></div>
<button id="berandaFlashAll" type="button" class="bp-link">Kelola →</button>
</div>
<div id="berandaFlashBody"></div>
</section>
<section class="beranda-panel">
<div class="bp-head"><div><h3>Akses Cepat</h3></div></div>
<div class="bp-qa-grid">
<button id="quickAddPublic" type="button" class="bp-qa"><span class="bp-qi"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3.5" y="3.5" width="17" height="17" rx="3"/><path d="M12 8.5v7M8.5 12h7"/></svg></span><span><b>Tambah Paket Publik</b><small>Kelola katalog publik</small></span></button>
<button id="quickAddReseller" type="button" class="bp-qa"><span class="bp-qi"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="4" width="18" height="16" rx="2"/><path d="M12 4v16"/></svg></span><span><b>Tambah Paket Reseller</b><small>Kelola katalog reseller</small></span></button>
<button id="quickAddStock" type="button" class="bp-qa"><span class="bp-qi"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 5v14M5 12h14"/></svg></span><span><b>Tambah Stok</b><small>Isi data kredensial</small></span></button>
<button id="quickSettings" type="button" class="bp-qa"><span class="bp-qi"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M4 8h9M17 8h3M4 16h3M11 16h9"/><circle cx="15" cy="8" r="2"/><circle cx="9" cy="16" r="2"/></svg></span><span><b>Pengaturan</b><small>Konfigurasi toko</small></span></button>
</div>
</section>
<section class="beranda-panel">
<div class="bp-head"><div><h3>Manajemen</h3><p>Modul toko</p></div></div>
<button data-route="public" type="button" class="bp-mrow"><span class="bp-mi"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="3" width="7.5" height="7.5" rx="1.8"/><rect x="13.5" y="3" width="7.5" height="7.5" rx="1.8"/><rect x="3" y="13.5" width="7.5" height="7.5" rx="1.8"/><rect x="13.5" y="13.5" width="7.5" height="7.5" rx="1.8"/></svg></span><span class="bp-mt"><b>Katalog Publik</b><small>Atur paket yang terlihat pelanggan umum.</small></span><span class="bp-ml">Kelola →</span></button>
<button data-route="reseller" type="button" class="bp-mrow"><span class="bp-mi"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="4" width="18" height="16" rx="2"/><path d="M12 4v16"/></svg></span><span class="bp-mt"><b>Pricelist & Stok Reseller</b><small>Kelola harga dan stok khusus reseller.</small></span><span class="bp-ml">Kelola →</span></button>
<button data-route="flashsale" type="button" class="bp-mrow"><span class="bp-mi"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M13 10V3L4 14h7v7l9-11h-7z"/></svg></span><span class="bp-mt"><b>Flash Sale</b><small>Buat dan atur promo waktu terbatas.</small></span><span class="bp-ml">Kelola →</span></button>
<button data-route="pesanan" type="button" class="bp-mrow"><span class="bp-mi"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"/></svg></span><span class="bp-mt"><b>Order Reseller</b><small>Pantau dan proses pesanan reseller.</small></span><span class="bp-ml">Kelola →</span></button>
<button data-route="pengaturan" type="button" class="bp-mrow"><span class="bp-mi"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M4 8h9M17 8h3M4 16h3M11 16h9"/><circle cx="15" cy="8" r="2"/><circle cx="9" cy="16" r="2"/></svg></span><span class="bp-mt"><b>Pengaturan Toko</b><small>Atur informasi dan konfigurasi toko.</small></span><span class="bp-ml">Kelola →</span></button>
<button data-route="aktivitas" type="button" class="bp-mrow"><span class="bp-mi"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="8.5"/><path d="M12 7.5V12l3 1.8"/></svg></span><span class="bp-mt"><b>Aktivitas Admin</b><small>Lihat riwayat aktivitas administrator.</small></span><span class="bp-ml">Lihat →</span></button>
</section>
`)};
})(AdminModules.beranda=AdminModules.beranda||{});
