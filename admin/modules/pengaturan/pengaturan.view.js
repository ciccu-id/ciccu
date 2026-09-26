(function(M){
M.view=function(){return frag(`
<section class="set-card">
<h2 class="set-title">🏪 Pengaturan Toko</h2>
<form class="set-form">
<div class="set-toggle">
<div class="set-toggle-txt"><p class="set-toggle-label">Tutup Toko Manual</p><p class="set-toggle-hint">Blokir semua pesanan publik saat aktif</p></div>
<label class="toggle-wrap"><input id="setToggleManual" type="checkbox" class="toggle-cb"><span class="toggle-track"></span><span class="toggle-circle"></span></label>
</div>
<div class="set-toggle butter">
<div class="set-toggle-txt"><p class="set-toggle-label">Jadwal Otomatis</p><p class="set-toggle-hint">Buka/tutup sesuai jam berikut</p></div>
<label class="toggle-wrap"><input id="setToggleAuto" type="checkbox" class="toggle-cb"><span class="toggle-track"></span><span class="toggle-circle"></span></label>
</div>
<div class="set-row">
<div class="adm-field"><label for="setOpenTime">JAM BUKA</label><div class="adm-input"><input id="setOpenTime" type="time" value="05:00"></div></div>
<div class="adm-field"><label for="setCloseTime">JAM TUTUP</label><div class="adm-input"><input id="setCloseTime" type="time" value="23:00"></div></div>
</div>
<div class="adm-field"><label for="setCloseMsg">PESAN TUTUP</label><div class="adm-input"><textarea id="setCloseMsg" rows="3" placeholder="Toko sedang tutup. Kami buka kembali sesuai jam operasional."></textarea></div></div>
<button id="btnSaveSettings" type="submit" class="set-save">Simpan Pengaturan</button>
</form>
</section>
`)};
})(AdminModules.pengaturan=AdminModules.pengaturan||{});
