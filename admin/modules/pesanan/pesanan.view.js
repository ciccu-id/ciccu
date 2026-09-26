(function(M){
M.view=function(){return frag(`
<div class="pesanan-head">
<div id="orderStatusSlot"></div>
<div id="orderRangeSlot"></div>
<button id="btnRefreshOrders" type="button" class="ord-refresh" title="Muat ulang" aria-label="Muat ulang"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="M23 4v6h-6M1 20v-6h6"/><path d="M3.51 9a9 9 0 0114.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0020.49 15"/></svg></button>
<input id="orderSearchInput" class="ord-search" type="text" placeholder="Kode / reseller / aplikasi / WA..." autocomplete="off">
</div>
<div id="orderList" class="ord-list"></div>
<button id="btnOrdersMore" type="button" class="ord-more hidden">Muat Lebih Banyak</button>
`)};
})(AdminModules.pesanan=AdminModules.pesanan||{});
