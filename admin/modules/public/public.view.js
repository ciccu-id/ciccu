(function(M){
M.view=function(){return frag(`
<div class="public-head">
<button id="btnExpandAll" type="button" class="public-icon" title="Buka Semua" aria-label="Buka Semua"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M6 5l6 6 6-6M6 13l6 6 6-6"/></svg></button>
<button id="btnCollapseAll" type="button" class="public-icon" title="Tutup Semua" aria-label="Tutup Semua"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M6 19l6-6 6 6M6 11l6-6 6 6"/></svg></button>
<button id="btnReorderTop" type="button" class="public-icon" title="Urutan Aplikasi" aria-label="Urutan Aplikasi"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M4 6h16M4 12h10M4 18h6"/></svg></button>
<button id="btnImport" type="button" class="public-icon" title="Import CSV" aria-label="Import CSV"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M4 16v2a2 2 0 002 2h12a2 2 0 002-2v-2M12 4v12M8 12l4 4 4-4"/></svg></button>
<button id="btnExport" type="button" class="public-icon" title="Export CSV" aria-label="Export CSV"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M4 16v2a2 2 0 002 2h12a2 2 0 002-2v-2M12 16V4M8 8l4-4 4 4"/></svg></button>
<button id="btnAddApp" type="button" class="public-icon" title="Tambah Aplikasi" aria-label="Tambah Aplikasi"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 5v14M5 12h14"/></svg></button>
<input id="publicSearch" class="public-search" type="text" placeholder="Cari aplikasi / kategori / status..." autocomplete="off">
</div>
<div id="publicAccordion" class="public-list"></div>
`)};
})(AdminModules.public=AdminModules.public||{});
