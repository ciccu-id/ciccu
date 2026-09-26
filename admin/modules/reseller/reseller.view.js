(function(M){
M.view=function(){return frag(`
<div class="reseller-head">
<button id="btnRslReorder" type="button" class="reseller-icon" title="Urutan aplikasi" aria-label="Urutan aplikasi"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M3 7h18M3 12h12M3 17h6"/></svg></button>
<button id="btnRslAddApp" type="button" class="reseller-icon" title="Tambah aplikasi" aria-label="Tambah aplikasi"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 5v14M5 12h14"/></svg></button>
<input id="rpriceSearch" class="reseller-search" type="text" placeholder="Cari aplikasi / kategori / durasi..." autocomplete="off">
</div>
<div id="rpriceAccordion" class="reseller-list"></div>
`)};
})(AdminModules.reseller=AdminModules.reseller||{});
