(function(M){
M.view=function(){return frag(`
<div class="rekap-head">
<button id="rekapRefresh" type="button" class="rekap-icon" title="Muat ulang" aria-label="Muat ulang"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M23 4v6h-6M1 20v-6h6"/><path d="M3.51 9a9 9 0 0114.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0020.49 15"/></svg></button>
<div class="rekap-head-text">
<h1>Rekapan</h1>
<p id="rekapUpdated">Memuat data...</p>
</div>
</div>
<section class="rekap-panel">
<div class="rekap-panel-head">
<div><h2>Pintasan Stok</h2><p>Total stok per aplikasi, tanpa perlu membuka pop up satu-satu</p></div>
<button id="rekapStockReload" type="button" class="rekap-link">Muat ulang</button>
</div>
<div id="rekapStockSummary" class="rekap-stock-grid"></div>
</section>
<section class="rekap-panel">
<div class="rekap-panel-head">
<div><h2>Gudang Terjual</h2><p>Stok berstatus sold beserta order dan reseller, tanpa kredensial tampil di daftar</p></div>
</div>
<div class="rekap-filter-row">
<input id="rekapSoldSearch" class="rekap-search" type="text" placeholder="Cari order, reseller, aplikasi..." autocomplete="off">
<div id="rekapSoldRangeSlot" class="rekap-dd-slot"></div>
</div>
<div id="rekapSoldList" class="rekap-list"></div>
<button id="rekapSoldMore" type="button" class="rekap-more hidden">Muat Lebih Banyak</button>
</section>
<section class="rekap-panel">
<div class="rekap-panel-head">
<div><h2>Buku Kas</h2><p>Ringkasan settle, refund, pending, dan ledger pembayaran</p></div>
<button id="rekapFinanceReload" type="button" class="rekap-link">Muat ulang</button>
</div>
<div id="rekapFinanceSummary" class="rekap-kpi-grid"></div>
<div class="rekap-filter-row">
<input id="rekapPaySearch" class="rekap-search" type="text" placeholder="Cari order, reseller, tx id..." autocomplete="off">
<div id="rekapPayStatusSlot" class="rekap-dd-slot"></div>
<div id="rekapPayRangeSlot" class="rekap-dd-slot"></div>
</div>
<div id="rekapPaymentsList" class="rekap-list"></div>
<button id="rekapPaymentsMore" type="button" class="rekap-more hidden">Muat Lebih Banyak</button>
</section>
<section class="rekap-panel">
<div class="rekap-panel-head">
<div><h2>Ledger Pesanan</h2><p>Semua order dengan filter status, rentang waktu, dan pencarian</p></div>
</div>
<div class="rekap-filter-row">
<input id="rekapOrderSearch" class="rekap-search" type="text" placeholder="Cari kode, reseller, aplikasi..." autocomplete="off">
<div id="rekapOrderStatusSlot" class="rekap-dd-slot"></div>
<div id="rekapOrderRangeSlot" class="rekap-dd-slot"></div>
</div>
<div id="rekapOrdersList" class="rekap-list"></div>
<button id="rekapOrdersMore" type="button" class="rekap-more hidden">Muat Lebih Banyak</button>
</section>
<section class="rekap-panel">
<div class="rekap-panel-head">
<div><h2>Jejak Audit</h2><p>Siapa melakukan apa, kapan, entitas apa, dan dari IP mana</p></div>
</div>
<div class="rekap-filter-row">
<input id="rekapAuditSearch" class="rekap-search" type="text" placeholder="Cari aksi, entity, IP..." autocomplete="off">
<div id="rekapAuditActorSlot" class="rekap-dd-slot"></div>
<div id="rekapAuditRangeSlot" class="rekap-dd-slot"></div>
</div>
<div id="rekapAuditList" class="rekap-list"></div>
<button id="rekapAuditMore" type="button" class="rekap-more hidden">Muat Lebih Banyak</button>
</section>
<section class="rekap-panel">
<div class="rekap-panel-head">
<div><h2>Riwayat Revisi Kredensial</h2><p>Daftar revisi untuk audit sengketa; nilai kredensial tidak ditampilkan di sini</p></div>
</div>
<div class="rekap-filter-row">
<input id="rekapRevSearch" class="rekap-search" type="text" placeholder="Cari order, reseller, catatan..." autocomplete="off">
<div id="rekapRevRangeSlot" class="rekap-dd-slot"></div>
</div>
<div id="rekapRevisionsList" class="rekap-list"></div>
<button id="rekapRevisionsMore" type="button" class="rekap-more hidden">Muat Lebih Banyak</button>
</section>
`)};
})(AdminModules.rekapan=AdminModules.rekapan||{});
