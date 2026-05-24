const csvFileName = atob('aHR0cHM6Ly9kb2NzLmdvb2dsZS5jb20vc3ByZWFkc2hlZXRzL2QvMThXUUN4NEJ6ckxUSHY2RWhYcG04OGJHUzJ5LUNGOXFLLUJjQVlkbVRzNXMvZXhwb3J0P2Zvcm1hdD1jc3YmZ2lkPTE0NjA4NzgyNTE=');

let allApps = {};
let currentCategory = 'all';

const appCategoryMap = {
    'netflix': 'streaming', 'iqiyi': 'streaming', 'vidio': 'streaming', 'viu': 'streaming', 
    'disney': 'streaming', 'youtube': 'streaming', 'loklok': 'streaming', 'loktv': 'streaming',
    'prime': 'streaming', 'amazon': 'streaming', 'hbo': 'streaming', 'apple tv': 'streaming',
    'gagaoolala': 'streaming', 'crunchyroll': 'streaming', 'dramabox': 'streaming',
    'wetv': 'streaming', 'we tv': 'streaming',
    
    'spotify': 'music', 'apple music': 'music', 'apple': 'music',
    
    'capcut': 'editing', 'canva': 'editing', 'alight motion': 'editing', 'alight': 'editing',
    
    'turnitin': 'study', 'cek turnitin': 'study', 'cek ai': 'study', 'chatgpt': 'study', 
    'claude': 'study', 'grok': 'study', 'grokai': 'study', 'ms365': 'study', 'microsoft': 'study'
};

const logoMap = {
    'netflix': 'netflix.com', 'disney': 'disneyplus.com', 'youtube': 'youtube.com', 
    'viu': 'viu.com', 'iqiyi': 'iq.com', 'amazon': 'primevideo.com', 'prime': 'primevideo.com',
    'hbo': 'hbogoasia.id', 'wetv': 'wetv.vip', 'we tv': 'wetv.vip',
    'vidio': 'vidio.com', 'crunchyroll': 'crunchyroll.com', 'loklok': 'loklok.com', 'loktv': 'loklok.com',
    'gagaoolala': 'gagaoolala.com', 'dramabox': 'dramaboxapp.com', 'apple tv': 'tv.apple.com',
    
    'spotify': 'open.spotify.com', 'apple music': 'music.apple.com', 'apple': 'music.apple.com',
    
    'canva': 'canva.com', 'capcut': 'capcut.com', 'alight motion': 'alightcreative.com', 'alight': 'alightcreative.com',
    
    'chatgpt': 'openai.com', 'claude': 'anthropic.com', 'grok': 'x.ai', 'grokai': 'x.ai', 
    'ms365': 'office.com', 'microsoft': 'microsoft.com', 'turnitin': 'turnitin.com', 
    'cek turnitin': 'turnitin.com', 'cek ai': 'zerogpt.com'
};

function getAppCategory(appName) {
    const nameLow = appName.toLowerCase();
    for (const [key, value] of Object.entries(appCategoryMap)) {
        if (nameLow.includes(key)) return value;
    }
    return 'lainnya'; 
}

function getLogoUrl(appName) {
    const nameLow = appName.toLowerCase();
    for (const [key, domain] of Object.entries(logoMap)) {
        if (nameLow.includes(key)) {
            return `https://www.google.com/s2/favicons?sz=64&domain=${domain}`;
        }
    }
    return '';
}

function parseCSVLine(row) {
    const cols = [];
    let current = '';
    let inQuotes = false;
    for (let i = 0; i < row.length; i++) {
        const char = row[i];
        if (char === '"') { inQuotes = !inQuotes; } 
        else if (char === ',' && !inQuotes) {
            cols.push(current.trim().replace(/^"|"$/g, ''));
            current = '';
        } else { current += char; }
    }
    cols.push(current.trim().replace(/^"|"$/g, ''));
    return cols;
}

async function loadPricelist() {
    try {
        const response = await fetch(csvFileName + '&t=' + new Date().getTime());
        if (!response.ok) throw new Error("File tidak ditemukan");
        
        const data = await response.text();
        const rows = data.split(/\r?\n/).slice(1); 
        const apps = {};

        rows.forEach(row => {
            if (!row.trim()) return;
            const cols = parseCSVLine(row);
            if (cols.length < 4) return;

            const appName = cols[0];
            const category = cols[1]; 
            const duration = cols[2]; 
            const price = cols[3];    
            const notes = cols.length > 4 ? cols[4] : '';
            const available = cols.length > 5 && cols[5].trim() !== '' ? cols[5].trim().toLowerCase() : 'ready';

            if (!apps[appName]) { apps[appName] = { categories: {} }; }
            if (!apps[appName].categories[category]) { apps[appName].categories[category] = []; }
            
            const itemNotes = (notes && notes.toLowerCase() !== 'nan') ? notes : '';
            apps[appName].categories[category].push({ duration, price, notes: itemNotes, available });
        });

        allApps = apps;
        applyFilters();
        document.getElementById('statusMessage').style.display = 'none';
        updateCartUI();

    } catch (error) {
        document.getElementById('statusMessage').innerHTML = `<p class="text-red-500 text-sm font-bold bg-red-50 p-4 rounded-xl border border-red-200">Gagal memuat data dari Spreadsheet.</p>`;
    }
}

function switchCategory(cat) {
    currentCategory = cat;
    const categories = ['all', 'streaming', 'music', 'editing', 'study'];
    categories.forEach(c => {
        const btn = document.getElementById(`cat-${c}`);
        if (!btn) return;
        btn.className = (c === cat) ? 
          "w-full py-2.5 md:py-3 rounded-xl border border-pink-400 bg-pink-400 text-[10px] md:text-xs font-bold text-white shadow-lg shadow-pink-200 transition-all outline-none" :
          "w-full py-2.5 md:py-3 rounded-xl border border-pink-200 bg-white text-[10px] md:text-xs font-bold text-pink-400 hover:bg-pink-50 transition-all outline-none";
    });
    
    applyFilters();

    // Fitur scroll otomatis ke grid aplikasi dengan animasi smooth
    const gridElement = document.getElementById('pricingGrid');
    if(gridElement) {
        // -80 adalah offset agar tidak tertutup header
        const y = gridElement.getBoundingClientRect().top + window.pageYOffset - 80;
        window.scrollTo({top: y, behavior: 'smooth'});
    }
}

function applyFilters() {
    const searchTerm = document.getElementById('searchInput').value.toLowerCase().trim();
    const filteredApps = {};
    let hasVisibleCards = false;

    for (const [name, info] of Object.entries(allApps)) {
        const matchesSearch = name.toLowerCase().includes(searchTerm);
        const appCat = getAppCategory(name);
        const matchesCategory = (currentCategory === 'all' || appCat === currentCategory);
        
        if (matchesSearch && matchesCategory) {
            filteredApps[name] = info;
            hasVisibleCards = true;
        }
    }
    renderCards(filteredApps);
    document.getElementById('noResults').style.display = (!hasVisibleCards) ? 'block' : 'none';
}

function renderCards(apps) {
    const grid = document.getElementById('pricingGrid');
    const noResults = document.getElementById('noResults');
    grid.innerHTML = '';
    grid.appendChild(noResults);

    let delay = 0;
    for (const [name, info] of Object.entries(apps)) {
        // Cari harga terendah untuk tulisan "Mulai Dari"
        let minPrice = Infinity;
        let totalPackages = 0;

        for (const [categoryName, items] of Object.entries(info.categories)) {
            items.forEach(item => {
                totalPackages++;
                const pVal = extractNumK(item.price);
                if(pVal > 0 && pVal < minPrice) minPrice = pVal;
            });
        }
        const displayPrice = minPrice !== Infinity ? minPrice + 'K' : '-';

        const logoUrl = getLogoUrl(name);
        // Ukuran logo dikecilkan untuk HP
        let logoHTML = logoUrl ? `<img src="${logoUrl}" class="w-8 h-8 md:w-12 md:h-12 rounded-lg md:rounded-xl object-cover bg-white p-0.5 border border-pink-200 shadow-sm" alt="${name}">` : `
                <div class="w-8 h-8 md:w-12 md:h-12 rounded-lg md:rounded-xl bg-pink-50 border border-pink-200 flex items-center justify-center text-pink-400 shadow-sm">
                    <svg class="w-5 h-5 md:w-6 md:h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 18h.01M8 21h8a2 2 0 002-2V5a2 2 0 00-2-2H8a2 2 0 00-2 2v14a2 2 0 002 2z"></path></svg>
                </div>`;

        const safeName = name.replace(/'/g, "\\'");
        const categoryBadge = getAppCategory(name);
        
        // Tombol info khusus untuk Netflix, dipindah ke pojok kanan atas kartu
        const isNetflix = name.toLowerCase().includes('netflix');
        const infoBtnHTML = isNetflix ? `
            <button onclick="openInfoNetflixModal(); event.stopPropagation();" class="absolute top-2 right-2 md:top-3 md:right-3 w-5 h-5 md:w-6 md:h-6 flex items-center justify-center rounded-full bg-pink-100 text-pink-500 hover:bg-pink-200 transition-colors outline-none shadow-sm z-20" title="Info Tambahan">
                <span class="font-black text-[10px] md:text-xs">i</span>
            </button>
        ` : '';

        const card = document.createElement('div');
        // Desain disesuaikan dengan tema Ciccu (White/Pink)
        card.className = 'group flex flex-col bg-white/90 backdrop-blur-sm border border-pink-200 rounded-2xl md:rounded-3xl p-3 md:p-5 shadow-lg shadow-pink-100/50 transition-all duration-300 hover:-translate-y-1 md:hover:-translate-y-2 hover:border-pink-300 hover:shadow-xl hover:shadow-pink-200/50 fade-in-down relative overflow-hidden';
        card.style.animationDelay = `${delay}s`;
        
        card.innerHTML = `
            <div class="absolute -top-10 -right-10 w-24 h-24 bg-pink-300/10 rounded-full blur-2xl group-hover:bg-pink-300/20 transition-all"></div>
            ${infoBtnHTML}
            
            <div class="relative z-10 flex items-start justify-between mb-2 md:mb-4">
                ${logoHTML}
                <span class="text-[8px] md:text-[9px] font-black uppercase tracking-widest text-pink-500 bg-pink-50 px-1.5 py-0.5 md:px-2.5 md:py-1 rounded border border-pink-100">${categoryBadge}</span>
            </div>

            <div class="relative z-10 mb-3 md:mb-4 flex-1">
                <h2 class="text-sm md:text-xl font-black text-pink-600 capitalize tracking-tight group-hover:text-pink-500 transition-all truncate pr-4">${name}</h2>
                <div class="mt-2 md:mt-4 flex items-end gap-1">
                    <span class="text-[10px] md:text-xs text-gray-500 font-bold pb-0.5 md:pb-1">Mulai</span>
                    <span class="text-lg md:text-2xl font-black text-gray-800 leading-none">${displayPrice}</span>
                </div>
                <p class="text-[9px] md:text-[11px] text-gray-400 mt-1 md:mt-2 font-bold flex items-center gap-1">
                    <svg class="w-3 h-3 md:w-3.5 md:h-3.5 text-pink-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>
                    ${totalPackages} Paket
                </p>
            </div>

            <div class="relative z-10 mt-auto pt-2 md:pt-4 border-t border-pink-100">
                <button onclick="openOrderModal('${safeName}')" class="w-full flex items-center justify-center gap-1.5 md:gap-2 py-2 md:py-3 bg-pink-50 text-pink-500 text-[10px] md:text-sm font-black rounded-lg md:rounded-xl hover:bg-pink-400 hover:text-white transition-all outline-none border border-pink-200 hover:border-pink-400 shadow-sm">
                    Pilih 𓏲ּ𝄢
                    <svg class="w-3 h-3 md:w-4 md:h-4 transition-transform group-hover:translate-x-1" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M14 5l7 7m0 0l-7 7m7-7H3"></path></svg>
                </button>
            </div>
        `;
        grid.appendChild(card);
        delay += 0.04;
    }
}

let cart = []; 
let currentOrderApp = '';
let selectedPackage = null;
let orderQty = 1;

function openOrderModal(appName) {
    currentOrderApp = appName;
    selectedPackage = null;
    orderQty = 1;
    
    document.getElementById('modalAppNameTitle').innerText = appName;
    document.getElementById('qtyDisplay').innerText = orderQty;
    document.getElementById('qtyControl').classList.add('hidden');
    
    const info = allApps[appName];
    const list = document.getElementById('modalPackagesList');
    list.innerHTML = '';
    
    let html = '';
    Object.entries(info.categories).forEach(([cat, items]) => {
        items.forEach((item, index) => {
            const pkgId = `pkg-${cat.replace(/[^a-zA-Z0-9]/g, '-')}-${index}`;
            
            const isSold = item.available === 'sold';
            
            let modalNoteHTML = '';
            if (item.notes) {
                modalNoteHTML = `<p class="text-[10px] text-pink-400 italic mt-1 leading-tight flex gap-1"><span class="text-pink-300">↳</span> ${item.notes}</p>`;
            }

            const soldBadge = isSold ? `<span class="bg-red-100 text-red-500 text-[9px] px-2 py-0.5 rounded-full font-black uppercase tracking-wider ml-2 border border-red-200">Habis</span>` : '';

            const containerClass = isSold 
                ? `border border-gray-200 bg-gray-50 p-4 rounded-xl cursor-not-allowed opacity-75 flex justify-between items-center select-none` 
                : `package-option border border-pink-200 bg-white p-4 rounded-xl cursor-pointer hover:border-pink-400 transition-all flex justify-between items-center group`;
                
            const onClickAttr = isSold ? '' : `onclick="selectPackage('${pkgId}', '${cat}', '${item.duration}', '${item.price}')"`;
            const checkIndicatorClass = isSold ? 'border-gray-200 bg-gray-200' : 'border-gray-300 bg-white check-indicator transition-colors';

            html += `
                <div id="${pkgId}" ${onClickAttr} class="${containerClass}">
                    <div class="flex-1 pr-3">
                        <div class="flex items-center">
                            <p class="text-[11px] text-pink-400 font-bold uppercase tracking-widest mb-1">${cat}</p>
                            ${soldBadge}
                        </div>
                        <p class="text-sm font-bold ${isSold ? 'text-gray-400 line-through' : 'text-gray-600 group-hover:text-gray-800'} transition-colors">${item.duration}</p>
                        ${modalNoteHTML}
                    </div>
                    <div class="flex items-center gap-3">
                        <p class="font-bold ${isSold ? 'text-gray-400' : 'text-pink-600'} text-lg">${item.price}</p>
                        <div class="w-5 h-5 rounded-full border-2 flex items-center justify-center flex-shrink-0 ${checkIndicatorClass}"></div>
                    </div>
                </div>
            `;
        });
    });
    list.innerHTML = html;
    
    const btn = document.getElementById('btnProcessOrder');
    btn.disabled = true;
    btn.className = "w-full py-3.5 bg-pink-100 text-pink-500 cursor-not-allowed font-bold rounded-xl transition shadow-sm outline-none flex justify-center items-center gap-2";
    btn.innerHTML = "Pilih Paket Dulu 𓏲ּ𝄢";

    const modal = document.getElementById('orderModal');
    const backdrop = document.getElementById('orderModalBackdrop');
    const content = document.getElementById('orderModalContent');
    modal.classList.remove('hidden');
    setTimeout(() => { backdrop.classList.replace('opacity-0', 'opacity-100'); content.classList.replace('opacity-0', 'opacity-100'); content.classList.replace('scale-95', 'scale-100'); }, 10);
}

function selectPackage(pkgId, cat, dur, price) {
    selectedPackage = { app: currentOrderApp, cat, dur, price };
    
    document.querySelectorAll('.package-option').forEach(el => {
        el.classList.remove('border-pink-400', 'bg-pink-50');
        el.classList.add('border-pink-200', 'bg-white');
        const check = el.querySelector('.check-indicator');
        if (check) {
            check.innerHTML = '';
            check.classList.replace('border-pink-500', 'border-gray-300');
            check.classList.remove('bg-pink-500');
            check.classList.add('bg-white');
        }
    });

    const selectedEl = document.getElementById(pkgId);
    selectedEl.classList.remove('border-pink-200', 'bg-white');
    selectedEl.classList.add('border-pink-400', 'bg-pink-50');
    
    const check = selectedEl.querySelector('.check-indicator');
    check.classList.replace('border-gray-300', 'border-pink-500');
    check.classList.remove('bg-white');
    check.classList.add('bg-pink-500');
    check.innerHTML = '<svg class="w-3 h-3 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="3" d="M5 13l4 4L19 7"></path></svg>';

    document.getElementById('qtyControl').classList.remove('hidden');
    updateAddBtn();
}

function changeQty(delta) {
    if(!selectedPackage) return;
    let newQty = orderQty + delta;
    if(newQty < 1) newQty = 1;
    if(newQty > 100) newQty = 100;
    orderQty = newQty;
    document.getElementById('qtyDisplay').innerText = orderQty;
    updateAddBtn();
}

function extractNumK(priceStr) {
    return parseInt(priceStr.replace(/[^0-9]/g, '')) || 0;
}

function updateAddBtn() {
    const btn = document.getElementById('btnProcessOrder');
    const total = extractNumK(selectedPackage.price) * orderQty;
    
    btn.disabled = false;
    btn.className = "w-full py-3.5 bg-pink-400 hover:bg-pink-500 text-white font-bold rounded-xl transition shadow-md shadow-pink-200 outline-none flex justify-center items-center gap-2";
    btn.innerHTML = `
        <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z"></path></svg>
        Tambah ke Keranjang (${total}K) 🛍️
    `;
}

function closeOrderModal() {
    const modal = document.getElementById('orderModal');
    const backdrop = document.getElementById('orderModalBackdrop');
    const content = document.getElementById('orderModalContent');
    backdrop.classList.replace('opacity-100', 'opacity-0'); content.classList.replace('opacity-100', 'opacity-0'); content.classList.replace('scale-100', 'scale-95');
    setTimeout(() => { modal.classList.add('hidden'); }, 300);
}

function addToCart() {
    if(!selectedPackage) return;
    const existIndex = cart.findIndex(item => 
        item.app === selectedPackage.app && 
        item.cat === selectedPackage.cat && 
        item.dur === selectedPackage.dur
    );

    if(existIndex !== -1) {
        cart[existIndex].qty += orderQty;
    } else {
        cart.push({ ...selectedPackage, qty: orderQty });
    }

    updateCartUI();
    closeOrderModal();
    showToast();
}

function updateCartUI() {
    const count = cart.reduce((sum, item) => sum + item.qty, 0);
    const fab = document.getElementById('floatingCartBtn');
    const badgeFloat = document.getElementById('cartBadgeFloating');
    
    badgeFloat.innerText = count;
    
    if(count > 0) { 
        fab.classList.remove('translate-y-32', 'opacity-0', 'pointer-events-none'); 
    } else { 
        fab.classList.add('translate-y-32', 'opacity-0', 'pointer-events-none'); 
    }
}

function showToast() {
    const toast = document.getElementById('toastNotif');
    toast.classList.replace('opacity-0', 'opacity-100');
    toast.classList.replace('translate-y-10', 'translate-y-0');
    setTimeout(() => {
        toast.classList.replace('opacity-100', 'opacity-0');
        toast.classList.replace('translate-y-0', 'translate-y-10');
    }, 2500);
}

function openCartModal() {
    renderCartList();
    const modal = document.getElementById('cartModal');
    const backdrop = document.getElementById('cartModalBackdrop');
    const content = document.getElementById('cartModalContent');
    modal.classList.remove('hidden');
    setTimeout(() => { backdrop.classList.replace('opacity-0', 'opacity-100'); content.classList.replace('opacity-0', 'opacity-100'); content.classList.replace('scale-95', 'scale-100'); }, 10);
}

function closeCartModal() {
    const modal = document.getElementById('cartModal');
    const backdrop = document.getElementById('cartModalBackdrop');
    const content = document.getElementById('cartModalContent');
    backdrop.classList.replace('opacity-100', 'opacity-0'); content.classList.replace('opacity-100', 'opacity-0'); content.classList.replace('scale-100', 'scale-95');
    setTimeout(() => { modal.classList.add('hidden'); }, 300);
}

function renderCartList() {
    const list = document.getElementById('cartItemsList');
    const btnCheckout = document.getElementById('btnCheckoutWA');
    
    if(cart.length === 0) {
        list.innerHTML = `<div class="text-center py-10 text-pink-400 text-sm font-medium">Keranjang masih kosong nih kak... 🌸</div>`;
        document.getElementById('cartGrandTotal').innerText = '0K';
        btnCheckout.disabled = true;
        btnCheckout.classList.replace('from-green-400', 'from-gray-300');
        btnCheckout.classList.replace('to-green-500', 'to-gray-400');
        btnCheckout.classList.add('opacity-50', 'cursor-not-allowed', 'shadow-none');
        return;
    }

    btnCheckout.disabled = false;
    btnCheckout.classList.replace('from-gray-300', 'from-green-400');
    btnCheckout.classList.replace('to-gray-400', 'to-green-500');
    btnCheckout.classList.remove('opacity-50', 'cursor-not-allowed', 'shadow-none');

    let html = '';
    let grandTotalK = 0;

    cart.forEach((item, index) => {
        const itemTotalK = extractNumK(item.price) * item.qty;
        grandTotalK += itemTotalK;

        html += `
            <div class="flex justify-between items-center bg-pink-50 p-4 rounded-xl border border-pink-200 mb-3">
                <div class="flex-1">
                    <h4 class="text-gray-800 font-bold text-sm mb-1">${item.app} <span class="text-xs font-normal text-gray-500">(${item.dur})</span></h4>
                    <p class="text-[10px] text-pink-400 uppercase font-bold tracking-wider mb-2">${item.cat}</p>
                    <div class="flex items-center gap-4 text-xs font-medium text-gray-500">
                        <span>Harga: ${item.price}</span>
                        <span>Jumlah: x${item.qty}</span>
                    </div>
                </div>
                <div class="flex flex-col items-end gap-2 pl-3 border-l border-pink-200">
                    <button onclick="removeFromCart(${index})" class="text-pink-300 hover:text-red-500 transition p-1 outline-none">
                        <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"></path></svg>
                    </button>
                    <p class="text-gray-800 font-black">${itemTotalK}K</p>
                </div>
            </div>
        `;
    });

    list.innerHTML = html;
    document.getElementById('cartGrandTotal').innerText = grandTotalK + 'K';
}

function removeFromCart(index) {
    cart.splice(index, 1);
    updateCartUI();
    renderCartList();
    
    if(cart.length === 0) {
        setTimeout(() => { closeCartModal(); }, 500);
    }
}

function checkoutCartWA() {
    if(cart.length === 0) return;

    let textWA = "୨ ⁺ ૮₍˶ᵔ ᵕ ᵔ˶₎ა  haloo, aku mau jajan ini! ౿ \n\n";
    let grandTotal = 0;

    cart.forEach((item) => {
        const subTotal = extractNumK(item.price) * item.qty;
        grandTotal += subTotal;
        
        textWA += `𖠗  ⊹  ☆̲  ${item.app} — ${item.dur}\n`;
        textWA += `⊹ ꒰ 𓈒 ♡ ——— paket :  ${item.cat}\n`;
        textWA += `⊹ ꒰ 𓈒 ♡ ——— total   :  ${item.qty} pcs\n\n`;
    });

    textWA += `ఌ︎. 𓈄 total order : IDR ${grandTotal}K ⸝⸝ 𓇼 ఌ︎. ⟡ \n\n`;
    textWA += ` ⑅ ౿ bisa bantu untuk prosesnya kak?  ♡ ๑ .. thank you  ౿ ⊹ (. .*)β have a sweet day  𖠗\n\n`;
    textWA += `https://ciccu.biz.id/qris`;
    
    const encodedText = encodeURIComponent(textWA);
    window.open(`https://wa.me/6283877337798?text=${encodedText}`, '_blank');
}

function openLoyaltyModal() {
    const modal = document.getElementById('loyaltyModal');
    const backdrop = document.getElementById('loyaltyModalBackdrop');
    const content = document.getElementById('loyaltyModalContent');
    modal.classList.remove('hidden');
    setTimeout(() => {
        backdrop.classList.replace('opacity-0', 'opacity-100');
        content.classList.replace('opacity-0', 'opacity-100');
        content.classList.replace('scale-95', 'scale-100');
    }, 10);
}

function closeLoyaltyModal() {
    const modal = document.getElementById('loyaltyModal');
    const backdrop = document.getElementById('loyaltyModalBackdrop');
    const content = document.getElementById('loyaltyModalContent');
    backdrop.classList.replace('opacity-100', 'opacity-0');
    content.classList.replace('opacity-100', 'opacity-0');
    content.classList.replace('scale-100', 'scale-95');
    setTimeout(() => { modal.classList.add('hidden'); }, 300);
}

function openTermsModal() {
    const modal = document.getElementById('termsModal');
    const backdrop = document.getElementById('termsModalBackdrop');
    const content = document.getElementById('termsModalContent');
    modal.classList.remove('hidden');
    setTimeout(() => {
        backdrop.classList.replace('opacity-0', 'opacity-100');
        content.classList.replace('opacity-0', 'opacity-100');
        content.classList.replace('scale-95', 'scale-100');
    }, 10);
}

function closeTermsModal() {
    const modal = document.getElementById('termsModal');
    const backdrop = document.getElementById('termsModalBackdrop');
    const content = document.getElementById('termsModalContent');
    backdrop.classList.replace('opacity-100', 'opacity-0');
    content.classList.replace('opacity-100', 'opacity-0');
    content.classList.replace('scale-100', 'scale-95');
    setTimeout(() => { modal.classList.add('hidden'); }, 300);
}

function openInfoNetflixModal() {
    const modal = document.getElementById('infoNetflixModal');
    const backdrop = document.getElementById('infoNetflixBackdrop');
    const content = document.getElementById('infoNetflixContent');
    modal.classList.remove('hidden');
    setTimeout(() => {
        backdrop.classList.replace('opacity-0', 'opacity-100');
        content.classList.replace('opacity-0', 'opacity-100');
        content.classList.replace('scale-95', 'scale-100');
    }, 10);
}

function closeInfoNetflixModal() {
    const modal = document.getElementById('infoNetflixModal');
    const backdrop = document.getElementById('infoNetflixBackdrop');
    const content = document.getElementById('infoNetflixContent');
    backdrop.classList.replace('opacity-100', 'opacity-0');
    content.classList.replace('opacity-100', 'opacity-0');
    content.classList.replace('scale-100', 'scale-95');
    setTimeout(() => { modal.classList.add('hidden'); }, 300);
}

loadPricelist();
