const API_URL = ""; 
const BASE_URL = API_URL.endsWith('/') ? API_URL.slice(0, -1) : API_URL;

function escapeHTML(str) {
    if (!str) return '';
    return String(str).replace(/[&<>'"]/g, match => ({
        '&': '&amp;', '<': '&lt;', '>': '&gt;', "'": '&#39;', '"': '&quot;'
    })[match]);
}

let globalAdminData = [];
let globalFormsData = {};
let sessionPass = "";

let selectedItems = new Set();
let expandedApps = {}; 
let currentEditId = null;
let currentReplyId = null;

let builderCurrentApp = '';
let builderFields = [];
let sortableReorder = null;

let testimoniDataCache = {};

function switchTab(tabName) {
    const sectionProduk = document.getElementById('section-produk');
    const sectionTestimoni = document.getElementById('section-testimoni');
    const sectionPengaturan = document.getElementById('section-pengaturan');
    
    const tabProduk = document.getElementById('tab-produk');
    const tabTestimoni = document.getElementById('tab-testimoni');
    const tabPengaturan = document.getElementById('tab-pengaturan');
    
    const activeClass = "pb-2 px-1 text-xs md:text-sm font-bold border-b-2 border-pink-400 text-pink-500 outline-none transition-all whitespace-nowrap";
    const inactiveClass = "pb-2 px-1 text-xs md:text-sm font-bold border-b-2 border-transparent text-gray-400 hover:text-pink-400 outline-none transition-all whitespace-nowrap";

    if (tabName === 'produk') {
        sectionProduk.classList.remove('hidden');
        sectionTestimoni.classList.add('hidden');
        if (sectionPengaturan) sectionPengaturan.classList.add('hidden');
        
        tabProduk.className = activeClass;
        tabTestimoni.className = inactiveClass;
        if (tabPengaturan) tabPengaturan.className = inactiveClass;
        
        updateBulkUI();
    } else if (tabName === 'testimoni') {
        sectionProduk.classList.add('hidden');
        sectionTestimoni.classList.remove('hidden');
        if (sectionPengaturan) sectionPengaturan.classList.add('hidden');
        
        tabProduk.className = inactiveClass;
        tabTestimoni.className = activeClass;
        if (tabPengaturan) tabPengaturan.className = inactiveClass;
        
        document.getElementById('bulkActionBar').classList.add('translate-y-full');
        loadAdminTestimoni();
    } else if (tabName === 'pengaturan') {
        sectionProduk.classList.add('hidden');
        sectionTestimoni.classList.add('hidden');
        if (sectionPengaturan) sectionPengaturan.classList.remove('hidden');
        
        tabProduk.className = inactiveClass;
        tabTestimoni.className = inactiveClass;
        if (tabPengaturan) tabPengaturan.className = activeClass;
        
        document.getElementById('bulkActionBar').classList.add('translate-y-full');
        loadStoreSettings();
    }
}

async function loadStoreSettings() {
    if(!sessionPass) return;
    try {
        const res = await fetch(`${BASE_URL}/api/settings?t=${new Date().getTime()}`);
        if(res.ok) {
            const data = await res.json();
            document.getElementById('storeClosedToggle').checked = data.is_manual_closed || false;
            
            const isAuto = data.auto_schedule || false;
            document.getElementById('autoScheduleToggle').checked = isAuto;
            
            document.getElementById('openTimeInput').value = data.open_time || '05:00';
            document.getElementById('closeTimeInput').value = data.close_time || '23:00';
            document.getElementById('closeMessageInput').value = data.message || 'Ciccu Store sedang tutup. Produk di website sementara belum dapat diorder. Kami akan kembali melayani mulai pukul 05.00 WIB. Terima kasih!';
            
            toggleAutoScheduleUI(isAuto);
        }
    } catch (error) {
        console.error("Gagal memuat pengaturan toko", error);
    }
}

function toggleAutoScheduleUI(isChecked) {
    const openInput = document.getElementById('openTimeInput');
    const closeInput = document.getElementById('closeTimeInput');
    
    openInput.disabled = !isChecked;
    closeInput.disabled = !isChecked;
    
    if(!isChecked) {
        openInput.classList.add('opacity-50', 'bg-gray-100');
        closeInput.classList.add('opacity-50', 'bg-gray-100');
    } else {
        openInput.classList.remove('opacity-50', 'bg-gray-100');
        closeInput.classList.remove('opacity-50', 'bg-gray-100');
    }
}

async function saveStoreSettings(e) {
    e.preventDefault();
    const btn = document.getElementById('btnSaveSettings');
    const oldText = btn.innerHTML;
    btn.innerHTML = "Menyimpan... ✨";
    btn.disabled = true;

    const payload = {
        is_closed: document.getElementById('storeClosedToggle').checked,
        auto_schedule: document.getElementById('autoScheduleToggle').checked,
        open_time: document.getElementById('openTimeInput').value,
        close_time: document.getElementById('closeTimeInput').value,
        close_message: document.getElementById('closeMessageInput').value
    };

    try {
        const res = await fetch(`${BASE_URL}/api/settings`, {
            method: 'PUT',
            headers: { 
                'Content-Type': 'application/json', 
                'x-admin-password': sessionPass 
            },
            body: JSON.stringify(payload)
        });
        await handleResponseStatus(res);
        
        const indicator = document.getElementById('savingIndicator');
        indicator.classList.remove('hidden'); 
        setTimeout(() => indicator.classList.add('hidden'), 2000);
    } catch (error) {
        alert("Gagal menyimpan pengaturan toko.");
    } finally {
        btn.innerHTML = oldText;
        btn.disabled = false;
    }
}

async function loadAdminTestimoni() {
    if(!sessionPass) return;
    const list = document.getElementById('adminTestimoniList');
    list.innerHTML = `<div class="text-center py-5"><div class="loader mx-auto mb-2"></div><p class="text-xs text-gray-500 font-bold">Memuat testimoni...</p></div>`;
    
    try {
        const res = await fetch(`${BASE_URL}/api/testimoni`);
        const data = await res.json();
        
        if (data.length === 0) {
            list.innerHTML = `<div class="text-center py-5 text-gray-500 font-bold text-sm">Belum ada testimoni masuk.</div>`;
            return;
        }

        testimoniDataCache = {};
        data.forEach(item => {
            testimoniDataCache[item.id] = item;
        });

        let html = '';
        data.forEach(item => {
            const hasReply = item.balasan_admin && item.balasan_admin.trim() !== '';
            
            const safeNamaDisplay = escapeHTML(item.nama);
            const safeKomentarDisplay = escapeHTML(item.komentar);
            const safeBalasanDisplay = hasReply ? escapeHTML(item.balasan_admin) : '';
            
            let replyBlock = '';
            if (hasReply) {
                replyBlock = `
                <div class="bg-white border border-pink-100 rounded-xl p-3 space-y-1 shadow-inner mt-3">
                    <p class="text-[10px] md:text-[11px] font-black text-sky-500">↳ Balasan Admin:</p>
                    <p class="text-xs text-gray-600 font-medium">${safeBalasanDisplay}</p>
                    <div class="flex justify-end pt-1">
                        <button data-reply-id="${item.id}" class="edit-reply-btn text-[9px] md:text-[10px] text-pink-400 font-bold hover:underline">Edit Balasan</button>
                    </div>
                </div>`;
            } else {
                replyBlock = `
                <div class="flex justify-end mt-3">
                    <button data-reply-id="${item.id}" class="reply-btn text-[10px] md:text-xs bg-pink-400 hover:bg-pink-500 text-white font-bold px-3 py-1.5 rounded-lg shadow-sm transition-all flex items-center gap-1">
                        <svg class="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M3 10h10a8 8 0 018 8v2M3 10l6 6m-6-6l6-6"></path></svg> Balas
                    </button>
                </div>`;
            }

            html += `
            <div class="bg-pink-50/50 p-4 rounded-xl border border-pink-100">
                <div class="flex justify-between items-start">
                    <div>
                        <h4 class="text-xs md:text-sm font-black text-gray-800">${safeNamaDisplay} <span class="text-[10px] text-gray-400 font-bold ml-1">${new Date(item.created_at).toLocaleDateString('id-ID')}</span></h4>
                        <p class="text-xs text-gray-600 font-medium mt-1">${safeKomentarDisplay}</p>
                    </div>
                    <button data-delete-testi-id="${item.id}" class="delete-testi-btn text-gray-400 hover:text-red-500 p-1 rounded transition-colors shadow-sm bg-white border border-pink-100 shrink-0">
                        <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"></path></svg>
                    </button>
                </div>
                ${replyBlock}
            </div>`;
        });
        
        list.innerHTML = html;

        list.querySelectorAll('.reply-btn, .edit-reply-btn').forEach(btn => {
            btn.addEventListener('click', function() {
                const id = parseInt(this.getAttribute('data-reply-id'), 10);
                if (!isNaN(id) && testimoniDataCache[id]) {
                    const item = testimoniDataCache[id];
                    openAdminReplyModal(id, item.nama, item.komentar, item.balasan_admin || '');
                }
            });
        });

        list.querySelectorAll('.delete-testi-btn').forEach(btn => {
            btn.addEventListener('click', function() {
                const id = parseInt(this.getAttribute('data-delete-testi-id'), 10);
                if (!isNaN(id)) {
                    deleteAdminTestimoni(id);
                }
            });
        });

    } catch (error) {
        list.innerHTML = `<div class="text-center py-5 text-red-500 font-bold text-sm">Gagal memuat testimoni.</div>`;
    }
}

function openAdminReplyModal(id, nama, komentar, balasanSblmnya) {
    currentReplyId = id;
    document.getElementById('replyTargetName').innerText = nama;
    document.getElementById('replyTargetComment').innerText = `"${komentar}"`;
    document.getElementById('replyText').value = balasanSblmnya;
    
    const modal = document.getElementById('replyTestimoniModal');
    modal.classList.remove('hidden');
    setTimeout(() => modal.lastElementChild.classList.replace('scale-95', 'scale-100'), 10);
}

function closeAdminReplyModal() {
    const modal = document.getElementById('replyTestimoniModal');
    modal.lastElementChild.classList.replace('scale-100', 'scale-95');
    setTimeout(() => modal.classList.add('hidden'), 300);
}

async function submitAdminReply(e) {
    e.preventDefault();
    if(!currentReplyId) return;
    
    const replyText = document.getElementById('replyText').value;
    const btn = e.target.querySelector('button[type="submit"]');
    const oldText = btn.innerHTML;
    btn.innerHTML = "Menyimpan...";
    btn.disabled = true;

    try {
        const res = await fetch(`${BASE_URL}/api/testimoni/${currentReplyId}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json', 'x-admin-password': sessionPass },
            body: JSON.stringify({ balasan_admin: replyText })
        });
        
        await handleResponseStatus(res);
        closeAdminReplyModal();
        loadAdminTestimoni(); 
    } catch (error) {
        alert("Gagal menyimpan balasan.");
    } finally {
        btn.innerHTML = oldText;
        btn.disabled = false;
    }
}

async function deleteAdminTestimoni(id) {
    if(!confirm("Yakin ingin menghapus testimoni ini secara permanen?")) return;
    try {
        const res = await fetch(`${BASE_URL}/api/testimoni/${id}`, {
            method: 'DELETE',
            headers: { 'x-admin-password': sessionPass }
        });
        await handleResponseStatus(res);
        loadAdminTestimoni(); 
    } catch (error) {
        alert("Gagal menghapus testimoni.");
    }
}

function checkSession() {
    sessionPass = sessionStorage.getItem("ciccuAdminPass");
    if (sessionPass) {
        document.getElementById('loginOverlay').style.display = 'none';
        document.getElementById('mainContent').style.display = 'block';
        loadData();
    } else {
        document.getElementById('loginOverlay').style.display = 'flex';
        document.getElementById('mainContent').style.display = 'none';
    }
}

async function loginAdmin() {
    const input = document.getElementById('adminPasswordInput').value;
    if (!input) return alert("Isi passwordnya dulu ya!");

    const turnstileToken = document.querySelector('[name="cf-turnstile-response"]')?.value;
    if (!turnstileToken) {
        return alert("Mohon tunggu dan selesaikan verifikasi keamanan Captcha terlebih dahulu ya! 🎀");
    }

    const btn = document.querySelector('#loginOverlay button');
    const oldText = btn.innerHTML;
    btn.innerHTML = "Memverifikasi... ✨";
    btn.disabled = true;

    try {
        const res = await fetch(`${BASE_URL}/api/login`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ password: input, turnstileResponse: turnstileToken })
        });

        if (res.ok) {
            sessionStorage.setItem("ciccuAdminPass", input);
            if (typeof turnstile !== 'undefined') turnstile.reset();
            checkSession();
        } else {
            const errData = await res.json();
            alert(errData.error || "Gagal login.");
            if (typeof turnstile !== 'undefined') turnstile.reset(); 
        }
    } catch (err) {
        alert("Terjadi kesalahan jaringan.");
        if (typeof turnstile !== 'undefined') turnstile.reset();
    } finally {
        btn.innerHTML = oldText;
        btn.disabled = false;
    }
}

function logoutAdmin() {
    sessionStorage.removeItem("ciccuAdminPass");
    window.location.reload();
}

async function handleResponseStatus(res) {
    if (res.status === 403) {
        alert("Gagal memproses! Password admin Anda salah atau sesi berakhir.");
        logoutAdmin();
        throw new Error("Unauthorized");
    }
    if (!res.ok) throw new Error("Server response error: " + res.status);
    return res.json();
}

checkSession();

async function loadData() {
    if(!sessionPass) return;
    const list = document.getElementById('dataList');
    try {
        const response = await fetch(`${BASE_URL}/api/pricelist?t=${new Date().getTime()}`);
        if (!response.ok) throw new Error(`Server membalas dengan status: ${response.status}`);
        const data = await response.json();
        if (!Array.isArray(data)) throw new Error("Data ditarik bukan format tabel.");
        
        globalAdminData = data.sort((a, b) => {
            const aApp = (a.app_sort_order && a.app_sort_order > 0) ? a.app_sort_order : 9999;
            const bApp = (b.app_sort_order && b.app_sort_order > 0) ? b.app_sort_order : 9999;
            const aPkg = (a.sort_order && a.sort_order > 0) ? a.sort_order : 9999;
            const bPkg = (b.sort_order && b.sort_order > 0) ? b.sort_order : 9999;
            return (aApp - bApp) || (aPkg - bPkg) || (a.id - b.id);
        });

        try {
            const formResponse = await fetch(`${BASE_URL}/api/forms?t=${new Date().getTime()}`);
            if(formResponse.ok) {
                const formData = await formResponse.json();
                globalFormsData = {};
                if(Array.isArray(formData)) {
                    formData.forEach(f => { globalFormsData[f.app_name.toLowerCase().trim()] = f; });
                }
            }
        } catch(e) {}
        
        loadStoreSettings();

        filterAdminList(); 
    } catch (error) {
        list.innerHTML = `<div class="text-center py-10 text-red-500 font-bold text-sm bg-white rounded-2xl border border-red-200 shadow-sm mx-2">Gagal memuat data!<br><br><span class="text-xs text-gray-500 font-medium">${escapeHTML(error.message)}</span></div>`;
    }
}

function parseFormFields(str) {
    if (!str) return [];
    try { if (str.trim().startsWith('[')) return JSON.parse(str).map(item => item.name); } catch(e) {}
    return str.split(',').map(s => s.trim()).filter(s => s);
}

function renderData(dataArray) {
    const list = document.getElementById('dataList');
    if (dataArray.length === 0) {
        list.innerHTML = `<div class="text-center py-10 text-gray-500 font-bold text-sm bg-white rounded-3xl border border-pink-200 shadow-sm">Tidak ada paket aplikasi ditemukan 🥺</div>`;
        return;
    }

    const appOrders = {}; const appFirstIds = {}; const groupedData = {};
    dataArray.forEach(item => {
        if (!groupedData[item.app_name]) groupedData[item.app_name] = [];
        groupedData[item.app_name].push(item);
        const appOrder = (item.app_sort_order && item.app_sort_order > 0) ? item.app_sort_order : 9999;
        if (!appOrders[item.app_name] || appOrder < appOrders[item.app_name]) appOrders[item.app_name] = appOrder;
        if (!appFirstIds[item.app_name] || item.id < appFirstIds[item.app_name]) appFirstIds[item.app_name] = item.id;
    });

    const orderedAppNames = Object.keys(groupedData).sort((a, b) => (appOrders[a] - appOrders[b]) || (appFirstIds[a] - appFirstIds[b]));
    orderedAppNames.forEach(appName => {
        groupedData[appName].sort((a, b) => {
            const aPkg = (a.sort_order && a.sort_order > 0) ? a.sort_order : 9999;
            const bPkg = (b.sort_order && b.sort_order > 0) ? b.sort_order : 9999;
            return (aPkg - bPkg) || (a.id - b.id);
        });
    });

    let html = '';
    for (const appName of orderedAppNames) {
        const packages = groupedData[appName]; const appKey = appName.toLowerCase().trim();
        const formObj = globalFormsData[appKey]; const rawFields = formObj ? formObj.form_fields : '';
        const parsedFields = parseFormFields(rawFields); const exactAppNameInDb = formObj ? formObj.app_name : appName;
        const isExpanded = !!expandedApps[exactAppNameInDb]; const packageIds = packages.map(p => p.id);
        const isAppAllSelected = packageIds.length > 0 && packageIds.every(id => selectedItems.has(id));
        const isAllSold = packages.length > 0 && packages.every(p => p.status && p.status.toLowerCase() !== 'ready');

        let headerFormText = parsedFields.length > 0 ? `📋 Form Pembeli: <span class="text-sky-500 font-bold">${escapeHTML(parsedFields.join(', '))}</span>` : `🌸 Tidak memakai formulir khusus`;
        const appHeaderBg = isAllSold ? 'bg-gray-100 hover:bg-gray-200/80' : 'bg-pink-50 hover:bg-pink-100/60';
        const appTitleColor = isAllSold ? 'text-gray-500' : 'text-pink-500';
        const appBadge = isAllSold ? `<span class="ml-1.5 bg-red-100 text-red-500 border border-red-200 text-[8px] md:text-[9px] px-1.5 py-0.5 rounded-md font-black uppercase tracking-widest shadow-sm">Habis</span>` : '';

        let accordionFormHTML = `
            <div class="bg-pink-50 p-3 md:p-4 rounded-xl border border-pink-200 mb-3 md:mb-4">
                <div class="flex justify-between items-center ${parsedFields.length > 0 ? 'mb-2 md:mb-3' : ''}">
                     <h4 class="text-[10px] md:text-xs font-black text-sky-500 tracking-widest uppercase flex items-center gap-1.5">${parsedFields.length > 0 ? '📋 FORM PEMBELI' : '🌸 TIDAK ADA FORMULIR KHUSUS'}</h4>
                     <button onclick="openFormModal('${escapeHTML(exactAppNameInDb.replace(/'/g, "\\'"))}', '${encodeURIComponent(rawFields)}')" class="text-[9px] md:text-[11px] bg-white text-sky-500 px-2.5 py-1.5 rounded-lg font-bold border border-sky-200 hover:bg-sky-50 transition-colors flex items-center gap-1.5 shadow-sm">
                         ${parsedFields.length > 0 ? '<svg class="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z"></path></svg> Edit Form' : '<svg class="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4"></path></svg> Buat Form'}
                     </button>
                </div>
                ${parsedFields.length > 0 ? `<div class="space-y-1.5 border-t border-pink-200 pt-2 md:pt-3">${parsedFields.map((f, i) => `<div class="flex items-center text-[10px] md:text-xs text-gray-700 bg-white px-2.5 py-2 rounded-lg border border-pink-100 gap-2 shadow-sm font-bold"><span class="w-4 h-4 md:w-5 md:h-5 rounded-md bg-sky-100 text-sky-500 flex items-center justify-center font-black text-[9px] md:text-[10px]">${i+1}</span><span>${escapeHTML(f)}</span></div>`).join('')}</div>` : ''}
            </div>`;

        html += `
            <div class="app-accordion-group bg-white rounded-2xl md:rounded-3xl border border-pink-200 shadow-md shadow-pink-100/50 mb-4 overflow-hidden" data-app="${escapeHTML(exactAppNameInDb)}">
                <div class="p-2.5 md:p-4 flex items-center ${appHeaderBg} transition-colors gap-2 md:gap-3 select-none border-b border-transparent ${isExpanded ? 'border-pink-200' : ''}">
                    <div class="flex-1 overflow-hidden cursor-pointer flex flex-col justify-center" onclick="toggleExpand('${escapeHTML(exactAppNameInDb.replace(/'/g, "\\'"))}')">
                        <h3 class="font-black ${appTitleColor} text-sm md:text-lg capitalize flex items-center gap-1">${escapeHTML(appName)} ${appBadge}</h3>
                        <p class="text-[9px] md:text-[11px] text-gray-500 font-bold truncate w-full mt-0.5">${headerFormText}</p>
                        <div class="mt-1 md:mt-1.5 flex items-center"><span class="text-[8px] md:text-[10px] bg-white text-gray-400 px-2 py-0.5 md:px-2.5 md:py-1 rounded-md md:rounded-lg font-bold border border-gray-200 shadow-sm">${escapeHTML(String(packages.length))} Paket</span></div>
                    </div>
                    <div class="cursor-pointer p-1.5 md:p-2 shrink-0 flex items-center justify-center text-pink-300 hover:text-pink-500 transition-colors" onclick="toggleExpand('${escapeHTML(exactAppNameInDb.replace(/'/g, "\\'"))}')">
                        <svg class="w-5 h-5 md:w-6 md:h-6 transform transition-transform duration-300 ${isExpanded ? 'rotate-180' : ''}" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7"></path></svg>
                    </div>
                    <div class="flex items-center gap-2 md:gap-4 shrink-0 border-l border-pink-200 pl-2 md:pl-4">
                        <button onclick="deleteApplication('${escapeHTML(exactAppNameInDb.replace(/'/g, "\\'"))}', [${packageIds.join(',')}])" class="text-pink-300 hover:text-red-500 hover:bg-red-50 p-1.5 md:p-2 rounded-lg transition-colors" title="Hapus Aplikasi"><svg class="w-4 h-4 md:w-5 md:h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"></path></svg></button>
                        <input type="checkbox" onchange="toggleSelectApp('${escapeHTML(exactAppNameInDb.replace(/'/g, "\\'"))}', this.checked, [${packageIds.join(',')}])" class="w-4 h-4 md:w-5 md:h-5 text-pink-500 bg-white border-pink-300 rounded outline-none cursor-pointer accent-pink-500" ${isAppAllSelected ? 'checked' : ''}>
                    </div>
                </div>
                <div class="grid transition-all duration-300 ${isExpanded ? 'grid-rows-[1fr]' : 'grid-rows-[0fr]'}"><div class="overflow-hidden"><div class="p-3 md:p-5">
                            ${accordionFormHTML}
                            <div class="flex justify-between items-center mb-2 md:mb-3 mt-1">
                                <span class="text-[9px] md:text-[11px] font-bold text-gray-400 uppercase tracking-wider flex items-center gap-1.5"><svg class="w-3.5 h-3.5 md:w-4 md:h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 6h16M4 10h16M4 14h16M4 18h16"></path></svg> Daftar Paket</span>
                                <button onclick="openAddPackageModal('${escapeHTML(exactAppNameInDb.replace(/'/g, "\\'"))}')" class="text-[9px] md:text-[11px] bg-pink-400 hover:bg-pink-500 text-white px-2.5 py-1.5 md:px-3 md:py-2 rounded-lg md:rounded-xl font-bold shadow-md shadow-pink-200 transition-all flex items-center gap-1"><svg class="w-3 h-3 md:w-3.5 md:h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="3" d="M12 4v16m8-8H4"></path></svg> Tambah Paket</button>
                            </div>
                            <div class="space-y-2 sortable-list" id="sort-${exactAppNameInDb.replace(/\s+/g, '-')}">`;

        packages.forEach(item => {
            const currentStatus = item.status ? item.status.trim() : 'Ready'; const isReady = currentStatus.toLowerCase() === 'ready'; const isSelected = selectedItems.has(item.id);
            let rowInlineStyle = ''; let rowClass = 'package-item p-2.5 md:p-4 rounded-xl md:rounded-2xl border flex justify-between items-center gap-2 md:gap-3 transition-all shadow-sm';
            if (isSelected) { rowClass += ' bg-pink-50 border-pink-400 ring-2 ring-pink-200'; } else if (isReady) { rowInlineStyle = 'background-color: #ffffff; border-color: #fce7f3;'; } else { rowInlineStyle = 'background-color: #f9fafb; border-color: #e5e7eb; opacity: 0.6; filter: grayscale(100%);'; }
            const statusBadgeHTML = isReady ? `<span class="text-[8px] md:text-[9px] font-black text-green-500 bg-green-50 border-green-200 px-1.5 md:px-2 py-0.5 rounded border uppercase tracking-wider shadow-sm" id="status-text-${item.id}">READY</span>` : `<span class="text-[8px] md:text-[9px] font-black text-red-500 bg-red-50 border-red-200 px-1.5 md:px-2 py-0.5 rounded border uppercase tracking-wider shadow-sm" id="status-text-${item.id}">SOLD</span>`;

            html += `
                <div class="${rowClass}" style="${rowInlineStyle}" data-id="${item.id}" id="row-item-${item.id}">
                    <div class="drag-handle cursor-grab active:cursor-grabbing text-gray-400 hover:text-pink-500 shrink-0 p-0.5 md:p-1"><svg class="w-4 h-4 md:w-5 md:h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 8h16M4 16h16"></path></svg></div>
                    <div class="flex items-start md:items-center gap-2 flex-1 overflow-hidden">
                        <input type="checkbox" onchange="toggleSelect(${item.id}, this.checked)" class="mt-0.5 md:mt-0 w-4 h-4 md:w-5 md:h-5 text-pink-500 bg-white border-pink-300 rounded outline-none cursor-pointer accent-pink-500 shrink-0" ${isSelected ? 'checked' : ''}>
                        <div class="flex-1 overflow-hidden">
                            <p class="text-[10px] md:text-xs font-bold text-gray-500 uppercase tracking-widest">${escapeHTML(item.category)} • <span class="text-gray-800">${escapeHTML(item.duration)}</span> • <span class="text-pink-500 font-black">${escapeHTML(item.price)}</span></p>
                            ${item.notes && item.notes.toLowerCase() !== 'nan' ? `<p class="text-[9px] md:text-[10px] text-pink-400 mt-0.5 md:mt-1 italic font-bold">↳ ${escapeHTML(item.notes)}</p>` : ''}
                        </div>
                    </div>
                    <div class="flex items-center gap-1.5 md:gap-3 border-l border-pink-200/60 pl-1.5 md:pl-3 shrink-0">
                        <div class="flex flex-col items-center gap-0.5 md:gap-1 hidden md:flex">
                            ${statusBadgeHTML}
                            <div class="relative inline-block w-10 h-5 md:w-12 md:h-6 align-middle select-none">
                                <input type="checkbox" id="toggle-${item.id}" ${isReady ? 'checked' : ''} onchange="toggleStatus(${item.id}, this.checked)" class="toggle-checkbox absolute block w-5 h-5 md:w-6 md:h-6 rounded-full bg-white border-4 appearance-none cursor-pointer opacity-0"/>
                                <label for="toggle-${item.id}" class="toggle-label block overflow-hidden h-5 md:h-6 rounded-full bg-gray-200 cursor-pointer"></label>
                                <div class="toggle-circle absolute top-0.5 left-0.5 pointer-events-none shadow-sm w-4 h-4 md:w-5 md:h-5"></div>
                            </div>
                        </div>
                        <div class="flex items-center gap-1 bg-white p-1 rounded-lg md:rounded-xl border border-pink-100 shadow-sm"><button onclick="editPackage(${item.id})" class="text-pink-400 hover:text-white hover:bg-pink-400 p-1.5 rounded-md md:rounded-lg transition-colors"><svg class="w-3.5 h-3.5 md:w-4 md:h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z"></path></svg></button><div class="w-px h-4 md:h-5 bg-pink-100"></div><button onclick="deleteData(${item.id})" class="text-gray-400 hover:text-red-500 hover:bg-red-50 p-1.5 rounded-md md:rounded-lg transition-colors"><svg class="w-3.5 h-3.5 md:w-4 md:h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"></path></svg></button></div>
                    </div>
                </div>`;
        });
        html += `</div></div></div></div></div>`;
    }
    list.innerHTML = html;
    initSortable();
}

function filterAdminList() {
    const keyword = document.getElementById('adminSearchInput').value.toLowerCase();
    const filteredData = globalAdminData.filter(item => item.app_name.toLowerCase().includes(keyword) || item.category.toLowerCase().includes(keyword) || item.status.toLowerCase().includes(keyword));
    renderData(filteredData);
}

function toggleExpand(appKey) { expandedApps[appKey] = !expandedApps[appKey]; filterAdminList(); }
function expandAll() { Object.keys(globalAdminData.reduce((acc, item) => { acc[item.app_name] = true; return acc; }, {})).forEach(app => expandedApps[app] = true); filterAdminList(); }
function collapseAll() { expandedApps = {}; filterAdminList(); }

function initSortable() {
    document.querySelectorAll('.sortable-list').forEach(container => {
        new Sortable(container, {
            animation: 150, handle: '.drag-handle', delay: 200, delayOnTouchOnly: true, ghostClass: 'sortable-ghost', dragClass: 'sortable-drag',
            onEnd: async function (evt) {
                const items = container.querySelectorAll('.package-item');
                const newOrder = Array.from(items).map((el, index) => ({ id: parseInt(el.dataset.id), sort_order: index + 1 }));
                newOrder.forEach(o => {
                    const dataItem = globalAdminData.find(d => d.id === o.id);
                    if(dataItem) dataItem.sort_order = o.sort_order;
                });
                filterAdminList(); 
                try {
                    const res = await fetch(`${BASE_URL}/api/pricelist/reorder`, { method: 'PUT', headers: { 'Content-Type': 'application/json', 'x-admin-password': sessionPass }, body: JSON.stringify({ order: newOrder }) });
                    await handleResponseStatus(res);
                    const indicator = document.getElementById('savingIndicator');
                    indicator.classList.remove('hidden'); setTimeout(() => indicator.classList.add('hidden'), 2000);
                } catch(e) { loadData(); }
            }
        });
    });
}

function openReorderModal() {
    const modal = document.getElementById('reorderModal'); const list = document.getElementById('reorderAppList');
    const appOrders = {}; const appFirstIds = {};
    globalAdminData.forEach(item => {
        const appOrder = (item.app_sort_order && item.app_sort_order > 0) ? item.app_sort_order : 9999;
        if (!appOrders[item.app_name] || appOrder < appOrders[item.app_name]) appOrders[item.app_name] = appOrder;
        if (!appFirstIds[item.app_name] || item.id < appFirstIds[item.app_name]) appFirstIds[item.app_name] = item.id;
    });
    const uniqueApps = [...new Set(globalAdminData.map(d => d.app_name))];
    uniqueApps.sort((a, b) => (appOrders[a] - appOrders[b]) || (appFirstIds[a] - appFirstIds[b]));

    list.innerHTML = uniqueApps.map((appName, index) => `<div class="reorder-item bg-white border border-pink-100 p-2.5 md:p-3 rounded-2xl flex items-center justify-between gap-3 hover:border-pink-300 transition-colors shadow-sm" data-app="${escapeHTML(appName)}"><div class="flex items-center gap-3 w-full overflow-hidden select-none"><span class="reorder-num text-[10px] font-black bg-pink-100 text-pink-500 w-6 h-6 md:w-7 md:h-7 rounded-lg md:rounded-xl flex items-center justify-center shrink-0">${index + 1}</span><span class="font-bold text-xs md:text-sm text-gray-800 capitalize truncate">${escapeHTML(appName)}</span></div><div class="reorder-handle cursor-grab active:cursor-grabbing bg-pink-50 hover:bg-pink-100 p-1.5 md:p-2 rounded-lg md:rounded-xl text-pink-300 hover:text-pink-500 transition-colors shrink-0 flex items-center justify-center"><svg class="w-4 h-4 md:w-5 md:h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 8h16M4 16h16"></path></svg></div></div>`).join('');
    modal.classList.remove('hidden'); setTimeout(() => modal.lastElementChild.classList.replace('scale-95', 'scale-100'), 10);
    if (sortableReorder) sortableReorder.destroy();
    sortableReorder = new Sortable(list, {
        animation: 150, handle: '.reorder-handle', ghostClass: 'sortable-ghost', dragClass: 'sortable-drag',
        onEnd: function() { list.querySelectorAll('.reorder-item').forEach((item, idx) => { item.querySelector('.reorder-num').innerText = idx + 1; }); }
    });
}
function closeReorderModal() { const modal = document.getElementById('reorderModal'); modal.lastElementChild.classList.replace('scale-100', 'scale-95'); setTimeout(() => modal.classList.add('hidden'), 300); }
async function saveReorderModal() {
    const btn = document.getElementById('btnSaveReorder'); btn.innerHTML = "Menyimpan..."; btn.disabled = true;
    const items = document.querySelectorAll('.reorder-item'); const newOrder = Array.from(items).map((el, index) => ({ app_name: el.dataset.app, app_sort_order: index + 1 }));
    try {
        const res = await fetch(`${BASE_URL}/api/reorder-apps`, { method: 'PUT', headers: { 'Content-Type': 'application/json', 'x-admin-password': sessionPass }, body: JSON.stringify({ order: newOrder }) });
        await handleResponseStatus(res); closeReorderModal(); loadData();
    } catch (e) { } finally { btn.innerHTML = "Simpan Urutan Baru"; btn.disabled = false; }
}

function openFormModal(appName, rawFieldsEnc) { builderCurrentApp = appName; builderFields = parseFormFields(decodeURIComponent(rawFieldsEnc)); document.getElementById('builderAppName').innerText = appName; renderFormBuilderFields(); const modal = document.getElementById('formBuilderModal'); modal.classList.remove('hidden'); setTimeout(() => modal.lastElementChild.classList.replace('scale-95', 'scale-100'), 10); }
function closeFormModal() { const modal = document.getElementById('formBuilderModal'); modal.lastElementChild.classList.replace('scale-100', 'scale-95'); setTimeout(() => modal.classList.add('hidden'), 300); }
function addFormFieldBuilder() { builderFields.push(''); renderFormBuilderFields(); }
function removeFormFieldBuilder(index) { builderFields.splice(index, 1); renderFormBuilderFields(); }
function updateFormFieldBuilder(index, value) { builderFields[index] = value; }
function renderFormBuilderFields() {
    const container = document.getElementById('formFieldsContainer');
    if(builderFields.length === 0) { container.innerHTML = `<p class="text-center text-xs text-gray-500 py-4 font-bold border border-pink-200 border-dashed rounded-xl bg-pink-50">Belum ada kolom form 🌸</p>`; return; }
    container.innerHTML = builderFields.map((f, i) => `<div class="flex gap-2 items-center bg-white p-2.5 rounded-2xl border border-pink-100 shadow-sm"><span class="w-6 h-6 md:w-7 md:h-7 rounded-lg md:rounded-xl bg-sky-50 text-sky-500 flex items-center justify-center text-[10px] font-black shrink-0">${i+1}</span><input type="text" value="${escapeHTML(f)}" oninput="updateFormFieldBuilder(${i}, this.value)" class="flex-1 bg-transparent text-xs md:text-sm font-bold text-gray-700 outline-none border-b border-pink-100 focus:border-sky-400 px-2 py-1" placeholder="Misal: Nama Profil"><button onclick="removeFormFieldBuilder(${i})" class="text-gray-400 hover:text-red-500 bg-gray-50 hover:bg-red-50 p-1.5 md:p-2 rounded-lg md:rounded-xl transition-colors shrink-0"><svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"></path></svg></button></div>`).join('');
}
async function saveFormBuilderConfig() {
    const btn = document.getElementById('btnSaveForm'); btn.innerHTML = "Menyimpan..."; btn.disabled = true; const validFields = builderFields.map(f => f.trim()).filter(f => f !== '');
    try {
        if (validFields.length === 0) { await fetch(`${BASE_URL}/api/forms/${encodeURIComponent(builderCurrentApp)}`, { method: 'DELETE', headers: {'x-admin-password': sessionPass} }); } 
        else { const res = await fetch(`${BASE_URL}/api/forms`, { method: 'POST', headers: { 'Content-Type': 'application/json', 'x-admin-password': sessionPass }, body: JSON.stringify({ app_name: builderCurrentApp, form_fields: validFields.join(', ') }) }); await handleResponseStatus(res); }
        closeFormModal(); expandedApps[builderCurrentApp] = true; loadData();
    } catch (e) { } finally { btn.innerHTML = "Simpan Form"; btn.disabled = false; }
}

function openImportModal() { const modal = document.getElementById('importModal'); document.getElementById('csvFileInputModal').value = ''; document.getElementById('csvProgressModal').classList.add('hidden'); modal.classList.remove('hidden'); setTimeout(() => modal.lastElementChild.classList.replace('scale-95', 'scale-100'), 10); }
function closeImportModal() { const modal = document.getElementById('importModal'); modal.lastElementChild.classList.replace('scale-100', 'scale-95'); setTimeout(() => modal.classList.add('hidden'), 300); }
async function processCSV() {
    const fileInput = document.getElementById('csvFileInputModal'); const progress = document.getElementById('csvProgressModal'); const btn = document.getElementById('btnSubmitImport'); const file = fileInput.files[0]; if (!file) return alert("Pilih file CSV dulu!");
    progress.classList.remove('hidden'); btn.disabled = true; btn.innerHTML = "Menyimpan..."; const reader = new FileReader();
    reader.onload = async function(e) {
        const text = e.target.result; const rows = text.split(/\r?\n/).slice(1); let successCount = 0;
        for (let i = 0; i < rows.length; i++) {
            const row = rows[i]; if (!row.trim()) continue; const cols = row.split(',').map(c => c.trim().replace(/^"|"$/g, '')); if (cols.length < 4) continue;
            progress.innerText = `Mengirim baris ${i + 1} dari ${rows.length}...`;
            try { const res = await fetch(`${BASE_URL}/api/pricelist`, { method: 'POST', headers: { 'Content-Type': 'application/json', 'x-admin-password': sessionPass }, body: JSON.stringify({ app_name: cols[0], category: cols[1], duration: cols[2], price: cols[3], notes: cols[4] || '', status: cols[5] || 'Ready' }) }); await handleResponseStatus(res); successCount++; } catch (error) { break; }
        }
        progress.innerText = `Selesai! ${successCount} data berhasil diunggah.`; setTimeout(() => { closeImportModal(); btn.disabled = false; btn.innerHTML = "Import Data"; loadData(); }, 1500);
    }; reader.readAsText(file);
}
function exportCSV() {
    const keyword = document.getElementById('adminSearchInput').value.toLowerCase(); const dataToExport = globalAdminData.filter(item => item.app_name.toLowerCase().includes(keyword) || item.category.toLowerCase().includes(keyword) || item.status.toLowerCase().includes(keyword)); if(dataToExport.length === 0) return alert('Tidak ada data untuk diekspor.');
    let csvContent = "app_name,category,duration,price,status,notes\n";
    dataToExport.forEach(item => { const escapeQuotes = (str) => `"${String(str).replace(/"/g, '""')}"`; csvContent += [escapeQuotes(item.app_name), escapeQuotes(item.category), escapeQuotes(item.duration), escapeQuotes(item.price), escapeQuotes(item.status), escapeQuotes(item.notes || '')].join(",") + "\n"; });
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' }); const url = URL.createObjectURL(blob); const link = document.createElement("a"); link.setAttribute("href", url); link.setAttribute("download", `ciccu-pricelist.csv`); document.body.appendChild(link); link.click(); document.body.removeChild(link);
}

function openAddPackageModal(appName) { document.getElementById('addPkgAppName').value = appName; document.getElementById('addPkgAppNameDisplay').innerText = appName; document.getElementById('addPackageForm').reset(); document.getElementById('addPkgStatus').value = 'Ready'; const modal = document.getElementById('addPackageModal'); modal.classList.remove('hidden'); setTimeout(() => modal.lastElementChild.classList.replace('scale-95', 'scale-100'), 10); }
function closeAddPackageModal() { const modal = document.getElementById('addPackageModal'); modal.lastElementChild.classList.replace('scale-100', 'scale-95'); setTimeout(() => modal.classList.add('hidden'), 300); }
async function submitAddPackageForm(e) {
    e.preventDefault(); const btn = document.getElementById('btnSubmitAddPkg'); btn.innerHTML = "Menyimpan..."; btn.disabled = true; const appName = document.getElementById('addPkgAppName').value;
    const payload = { app_name: appName, category: document.getElementById('addPkgCat').value, duration: document.getElementById('addPkgDur').value, price: document.getElementById('addPkgPrice').value, status: document.getElementById('addPkgStatus').value, notes: document.getElementById('addPkgNotes').value };
    try { const res = await fetch(`${BASE_URL}/api/pricelist`, { method: 'POST', headers: { 'Content-Type': 'application/json', 'x-admin-password': sessionPass }, body: JSON.stringify(payload) }); await handleResponseStatus(res); expandedApps[appName] = true; closeAddPackageModal(); loadData(); } catch (error) { } finally { btn.innerHTML = "Tambahkan"; btn.disabled = false; }
}

function editPackage(id) {
    const item = globalAdminData.find(d => d.id === id); if(!item) return; currentEditId = id;
    document.getElementById('editAppName').value = item.app_name; document.getElementById('editAppCat').value = item.category; document.getElementById('editAppDur').value = item.duration; document.getElementById('editAppPrice').value = item.price; document.getElementById('editAppStatus').value = item.status; document.getElementById('editAppNotes').value = (item.notes && item.notes.toLowerCase() !== 'nan') ? item.notes : '';
    const modal = document.getElementById('editModal'); modal.classList.remove('hidden'); setTimeout(() => modal.lastElementChild.classList.replace('scale-95', 'scale-100'), 10);
}
function closeEditModal() { const modal = document.getElementById('editModal'); modal.lastElementChild.classList.replace('scale-100', 'scale-95'); setTimeout(() => modal.classList.add('hidden'), 300); currentEditId = null; }
async function submitEditForm(e) {
    e.preventDefault(); const btn = document.getElementById('btnSubmitEdit'); btn.innerHTML = "Menyimpan..."; btn.disabled = true;
    const payload = { app_name: document.getElementById('editAppName').value, category: document.getElementById('editAppCat').value, duration: document.getElementById('editAppDur').value, price: document.getElementById('editAppPrice').value, status: document.getElementById('editAppStatus').value, notes: document.getElementById('editAppNotes').value };
    try { const res = await fetch(`${BASE_URL}/api/pricelist/${currentEditId}`, { method: 'PUT', headers: { 'Content-Type': 'application/json', 'x-admin-password': sessionPass }, body: JSON.stringify(payload) }); await handleResponseStatus(res); closeEditModal(); loadData(); } catch (error) { } finally { btn.innerHTML = "Simpan"; btn.disabled = false; }
}

function toggleSelect(id, isChecked) { if(isChecked) selectedItems.add(id); else selectedItems.delete(id); updateBulkUI(); filterAdminList(); }
function toggleSelectApp(appName, isChecked, packageIds) { packageIds.forEach(id => { if (isChecked) selectedItems.add(id); else selectedItems.delete(id); }); updateBulkUI(); filterAdminList(); }
async function deleteApplication(appName, packageIds) {
    if (packageIds.length === 0) { if (!confirm(`Aplikasi "${appName}" kosong. Hapus form?`)) return; try { await fetch(`${BASE_URL}/api/forms/${encodeURIComponent(appName)}`, { method: 'DELETE', headers: {'x-admin-password': sessionPass} }); loadData(); } catch (e) { } return; }
    if (!confirm(`Hapus permanen "${appName}" beserta ${packageIds.length} paket?`)) return;
    try { const response = await fetch(`${BASE_URL}/api/delete/bulk`, { method: 'DELETE', headers: { 'Content-Type': 'application/json', 'x-admin-password': sessionPass }, body: JSON.stringify({ ids: packageIds }) }); await handleResponseStatus(response); try { await fetch(`${BASE_URL}/api/forms/${encodeURIComponent(appName)}`, { method: 'DELETE', headers: {'x-admin-password': sessionPass} }); } catch (formErr) { } packageIds.forEach(id => selectedItems.delete(id)); updateBulkUI(); loadData(); } catch (error) { }
}
function clearSelection() { selectedItems.clear(); updateBulkUI(); filterAdminList(); }

function updateBulkUI() {
    const tabProduk = document.getElementById('tab-produk');
    const isProdukActive = tabProduk && tabProduk.classList.contains('text-pink-500');
    const bar = document.getElementById('bulkActionBar'); const count = document.getElementById('bulkCount');
    if(selectedItems.size > 0 && isProdukActive) { bar.classList.remove('translate-y-full'); count.innerText = `${selectedItems.size} item 🎀`; } else { bar.classList.add('translate-y-full'); }
}

async function bulkUpdateStatus(status) {
    if(!confirm(`Ubah status ${selectedItems.size} paket menjadi ${status}?`)) return;
    try { const res = await fetch(`${BASE_URL}/api/status/bulk`, { method: 'PUT', headers: { 'Content-Type': 'application/json', 'x-admin-password': sessionPass }, body: JSON.stringify({ ids: Array.from(selectedItems), status: status }) }); await handleResponseStatus(res); clearSelection(); loadData(); } catch(e) { }
}
async function bulkDelete() {
    if(!confirm(`Hapus permanen ${selectedItems.size} paket terpilih?`)) return;
    try { const res = await fetch(`${BASE_URL}/api/delete/bulk`, { method: 'DELETE', headers: { 'Content-Type': 'application/json', 'x-admin-password': sessionPass }, body: JSON.stringify({ ids: Array.from(selectedItems) }) }); await handleResponseStatus(res); clearSelection(); loadData(); } catch(e) { }
}

async function addData(e) {
    e.preventDefault(); const btn = document.getElementById('btnSubmit'); btn.innerHTML = "Menyimpan..."; btn.disabled = true;
    const payload = { app_name: document.getElementById('appName').value, category: document.getElementById('appCat').value, duration: document.getElementById('appDur').value, price: document.getElementById('appPrice').value, status: document.getElementById('appStatus').value, notes: document.getElementById('appNotes').value };
    try { const res = await fetch(`${BASE_URL}/api/pricelist`, { method: 'POST', headers: { 'Content-Type': 'application/json', 'x-admin-password': sessionPass }, body: JSON.stringify(payload) }); await handleResponseStatus(res); document.getElementById('addForm').reset(); document.getElementById('adminSearchInput').value = ''; loadData(); } catch (error) { } finally { btn.innerHTML = "Simpan Data ✨"; btn.disabled = false; }
}

async function toggleStatus(id, isChecked) {
    const newStatus = isChecked ? 'Ready' : 'Sold'; const itemIndex = globalAdminData.findIndex(item => item.id === id);
    if (itemIndex !== -1) { globalAdminData[itemIndex].status = newStatus; } filterAdminList(); 
    try { const res = await fetch(`${BASE_URL}/api/status/${id}`, { method: 'PUT', headers: { 'Content-Type': 'application/json', 'x-admin-password': sessionPass }, body: JSON.stringify({ status: newStatus }) }); await handleResponseStatus(res); } catch (error) { loadData(); }
}

async function deleteData(id) { if(!confirm("Yakin ingin menghapus paket ini?")) return; try { const res = await fetch(`${BASE_URL}/api/delete/${id}`, { method: 'DELETE', headers: {'x-admin-password': sessionPass} }); await handleResponseStatus(res); loadData(); } catch (error) { } }
