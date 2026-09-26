(function(M){
M.view=function(){return frag(`
<div class="akses-head">
<button type="button" class="akses-hbtn" data-racc-toggle="cardTokens"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M2 9a3 3 0 0 1 0 6v2a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2v-2a3 3 0 0 1 0-6V7a2 2 0 0 0-2-2H4a2 2 0 0 0-2 2z"/><path d="M13 5v2M13 11v2M13 17v2"/></svg>Token</button>
<button type="button" class="akses-hbtn" data-racc-toggle="cardAddReseller"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 5v14M5 12h14"/></svg>Reseller</button>
<input id="resellerSearchInput" class="akses-search" type="text" placeholder="Cari reseller / username / WA..." autocomplete="off">
</div>
<section id="cardPendingResellers" class="racc-panel hidden">
<div class="racc-phead">
<span class="racc-hic warn"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><path d="M12 6v6l4 2"/></svg></span>
<span class="racc-ptitle">MENUNGGU KONFIRMASI</span>
<span id="pendingResellerCount" class="racc-chip ok">0</span>
</div>
<div id="pendingResellerList" class="racc-prof-list"></div>
</section>
<section id="cardTokens" class="racc-panel collapsed">
<div class="racc-phead">
<span class="racc-hic warn"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M2 9a3 3 0 0 1 0 6v2a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2v-2a3 3 0 0 1 0-6V7a2 2 0 0 0-2-2H4a2 2 0 0 0-2 2z"/><path d="M13 5v2M13 11v2M13 17v2"/></svg></span>
<span class="racc-ptitle">TOKEN PENDAFTARAN</span>
<span id="regTokenCount" class="racc-chip ok">0 aktif</span>
</div>
<div class="racc-tform">
<div class="racc-trow">
<div id="tokenDurationSlot" class="racc-sel"></div>
<button id="btnCreateToken" type="button" class="racc-btn-butter"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 5v14M5 12h14"/></svg>Buat Token</button>
</div>
<input id="tokenLabelInput" class="racc-inp" type="text" placeholder="Label (opsional, mis. untuk Budi)" autocomplete="off">
</div>
<p class="racc-note">Token hanya ditampilkan sekali saat dibuat. Token sekali pakai dan terhapus otomatis saat kedaluwarsa atau terpakai. Pendaftaran tetap memerlukan konfirmasi admin.</p>
<div id="regTokenList" class="racc-tlist"></div>
</section>
<section id="cardAddReseller" class="racc-panel collapsed">
<div class="racc-phead">
<span class="racc-hic choco"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 5v14M5 12h14"/></svg></span>
<span class="racc-ptitle">TAMBAH RESELLER</span>
</div>
<form id="resellerForm" class="racc-tform" novalidate>
<input id="resUsername" class="racc-inp" type="text" placeholder="username" required autocomplete="off">
<input id="resDisplayName" class="racc-inp" type="text" placeholder="nama tampilan" autocomplete="off">
<input id="resPassword" class="racc-inp" type="password" placeholder="password minimal 8 karakter" required autocomplete="new-password">
<button type="submit" class="racc-btn-primary">Buat Akun</button>
</form>
</section>
<section id="cardResellerList" class="racc-panel">
<div class="racc-phead">
<span class="racc-hic blue"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M22 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg></span>
<span class="racc-ptitle">DAFTAR RESELLER</span>
<span id="resellerCount" class="racc-chip off">0 akun</span>
</div>
<div id="resellerList" class="racc-prof-list"></div>
</section>
`)};
})(AdminModules.akses=AdminModules.akses||{});
