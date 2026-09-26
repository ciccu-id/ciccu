(function(M){
M.view=function(){return frag(`
<div class="public-head">
<button id="btnReorderTop" type="button" class="public-icon" title="Urutan Aplikasi" aria-label="Urutan Aplikasi"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M4 6h16M4 12h10M4 18h6"/></svg></button>
<button id="btnAddApp" type="button" class="public-icon" title="Tambah Aplikasi" aria-label="Tambah Aplikasi"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 5v14M5 12h14"/></svg></button>
<input id="publicSearch" class="public-search" type="text" placeholder="Cari aplikasi / kategori / status..." autocomplete="off">
</div>
<div id="publicAccordion" class="public-list"></div>
`)};
})(AdminModules.public=AdminModules.public||{});
