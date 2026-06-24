const API_URL = "";
const BASE_URL = API_URL.endsWith('/') ? API_URL.slice(0, -1) : API_URL;

let allApps = {};
let orderedAppNames = []; 
let currentCategory = 'all';
let appForms = {}; 

let cart = []; 
let currentOrderApp = '';
let isSummaryExpanded = false; 

// PETA KATEGORI CICCU
const appCategoryMap = {
    'netflix': 'streaming',
    'disney': 'streaming',
    'youtube': 'streaming',
    'viu': 'streaming',
    'iqiyi': 'streaming',
    'prime': 'streaming',
    'amazon': 'streaming',
    'hbo': 'streaming',
    'wetv': 'streaming',
    'we tv': 'streaming',
    'vidio': 'streaming',
    'crunchyroll': 'streaming',
    'loklok': 'streaming',
    'loktv': 'streaming',
    'gagaoolala': 'streaming',
    'dramabox': 'streaming',
    'apple tv': 'streaming',
    'bstation': 'streaming',
    'viki plus': 'streaming',
    'drakor id': 'streaming',
    'mango tv': 'streaming',

    'spotify': 'music',
    'apple music': 'music',
    'apple': 'music',

    'capcut': 'editing',
    'canva': 'editing',
    'alight motion': 'editing',
    'alight': 'editing',

    'turnitin': 'study',
    'cek turnitin': 'study',
    'cek ai': 'study',
    'chatgpt': 'study',
    'claude': 'study',
    'grok': 'study',
    'grokai': 'study',
    'ms365': 'study',
    'microsoft': 'study',
    'duolingo': 'study',
};

const logoMap = {
    'netflix': 'netflix.com',
    'disney': 'disneyplus.com',
    'youtube': 'youtube.com',
    'viu': 'viu.com',
    'iqiyi': 'iq.com',
    'amazon': 'primevideo.com',
    'prime': 'primevideo.com',
    'hbo': 'hbogoasia.id',
    'wetv': 'wetv.vip',
    'we tv': 'wetv.vip',
    'vidio': 'vidio.com',
    'crunchyroll': 'crunchyroll.com',
    'loklok': 'loklok.com',
    'loktv': 'loklok.com',
    'gagaoolala': 'gagaoolala.com',
    'dramabox': 'dramaboxapp.com',
    'apple tv': 'tv.apple.com',
    'bstation': 'bilibili.tv',
    'viki plus': 'viki.com',
    'drakor id': 'drakorid.co',
    'mango tv': 'mgtv.com',

    'spotify': 'open.spotify.com',
    'apple music': 'music.apple.com',
    'apple': 'music.apple.com',

    'canva': 'canva.com',
    'capcut': 'capcut.com',
    'alight motion': 'alightcreative.com',
    'alight': 'alightcreative.com',

    'chatgpt': 'openai.com',
    'claude': 'anthropic.com',
    'grok': 'x.ai',
    'grokai': 'x.ai',
    'ms365': 'office.com',
    'microsoft': 'microsoft.com',
    'turnitin': 'turnitin.com',
    'cek turnitin': 'turnitin.com',
    'cek ai': 'zerogpt.com',
    'duolingo': 'https://upload.wikimedia.org/wikipedia/commons/1/15/Duolingo_logo.svg',
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
            // Jika domain diawali 'http', gunakan link gambar langsung
            if (domain.startsWith('http')) {
                return domain;
            }
            // Jika tidak, gunakan sistem otomatis Google
            return `https://www.google.com/s2/favicons?sz=64&domain=${domain}`;
        }
    }
    return '';
}

function extractNumK(priceStr) {
    return parseInt(priceStr.replace(/[^0-9]/g, '')) || 0;
}

// --- AMBIL DATA DARI SERVER ---
async function loadPricelist() {
    try {
        const response = await fetch(`${BASE_URL}/api/pricelist?t=${new Date().getTime()}`, {
            cache: 'no-store'
        });
        if (!response.ok) throw new Error("Gagal mengambil data");
        
        let data = await response.json();
        
        data.sort((a, b) => {
            const aApp = (a.app_sort_order && a.app_sort_order > 0) ? a.app_sort_order : 9999;
            const bApp = (b.app_sort_order && b.app_sort_order > 0) ? b.app_sort_order : 9999;
            const aPkg = (a.sort_order && a.sort_order > 0) ? a.sort_order : 9999;
            const bPkg = (b.sort_order && b.sort_order > 0) ? b.sort_order : 9999;
            return (aApp - bApp) || (aPkg - bPkg) || (a.id - b.id);
        });

        const apps = {};
        const appMinOrder = {}; 
        const appFirstId = {};

        data.forEach(item => {
            const appName = item.app_name;
            const category = item.category; 
            const duration = item.duration; 
            const price = item.price;    
            const notes = item.notes || ''; 
            const status = item.status || 'Ready';

            const appOrderVal = (item.app_sort_order && item.app_sort_order > 0) ? item.app_sort_order : 9999;

            if (!apps[appName]) { 
                apps[appName] = { packages: [] }; 
                appMinOrder[appName] = appOrderVal; 
                appFirstId[appName] = item.id;
            } else {
                if (appOrderVal < appMinOrder[appName]) appMinOrder[appName] = appOrderVal;
                if (item.id < appFirstId[appName]) appFirstId[appName] = item.id;
            }
            
            apps[appName].packages.push({ category, duration, price, notes, status, id: item.id });
        });

        allApps = apps;
        orderedAppNames = Object.keys(apps);
        
        orderedAppNames.sort((a, b) => (appMinOrder[a] - appMinOrder[b]) || (appFirstId[a] - appFirstId[b]));

        try {
            const formRes = await fetch(`${BASE_URL}/api/forms?t=${new Date().getTime()}`, { cache: 'no-store' });
            if (formRes.ok) {
                const formsData = await formRes.json();
                appForms = {};
                formsData.forEach(f => {
                    appForms[f.app_name.toLowerCase().trim()] = f.form_fields;
                });
            }
        } catch (err) {
            console.error("Gagal memuat form:", err);
        }
        
        applyFilters();
        document.getElementById('statusMessage').style.display = 'none';

    } catch (error) {
        document.getElementById('statusMessage').innerHTML = `<p class="text-red-500 text-sm font-bold bg-red-50 p-4 rounded-xl border border-red-200 shadow-sm">Gagal terhubung ke database. Coba muat ulang. 🥺</p>`;
    }
}

// --- FITUR DEBOUNCE UNTUK PENCARIAN (Mencegah Lag) ---
let searchTimeout;

function debouncedSearch() {
    clearTimeout(searchTimeout);
    searchTimeout = setTimeout(() => {
        applyFilters();
    }, 300);
}

// --- FILTER & RENDER HOMEPAGE ---
function switchCategory(cat) {
    currentCategory = cat;
    const categories = ['all', 'streaming', 'music', 'editing', 'study'];
    
    categories.forEach(c => {
        const btn = document.getElementById(`cat-${c}`);
        if (!btn) return;
        
        if (c === cat) {
            btn.className = "w-full py-2.5 md:py-3 rounded-xl border border-pink-400 bg-pink-400 text-[10px] md:text-xs font-bold text-white shadow-lg shadow-pink-200 transition-all outline-none";
        } else {
            btn.className = "w-full py-2.5 md:py-3 rounded-xl border border-pink-200 bg-white text-[10px] md:text-xs font-bold text-pink-400 hover:bg-pink-50 transition-all outline-none";
        }
    });
    
    applyFilters();
}

function applyFilters() {
    const searchTerm = document.getElementById('searchInput').value.toLowerCase().trim();
    const filteredApps = {};
    const filteredOrder = []; 
    let hasVisibleCards = false;

    orderedAppNames.forEach(name => {
        const info = allApps[name];
        const matchesSearch = name.toLowerCase().includes(searchTerm);
        const appCat = getAppCategory(name);
        const matchesCategory = (currentCategory === 'all' || appCat === currentCategory);
        
        if (matchesSearch && matchesCategory && info.packages.length > 0) {
            filteredApps[name] = info;
            filteredOrder.push(name);
            hasVisibleCards = true;
        }
    });
    
    renderCards(filteredApps, filteredOrder);
    document.getElementById('noResults').style.display = (!hasVisibleCards) ? 'block' : 'none';
}

function renderCards(apps, orderedNames) {
    const grid = document.getElementById('pricingGrid');
    const noResults = document.getElementById('noResults');
    grid.innerHTML = '';
    grid.appendChild(noResults);

    let delay = 0;
    orderedNames.forEach(name => {
        const info = apps[name];
        let minPrice = Infinity;
        let totalPackages = info.packages.length; 

        info.packages.forEach(item => {
            const pVal = extractNumK(item.price);
            if(pVal > 0 && pVal < minPrice) minPrice = pVal;
        });
        
        const displayPrice = minPrice !== Infinity ? minPrice + 'K' : '-';

        const logoUrl = getLogoUrl(name);
                let logoHTML = logoUrl ? `<img src="${logoUrl}" loading="lazy" class="w-8 h-8 md:w-12 md:h-12 rounded-lg md:rounded-xl object-cover bg-white p-0.5 border border-pink-200 shadow-sm" alt="${name}">` : `
                <div class="w-8 h-8 md:w-12 md:h-12 rounded-lg md:rounded-xl bg-pink-50 border border-pink-200 flex items-center justify-center text-pink-400 shadow-sm">
                    <svg class="w-5 h-5 md:w-6 md:h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 18h.01M8 21h8a2 2 0 002-2V5a2 2 0 00-2-2H8a2 2 0 00-2 2v14a2 2 0 002 2z"></path></svg>
                </div>`;

        const safeName = name.replace(/'/g, "\\'");
        const categoryBadge = getAppCategory(name);
        
        const isNetflix = name.toLowerCase().includes('netflix');
        const infoBtnHTML = isNetflix ? `
            <button onclick="openInfoNetflixModal(); event.stopPropagation();" class="absolute top-2 right-2 md:top-3 md:right-3 w-5 h-5 md:w-6 md:h-6 flex items-center justify-center rounded-full bg-pink-100 text-pink-500 hover:bg-pink-200 transition-colors outline-none shadow-sm z-20" title="Info Tambahan">
                <span class="font-black text-[10px] md:text-xs">i</span>
            </button>
        ` : '';

        const card = document.createElement('div');
        card.className = 'group flex flex-col bg-white border border-pink-200 rounded-2xl md:rounded-3xl p-3 md:p-5 shadow-sm transition-transform duration-300 hover:-translate-y-1 md:hover:-translate-y-2 hover:border-pink-300 hover:shadow-md fade-in-down relative overflow-hidden cursor-pointer';
        card.style.animationDelay = `${delay}s`;
        card.onclick = () => openOrderModal(safeName); 
        
        card.innerHTML = `
            ${infoBtnHTML}
            <div class="relative z-10 flex items-start justify-between mb-2 md:mb-4">
                ${logoHTML}
                <span class="text-[8px] md:text-[9px] font-black uppercase tracking-widest text-pink-500 bg-pink-50 px-1.5 py-0.5 md:px-2.5 md:py-1 rounded border border-pink-100">${categoryBadge}</span>
            </div>
            <div class="relative z-10 mb-2 md:mb-3 flex-1">
                <h2 class="text-sm md:text-xl font-black text-pink-600 capitalize tracking-tight group-hover:text-pink-400 transition-all truncate pr-4">${name}</h2>
                <div class="mt-2 md:mt-4 flex items-end gap-1">
                    <span class="text-[10px] md:text-xs text-gray-500 font-bold pb-0.5 md:pb-1">Mulai</span>
                    <span class="text-lg md:text-2xl font-black text-gray-800 leading-none">${displayPrice}</span>
                </div>
            </div>
            <div class="relative z-10 mt-auto pt-2 md:pt-4 border-t border-pink-100 flex items-center justify-between text-gray-400 group-hover:text-pink-500 transition-colors">
                <p class="text-[9px] md:text-[11px] font-bold flex items-center gap-1">
                    <svg class="w-3 h-3 md:w-3.5 md:h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>
                    ${totalPackages} Paket
                </p>
                <div class="bg-pink-50 p-1 md:p-1.5 rounded-lg border border-pink-100 group-hover:bg-pink-400 group-hover:text-white transition-all shadow-sm">
                    <svg class="w-3 h-3 md:w-4 md:h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4"></path></svg>
                </div>
            </div>
        `;
        grid.appendChild(card);
        delay += 0.04;
    });
}

// --- SISTEM ORDER & CART ---
function openOrderModal(appName) {
    currentOrderApp = appName;
    document.getElementById('modalAppNameTitle').innerText = appName;
    
    const logoUrl = getLogoUrl(appName);
    document.getElementById('modalAppLogo').innerHTML = logoUrl ? `<img src="${logoUrl}" class="w-full h-full object-cover">` : `<span class="text-[10px] font-black text-pink-500">${appName.charAt(0)}</span>`;

    const info = allApps[appName];
    const list = document.getElementById('modalPackagesList');
    
    let html = `<div class="bg-white rounded-2xl border border-pink-200 overflow-hidden shadow-sm flex flex-col divide-y divide-pink-100">`;
    
    info.packages.forEach((item, index) => {
        const cat = item.category;
        const pkgId = `pkg-${cat.replace(/[^a-zA-Z0-9]/g, '-')}-${index}`;
        const noteHtml = item.notes && item.notes.toLowerCase() !== 'nan' 
            ? `<p class="text-[9px] text-pink-400 font-medium italic mt-1 flex items-center gap-1"><span class="text-pink-300 font-light">↳</span> ${item.notes}</p>` 
            : '';

        const isSold = item.status && item.status.toLowerCase() !== 'ready';

        const cartItem = cart.find(c => c.app === appName && c.cat === cat && c.dur === item.duration);
        const qty = cartItem ? cartItem.qty : 0;
        
        let activeClass = 'bg-transparent';
        let activeBorder = 'border-l-[4px] border-l-transparent';
        
        if (isSold) {
            activeClass = 'bg-gray-50 opacity-60 grayscale-[50%]';
        } else if (qty > 0) {
            activeClass = 'bg-pink-50';
            activeBorder = 'border-l-[4px] border-l-pink-400';
        }

        const hoverClass = isSold ? '' : 'hover:bg-pink-50/50';
        const soldBadge = isSold ? `<span class="bg-red-100 text-red-500 text-[8px] px-1.5 py-0.5 rounded font-black uppercase tracking-widest ml-2 border border-red-200">Habis</span>` : '';

        let actionButton = '';
        if (isSold) {
            actionButton = `<span class="text-[9px] font-bold text-red-400 bg-red-50 px-3 py-1.5 rounded-full border border-red-100">Kosong</span>`;
        } else {
            actionButton = getQuickAddButtonHTML(appName, cat, item.duration, item.price, pkgId, qty);
        }

        html += `
            <div id="row-${pkgId}" class="flex items-center justify-between p-3.5 md:p-4 transition-all duration-300 ${hoverClass} ${activeClass} ${activeBorder}">
                <div class="flex-1 pr-3 min-w-0">
                    <div class="flex items-center mb-0.5">
                        <p class="text-[9px] md:text-[10px] ${isSold ? 'text-gray-500' : 'text-pink-500'} font-black uppercase tracking-widest truncate">${cat}</p>
                        ${soldBadge}
                    </div>
                    <h4 class="text-xs md:text-sm font-bold ${isSold ? 'text-gray-500 line-through' : 'text-gray-700'} truncate">${item.duration}</h4>
                    ${noteHtml}
                </div>
                <div class="flex flex-col items-end gap-1.5 shrink-0">
                    <span class="font-black ${isSold ? 'text-gray-400' : 'text-pink-600'} text-xs md:text-sm">${item.price}</span>
                    <div id="btn-container-${pkgId}">
                        ${actionButton}
                    </div>
                </div>
            </div>
        `;
    });
    
    html += `</div>`;
    list.innerHTML = html;

    const modal = document.getElementById('orderModal');
    const backdrop = document.getElementById('orderModalBackdrop');
    const content = document.getElementById('orderModalContent');
    modal.classList.remove('hidden');
    setTimeout(() => { backdrop.classList.replace('opacity-0', 'opacity-100'); content.classList.replace('opacity-0', 'opacity-100'); content.classList.replace('scale-95', 'scale-100'); }, 10);
}

function closeOrderModal() {
    const modal = document.getElementById('orderModal');
    const backdrop = document.getElementById('orderModalBackdrop');
    const content = document.getElementById('orderModalContent');
    backdrop.classList.replace('opacity-100', 'opacity-0'); content.classList.replace('opacity-100', 'opacity-0'); content.classList.replace('scale-100', 'scale-95');
    setTimeout(() => { modal.classList.add('hidden'); }, 300);
}

function getQuickAddButtonHTML(appName, cat, dur, price, pkgId, qty) {
    const safeAppName = appName.replace(/'/g, "\\'");
    if (qty > 0) {
        return `
            <button onclick="quickAdd('${safeAppName}', '${cat}', '${dur}', '${price}', '${pkgId}')" class="bg-pink-400 text-white border border-pink-400 text-[10px] md:text-[11px] font-bold px-3 py-1.5 rounded-full transition-all flex items-center gap-1.5 shadow-md shadow-pink-200 outline-none transform active:scale-95">
                <svg class="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="3" d="M5 13l4 4L19 7"></path></svg> 
                ${qty} pcs
            </button>
        `;
    } else {
        return `
            <button onclick="quickAdd('${safeAppName}', '${cat}', '${dur}', '${price}', '${pkgId}')" class="bg-white hover:bg-pink-50 text-pink-400 border border-pink-200 text-[10px] md:text-[11px] font-bold px-3 py-1.5 rounded-full transition-all flex items-center gap-1 outline-none transform active:scale-95 shadow-sm">
                <svg class="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="3" d="M12 4v16m8-8H4"></path></svg> 
                Tambah
            </button>
        `;
    }
}

function quickAdd(appName, cat, dur, price, pkgId) {
    const existIndex = cart.findIndex(item => 
        item.app === appName && item.cat === cat && item.dur === dur
    );

    let newQty = 1;
    if (existIndex !== -1) {
        cart[existIndex].qty += 1;
        newQty = cart[existIndex].qty;
    } else {
        cart.push({ 
            app: appName, cat: cat, dur: dur, price: price, qty: 1, 
            separateForms: false, useFirstItemData: false, formData: [{}]
        });
    }

    const btnContainer = document.getElementById(`btn-container-${pkgId}`);
    if(btnContainer) {
        btnContainer.innerHTML = getQuickAddButtonHTML(appName, cat, dur, price, pkgId, newQty);
    }

    const row = document.getElementById(`row-${pkgId}`);
    if(row) {
        row.classList.remove('bg-transparent', 'border-l-transparent');
        row.classList.add('bg-pink-50', 'border-l-[4px]', 'border-l-pink-400');
    }

    updateInlineSummaryUI();
    showToast();
    triggerSummaryBounce();
}

// --- KERANJANG BAWAH (INLINE SUMMARY) ---
function updateInlineSummaryUI() {
    let count = 0;
    let totalK = 0;

    cart.forEach(item => {
        count += item.qty;
        totalK += extractNumK(item.price) * item.qty;
    });

    const panel = document.getElementById('inlineSummaryPanel');
    const badge = document.getElementById('summaryBadgeCount');
    const total = document.getElementById('summaryTotalK');

    badge.innerText = count;
    total.innerText = totalK + 'K';

    if (count > 0) {
        panel.classList.remove('translate-y-full'); 
        renderInlineSummaryList();
    } else {
        panel.classList.add('translate-y-full'); 
        isSummaryExpanded = false;
        document.getElementById('inlineSummaryList').classList.add('hidden');
        document.getElementById('summaryToggleIcon').innerHTML = `<svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="3" d="M5 15l7-7 7 7"></path></svg>`;
    }
}

function triggerSummaryBounce() {
    const iconContainer = document.getElementById('summaryIconContainer');
    iconContainer.classList.add('scale-125', 'ring-4', 'ring-pink-200');
    setTimeout(() => {
        iconContainer.classList.remove('scale-125', 'ring-4', 'ring-pink-200');
    }, 250);
}

function toggleSummaryList(e) {
    if(e && e.target.closest('button')) return; 

    isSummaryExpanded = !isSummaryExpanded;
    const list = document.getElementById('inlineSummaryList');
    const icon = document.getElementById('summaryToggleIcon');

    if (isSummaryExpanded) {
        list.classList.remove('hidden');
        list.classList.add('flex');
        icon.innerHTML = `<svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="3" d="M19 9l-7-7-7-7"></path></svg>`; 
    } else {
        list.classList.add('hidden');
        list.classList.remove('flex');
        icon.innerHTML = `<svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="3" d="M5 15l7-7 7 7"></path></svg>`; 
    }
}

function renderInlineSummaryList() {
    const list = document.getElementById('inlineSummaryList');
    let html = '';

    cart.forEach((item, index) => {
        const itemTotal = extractNumK(item.price) * item.qty;
        const logoUrl = getLogoUrl(item.app);
        const logoRender = logoUrl ? `<img src="${logoUrl}" class="w-6 h-6 object-cover rounded-md border border-pink-100">` : `<span class="text-[10px] font-black text-pink-400">${item.app.charAt(0)}</span>`;

        html += `
            <div class="flex items-center justify-between bg-white p-2.5 rounded-[12px] border border-pink-100 gap-3 group transition-colors hover:border-pink-300 shadow-sm">
                <div class="flex items-center gap-3 flex-1 min-w-0">
                    <div class="w-8 h-8 rounded-lg bg-pink-50 border border-pink-100 flex-shrink-0 flex items-center justify-center p-0.5">
                        ${logoRender}
                    </div>
                    <div class="flex-1 min-w-0">
                        <h4 class="text-gray-800 font-bold text-xs truncate leading-tight">${item.app}</h4>
                        <p class="text-[9px] md:text-[10px] text-gray-500 mt-0.5 truncate"><span class="text-pink-500 font-bold uppercase">${item.cat}</span> • ${item.dur}</p>
                    </div>
                </div>
                <div class="flex flex-col items-end gap-1.5 shrink-0">
                    <span class="text-pink-600 font-black text-xs md:text-sm">${itemTotal}K</span>
                    <div class="flex items-center gap-1.5 bg-pink-50 border border-pink-100 rounded p-0.5 shadow-inner">
                        <button onclick="updateCartItemQty(${index}, -1)" class="w-5 h-5 flex items-center justify-center bg-white rounded hover:bg-gray-100 text-gray-500 font-bold text-[10px] outline-none transition-colors border border-pink-200 shadow-sm">-</button>
                        <span class="text-pink-600 font-black w-3 text-center text-[10px]">${item.qty}</span>
                        <button onclick="updateCartItemQty(${index}, 1)" class="w-5 h-5 flex items-center justify-center bg-pink-400 rounded hover:bg-pink-500 text-white font-bold text-[10px] outline-none transition-colors shadow-sm">+</button>
                    </div>
                </div>
            </div>
        `;
    });
    list.innerHTML = html;
}

function updateCartItemQty(index, delta) {
    const item = cart[index];
    let newQty = item.qty + delta;

    if (newQty < 1) {
        cart.splice(index, 1);
    } else {
        cart[index].qty = newQty;
    }

    updateInlineSummaryUI();

    if (document.getElementById('orderModal').classList.contains('hidden') === false && item.app === currentOrderApp) {
        openOrderModal(currentOrderApp);
    }
}

function showToast() {
    const toast = document.getElementById('toastNotif');
    toast.classList.replace('opacity-0', 'opacity-100');
    toast.classList.replace('-translate-y-10', 'translate-y-0');
    setTimeout(() => {
        toast.classList.replace('opacity-100', 'opacity-0');
        toast.classList.replace('translate-y-0', '-translate-y-10');
    }, 1500);
}

// --- CHECKOUT & FORMS ---
function openCheckoutModal(e) {
    if(e) e.stopPropagation(); 
    if(cart.length === 0) return;

    renderCheckoutForms();
    
    if(isSummaryExpanded) toggleSummaryList();

    const modal = document.getElementById('checkoutModal');
    const content = document.getElementById('checkoutModalContent');
    modal.classList.remove('hidden');
    setTimeout(() => {
        content.classList.remove('translate-x-full');
        content.classList.add('translate-x-0');
    }, 10);
}

function closeCheckoutModal() {
    const modal = document.getElementById('checkoutModal');
    const content = document.getElementById('checkoutModalContent');
    content.classList.remove('translate-x-0');
    content.classList.add('translate-x-full');
    setTimeout(() => { modal.classList.add('hidden'); }, 300);
}

function toggleUseFirstItemData(cartIndex, isChecked) {
    cart[cartIndex].useFirstItemData = isChecked;
    renderCheckoutForms(); 
}

function toggleSeparateFormsItem(cartIndex, isChecked) {
    cart[cartIndex].separateForms = !isChecked; 
    renderCheckoutForms(); 
}

function updateItemForm(cartIndex, fIdx, fieldName, val) {
    if (!cart[cartIndex].formData) cart[cartIndex].formData = [];
    if (!cart[cartIndex].formData[fIdx]) cart[cartIndex].formData[fIdx] = {};
    cart[cartIndex].formData[fIdx][fieldName] = val;
}

function renderCheckoutForms() {
    const container = document.getElementById('checkoutFormsContainer');
    let cartGroups = {};
    let grandTotalK = 0;
    
    cart.forEach((item, index) => {
        const appKey = item.app.toLowerCase().trim();
        if(!cartGroups[appKey]) cartGroups[appKey] = { appName: item.app, items: [] };
        const itemTotalK = extractNumK(item.price) * item.qty;
        grandTotalK += itemTotalK;
        cartGroups[appKey].items.push({ ...item, cartIndex: index, itemTotalK });
    });

    let html = '';

    for (const [appKey, group] of Object.entries(cartGroups)) {
        const fieldsStr = appForms[appKey] || '';
        let fields = [];
        try {
            if (fieldsStr && fieldsStr.trim().startsWith('[')) fields = JSON.parse(fieldsStr).map(f => f.name || f); 
            else fields = fieldsStr ? fieldsStr.split(',').map(f => f.trim()).filter(f => f) : [];
        } catch(e) { fields = fieldsStr ? fieldsStr.split(',').map(f => f.trim()).filter(f => f) : []; }

        const logoUrl = getLogoUrl(group.appName);
        
        let appHTML = `
            <details class="group bg-white rounded-[1.25rem] border border-pink-200 shadow-md overflow-hidden transition-all" open>
                <summary class="p-4 flex justify-between items-center cursor-pointer select-none bg-pink-50 border-b border-pink-100 hover:bg-pink-100/50 transition-colors">
                    <div class="flex items-center gap-3.5">
                        <div class="w-10 h-10 md:w-12 md:h-12 rounded-[10px] bg-white border border-pink-200 flex items-center justify-center p-1 shadow-sm">
                            ${logoUrl ? `<img src="${logoUrl}" class="w-full h-full object-cover rounded-lg">` : `<span class="text-xs font-black text-pink-400">${group.appName.charAt(0)}</span>`}
                        </div>
                        <div>
                            <h4 class="text-pink-600 font-black text-sm md:text-base tracking-wide">${group.appName}</h4>
                            <p class="text-[10px] md:text-[11px] text-gray-500 font-medium mt-0.5">${group.items.length} Paket Dipilih</p>
                        </div>
                    </div>
                    <div class="text-pink-400 bg-white p-1.5 rounded-lg border border-pink-200 shadow-sm group-open:rotate-180 transition-transform duration-300">
                        <svg class="w-4 h-4 md:w-5 md:h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M19 9l-7 7-7-7"></path></svg>
                    </div>
                </summary>
                <div class="p-4 md:p-5 space-y-4">
        `;

        group.items.forEach((gItem, indexInGroup) => {
            if (indexInGroup === 0 && gItem.useFirstItemData) {
                cart[gItem.cartIndex].useFirstItemData = false; gItem.useFirstItemData = false;
            }

            appHTML += `
                <div class="bg-pink-50 p-4 rounded-xl border border-pink-100 relative shadow-inner">
                    <div class="flex justify-between items-center border-b border-pink-200 pb-3 mb-3">
                        <div>
                            <p class="text-[11px] md:text-xs text-gray-500 font-medium"><span class="text-pink-500 font-black uppercase tracking-wider">${gItem.cat}</span> • ${gItem.dur}</p>
                            <p class="text-[10px] md:text-[11px] text-gray-400 mt-1 font-bold">Harga: ${gItem.price} <span class="mx-1 text-pink-300">|</span> Qty: ${gItem.qty}</p>
                        </div>
                        <p class="text-pink-600 font-black text-sm md:text-base">${gItem.itemTotalK}K</p>
                    </div>
            `;

            if (fields.length > 0) {
                if (indexInGroup > 0) {
                    appHTML += `
                        <label class="flex items-center gap-2.5 cursor-pointer mb-3 bg-white p-3 rounded-lg border border-pink-200 hover:border-pink-300 transition-colors shadow-sm">
                            <input type="checkbox" ${gItem.useFirstItemData ? 'checked' : ''} onchange="toggleUseFirstItemData(${gItem.cartIndex}, this.checked)" class="w-4 h-4 text-pink-500 bg-white border-pink-300 rounded outline-none cursor-pointer accent-pink-500">
                            <span class="text-[11px] md:text-xs text-gray-600 font-bold leading-tight">Samakan dengan form <b>${group.items[0].cat} ${group.items[0].dur}</b></span>
                        </label>
                    `;
                }

                if (!gItem.useFirstItemData) {
                    if (gItem.qty > 1) {
                        appHTML += `
                            <label class="flex items-center gap-2.5 cursor-pointer mb-4 bg-white p-3 rounded-lg border border-pink-200 hover:border-pink-300 transition-colors shadow-sm">
                                <input type="checkbox" ${!gItem.separateForms ? 'checked' : ''} onchange="toggleSeparateFormsItem(${gItem.cartIndex}, this.checked)" class="w-4 h-4 text-pink-500 bg-white border-pink-300 rounded outline-none cursor-pointer accent-pink-500">
                                <span class="text-[11px] md:text-xs text-gray-600 font-bold leading-tight">Gunakan data yang sama untuk semua ${gItem.qty} akun pesanan ini</span>
                            </label>
                        `;
                    }

                    const loopCount = gItem.separateForms && gItem.qty > 1 ? gItem.qty : 1;
                    
                    for (let fIdx = 0; fIdx < loopCount; fIdx++) {
                        if (gItem.separateForms && gItem.qty > 1) {
                            appHTML += `<div class="text-[10px] md:text-[11px] text-pink-500 font-black mb-2 mt-4 px-1 bg-pink-100 inline-block py-1 px-2 rounded-lg">↳ DATA AKUN #${fIdx + 1}</div>`;
                        }
                        
                        appHTML += `<div class="grid grid-cols-1 md:grid-cols-2 gap-3 md:gap-4 ${fIdx > 0 ? 'bg-white p-3.5 rounded-xl border border-pink-200 shadow-sm' : ''}">`;
                        fields.forEach(field => {
                            let filledVal = '';
                            if (gItem.formData && gItem.formData[fIdx] && gItem.formData[fIdx][field]) filledVal = gItem.formData[fIdx][field];

                            appHTML += `
                                <div>
                                    <label class="text-[10px] md:text-[11px] text-gray-500 block mb-1.5 font-bold uppercase tracking-wide ml-1">${field}</label>
                                    <input type="text" 
                                           placeholder="Ketik ${field}" 
                                           value="${filledVal}" 
                                           oninput="updateItemForm(${gItem.cartIndex}, ${fIdx}, '${field}', this.value)" 
                                           class="w-full bg-white border border-pink-200 focus:border-pink-400 rounded-xl py-2.5 md:py-3 px-3.5 text-xs md:text-sm outline-none text-gray-700 font-bold transition-colors shadow-inner placeholder-pink-200">
                                </div>
                            `;
                        });
                        appHTML += `</div>`;
                    }
                } else {
                    appHTML += `
                        <div class="flex items-center gap-2 p-3 bg-green-50 border border-green-200 rounded-lg shadow-sm">
                            <svg class="w-4 h-4 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"></path></svg>
                            <p class="text-[10px] md:text-xs text-green-600 font-bold">Data akan disalin otomatis.</p>
                        </div>
                    `;
                }
            }
            appHTML += `</div>`; 
        });
        appHTML += `</div></details>`; 
        html += appHTML;
    }

    container.innerHTML = html;
    document.getElementById('checkoutGrandTotal').innerText = grandTotalK + 'K';
}

function checkoutCartWA() {
    if(cart.length === 0) return;

    // --- Validasi Form ---
    for (let i = 0; i < cart.length; i++) {
        const item = cart[i];
        const appKey = item.app.toLowerCase().trim();
        const fieldsStr = appForms[appKey] || '';
        let fields = [];
        try {
            if (fieldsStr && fieldsStr.trim().startsWith('[')) fields = JSON.parse(fieldsStr).map(f => f.name || f); 
            else fields = fieldsStr ? fieldsStr.split(',').map(f => f.trim()).filter(f => f) : [];
        } catch(e) { fields = fieldsStr ? fieldsStr.split(',').map(f => f.trim()).filter(f => f) : []; }

        if(fields.length > 0 && !item.useFirstItemData) {
            const loopCount = item.separateForms && item.qty > 1 ? item.qty : 1;
            for (let fIdx = 0; fIdx < loopCount; fIdx++) {
                for (const field of fields) {
                    if (!item.formData || !item.formData[fIdx] || !item.formData[fIdx][field] || !item.formData[fIdx][field].trim()) {
                        let msg = `Mohon lengkapi kolom "${field}" untuk pesanan ${item.app} (${item.cat} ${item.dur})`;
                        if (item.separateForms && item.qty > 1) msg += ` (Pada Data Akun #${fIdx + 1})`;
                        alert(msg + ` terlebih dahulu 🥺🎀`);
                        return; 
                    }
                }
            }
        }
    }

    let grandTotal = 0;
    let textWA = "୨ ⁺ ૮₍˶ᵔ ᵕ ᵔ˶₎აhaloo, aku mau jajan ini! ౿ \n\n";

    cart.forEach((item) => {
        const itemTotalK = extractNumK(item.price) * item.qty;
        grandTotal += itemTotalK;

        const appKey = item.app.toLowerCase().trim();
        const fieldsStr = appForms[appKey] || '';
        let fields = [];
        try {
            if (fieldsStr && fieldsStr.trim().startsWith('[')) fields = JSON.parse(fieldsStr).map(f => f.name || f); 
            else fields = fieldsStr ? fieldsStr.split(',').map(f => f.trim()).filter(f => f) : [];
        } catch(e) { fields = fieldsStr ? fieldsStr.split(',').map(f => f.trim()).filter(f => f) : []; }

        textWA += `𖠗  ⊹  ☆̲  ${item.app} — ${item.dur}\n`;
        textWA += `⊹ ꒰ 𓈒 ♡ ——— paket :  ${item.cat}\n`;
        textWA += `⊹ ꒰ 𓈒 ♡ ——— total   :  ${item.qty} pcs\n`;

        if (fields.length > 0) {
            textWA += `\n*DATA USER*\n`;

            if (item.useFirstItemData) {
                // MENCARI NAMA PAKET PERTAMA YANG ADA DI KERANJANG
                const firstItem = cart.find(c => c.app === item.app);
                if (firstItem) {
                    textWA += `(Data form sama dengan paket ${firstItem.cat} ${firstItem.dur})\n`;
                } else {
                    textWA += `(Data form sama dengan paket sebelumnya)\n`;
                }
            } else {
                const isSeparate = item.separateForms;
                const loopCount = isSeparate && item.qty > 1 ? item.qty : 1;

                if (isSeparate && item.qty > 1) {
                    for(let fIdx = 0; fIdx < loopCount; fIdx++) {
                        textWA += `[Akun #${fIdx + 1}]\n`;
                        fields.forEach(field => {
                            const val = item.formData && item.formData[fIdx] && item.formData[fIdx][field] ? item.formData[fIdx][field] : '-';
                            textWA += `- ${field} : ${val}\n`;
                        });
                        if (fIdx < loopCount - 1) textWA += `\n`;
                    }
                } else {
                     fields.forEach(field => {
                         const val = item.formData && item.formData[0] && item.formData[0][field] ? item.formData[0][field] : '-';
                         textWA += `- ${field} : ${val}\n`;
                     });
                }
            }
            textWA += `\n\n`; 
        } else {
            textWA += `\n\n`; 
        }
    });

    // Menghapus spasi newline (baris kosong) yang berlebihan di akhir daftar pesanan
    textWA = textWA.trimEnd() + `\n\n`;

    textWA += `ఌ︎. 𓈄 total order : IDR ${grandTotal}K ⸝⸝ 𓇼 ఌ︎. ⟡ \n\n`;
    textWA += ` ⑅ ౿ bisa bantu untuk prosesnya kak?  ♡ ๑ .. thank you  ౿ ⊹ (. .*)β \nhave a sweet day  𖠗\n\n`;
    textWA += `https://ciccu.biz.id/qris`;
    
    const encodedText = encodeURIComponent(textWA);
    window.open(`https://wa.me/6283877337798?text=${encodedText}`, '_blank');
}

// ----- OTHER MODALS -----
function openLoyaltyModal() {
    const modal = document.getElementById('loyaltyModal');
    const backdrop = document.getElementById('loyaltyModalBackdrop');
    const content = document.getElementById('loyaltyModalContent');
    modal.classList.remove('hidden');
    setTimeout(() => { backdrop.classList.replace('opacity-0', 'opacity-100'); content.classList.replace('opacity-0', 'opacity-100'); content.classList.replace('scale-95', 'scale-100'); }, 10);
}
function closeLoyaltyModal() {
    const modal = document.getElementById('loyaltyModal');
    const backdrop = document.getElementById('loyaltyModalBackdrop');
    const content = document.getElementById('loyaltyModalContent');
    backdrop.classList.replace('opacity-100', 'opacity-0'); content.classList.replace('opacity-100', 'opacity-0'); content.classList.replace('scale-100', 'scale-95');
    setTimeout(() => { modal.classList.add('hidden'); }, 300);
}
function openTermsModal() {
    const modal = document.getElementById('termsModal');
    const backdrop = document.getElementById('termsModalBackdrop');
    const content = document.getElementById('termsModalContent');
    modal.classList.remove('hidden');
    setTimeout(() => { backdrop.classList.replace('opacity-0', 'opacity-100'); content.classList.replace('opacity-0', 'opacity-100'); content.classList.replace('scale-95', 'scale-100'); }, 10);
}
function closeTermsModal() {
    const modal = document.getElementById('termsModal');
    const backdrop = document.getElementById('termsModalBackdrop');
    const content = document.getElementById('termsModalContent');
    backdrop.classList.replace('opacity-100', 'opacity-0'); content.classList.replace('opacity-100', 'opacity-0'); content.classList.replace('scale-100', 'scale-95');
    setTimeout(() => { modal.classList.add('hidden'); }, 300);
}
function openInfoNetflixModal() {
    const modal = document.getElementById('infoNetflixModal');
    const backdrop = document.getElementById('infoNetflixBackdrop');
    const content = document.getElementById('infoNetflixContent');
    modal.classList.remove('hidden');
    setTimeout(() => { backdrop.classList.replace('opacity-0', 'opacity-100'); content.classList.replace('opacity-0', 'opacity-100'); content.classList.replace('scale-95', 'scale-100'); }, 10);
}
function closeInfoNetflixModal() {
    const modal = document.getElementById('infoNetflixModal');
    const backdrop = document.getElementById('infoNetflixBackdrop');
    const content = document.getElementById('infoNetflixContent');
    backdrop.classList.replace('opacity-100', 'opacity-0'); content.classList.replace('opacity-100', 'opacity-0'); content.classList.replace('scale-100', 'scale-95');
    setTimeout(() => { modal.classList.add('hidden'); }, 300);
}

loadPricelist();
