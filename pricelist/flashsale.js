const FlashSale = {
    startMs: null,
    endMs: null,
    timerInterval: null,
    active: false,
    name: 'Flash Sale',
    description: '',
    onExpireCallback: null,
    items: [],
    wasUpcoming: false,

    init: function(settings, onExpire) {
        this.stopCountdown();
        this.onExpireCallback = onExpire || null;
        this.name = settings.name || 'Flash Sale';
        this.description = settings.description || '';

        var startStr = settings.start || '';
        var endStr = settings.end || '';

        if (!startStr || !endStr) {
            this.active = false;
            this.hideBanner();
            this.hideItems();
            return;
        }

        this.startMs = this.parseWIBToUTC(startStr);
        this.endMs = this.parseWIBToUTC(endStr);

        if (this.startMs === null || this.endMs === null || this.endMs <= this.startMs) {
            this.active = false;
            this.hideBanner();
            this.hideItems();
            return;
        }

        this.active = true;
        this.wasUpcoming = Date.now() < this.startMs;
        this.startCountdown();
    },

    setItems: function(allApps) {
        if (!this.active) {
            this.hideItems();
            return;
        }
        this.items = this.extractItems(allApps);
        this.renderItems();
    },

    extractItems: function(apps) {
        var items = [];
        var appNames = Object.keys(apps);
        for (var i = 0; i < appNames.length; i++) {
            var appName = appNames[i];
            var info = apps[appName];
            if (!info || !info.packages) continue;
            for (var j = 0; j < info.packages.length; j++) {
                var pkg = info.packages[j];
                if (pkg.flash_price && pkg.flash_price.trim() !== '') {
                    var flashVal = extractNumK(pkg.flash_price);
                    var normalVal = extractNumK(pkg.price);
                    if (flashVal > 0 && flashVal < normalVal) {
                        items.push({
                            appName: appName,
                            category: pkg.category,
                            duration: pkg.duration,
                            price: pkg.price,
                            flash_price: pkg.flash_price,
                            status: pkg.status || 'Ready',
                            flash_sort_order: (pkg.flash_sort_order && pkg.flash_sort_order > 0 && pkg.flash_sort_order < 9999) ? pkg.flash_sort_order : 9999
                        });
                    }
                }
            }
        }

        items.sort(function(a, b) {
            return (a.flash_sort_order - b.flash_sort_order) || a.appName.localeCompare(b.appName);
        });

        return items;
    },

    parseWIBToUTC: function(dateTimeStr) {
        if (!dateTimeStr) return null;
        try {
            var parts = dateTimeStr.split('T');
            if (parts.length < 2) return null;
            var datePart = parts[0];
            var timePart = parts[1];
            var dateSegments = datePart.split('-').map(Number);
            var timeSegments = timePart.split(':').map(Number);
            if (dateSegments.length < 3 || timeSegments.length < 2) return null;
            var year = dateSegments[0];
            var month = dateSegments[1];
            var day = dateSegments[2];
            var hour = timeSegments[0];
            var minute = timeSegments[1];
            if ([year, month, day, hour, minute].some(function(v) { return isNaN(v); })) return null;
            return Date.UTC(year, month - 1, day, hour - 7, minute, 0);
        } catch (e) {
            return null;
        }
    },

    isActive: function() {
        if (!this.active) return false;
        var now = Date.now();
        return now >= this.startMs && now <= this.endMs;
    },

    isUpcoming: function() {
        if (!this.active) return false;
        return Date.now() < this.startMs;
    },

    getEffectivePrice: function(item) {
        if (!this.isActive()) return { price: item.price, isFlash: false };
        if (item.flash_price && item.flash_price.trim() !== '') {
            var flashVal = extractNumK(item.flash_price);
            var normalVal = extractNumK(item.price);
            if (flashVal > 0 && flashVal < normalVal) {
                return { price: item.flash_price, originalPrice: item.price, isFlash: true };
            }
        }
        return { price: item.price, isFlash: false };
    },

    startCountdown: function() {
        this.renderBanner();
        this.updateCountdown();
        var self = this;
        this.timerInterval = setInterval(function() { self.updateCountdown(); }, 1000);
    },

    stopCountdown: function() {
        if (this.timerInterval) {
            clearInterval(this.timerInterval);
            this.timerInterval = null;
        }
    },

    updateCountdown: function() {
        var now = Date.now();

        if (now > this.endMs) {
            this.stopCountdown();
            this.active = false;
            this.hideBanner();
            this.hideItems();
            if (this.onExpireCallback) this.onExpireCallback();
            return;
        }

        var targetMs;
        var statusText;
        var isCurrentlyUpcoming = now < this.startMs;

        if (isCurrentlyUpcoming) {
            targetMs = this.startMs;
            statusText = 'Dimulai dalam';
        } else {
            targetMs = this.endMs;
            statusText = 'Berakhir dalam';
        }

        if (this.wasUpcoming && !isCurrentlyUpcoming) {
            this.wasUpcoming = false;
            this.updateItemButtons();
        }

        var diff = targetMs - now;
        var totalSeconds = Math.floor(diff / 1000);
        var hours = Math.floor(totalSeconds / 3600);
        var minutes = Math.floor((totalSeconds % 3600) / 60);
        var seconds = totalSeconds % 60;

        var statusEl = document.getElementById('flashSaleStatusText');
        var hoursEl = document.getElementById('fsHours');
        var minutesEl = document.getElementById('fsMinutes');
        var secondsEl = document.getElementById('fsSeconds');

        if (statusEl) statusEl.innerText = statusText;
        if (hoursEl) hoursEl.innerText = String(hours).padStart(2, '0');
        if (minutesEl) minutesEl.innerText = String(minutes).padStart(2, '0');
        if (secondsEl) secondsEl.innerText = String(seconds).padStart(2, '0');
    },

    renderBanner: function() {
        var banner = document.getElementById('flashSaleBanner');
        var nameEl = document.getElementById('fsBannerName');
        var descEl = document.getElementById('fsBannerDesc');

        if (nameEl) nameEl.innerText = this.name;
        if (descEl) {
            descEl.innerText = this.description;
            if (!this.description) descEl.style.display = 'none';
            else descEl.style.display = '';
        }
        if (banner) banner.classList.remove('hidden');
    },

    hideBanner: function() {
        var banner = document.getElementById('flashSaleBanner');
        if (banner) banner.classList.add('hidden');
    },

    renderItems: function() {
        var section = document.getElementById('flashSaleItemsSection');
        var scroll = document.getElementById('flashSaleItemsScroll');
        if (!section || !scroll) return;

        if (this.items.length === 0) {
            section.classList.add('hidden');
            return;
        }

        section.classList.remove('hidden');

        var isActive = this.isActive();
        var isUpcoming = this.isUpcoming();
        var html = '';

        for (var i = 0; i < this.items.length; i++) {
            var item = this.items[i];
            var isSold = item.status && item.status.toLowerCase() !== 'ready';

            var btnHTML = '';
            var btnClass = '';

            if (isSold) {
                btnHTML = 'Kosong';
                btnClass = 'bg-gray-100 text-gray-400 border-gray-200 cursor-not-allowed';
            } else if (isUpcoming) {
                btnHTML = 'Belum Mulai';
                btnClass = 'bg-amber-50 text-amber-400 border-amber-200 cursor-not-allowed';
            } else {
                btnHTML = '+ Tambah';
                btnClass = 'bg-white text-pink-500 border-pink-200 hover:bg-pink-50 active:scale-95 cursor-pointer';
            }

            var disabledAttr = (isSold || isUpcoming) ? 'disabled' : '';

            var logoUrl = (typeof getLogoUrl === 'function') ? getLogoUrl(item.appName) : '';
            var logoHTML = '';
            if (logoUrl) {
                logoHTML = '<img src="' + logoUrl + '" class="w-full h-full object-contain rounded" loading="lazy">';
            } else {
                logoHTML = '<span class="text-[10px] md:text-xs font-black text-pink-400">' + escapeHTML(item.appName.charAt(0)) + '</span>';
            }

            html += '<div class="fs-card shrink-0 w-[140px] md:w-[170px] bg-white border border-amber-200 rounded-2xl p-3 md:p-4 shadow-sm flex flex-col relative overflow-hidden">' +
                '<div class="absolute top-1.5 right-1.5 text-[8px] font-black text-amber-500 bg-amber-50 border border-amber-200 px-1 py-0.5 rounded">⚡</div>' +
                '<div class="flex items-center gap-2 mb-1.5">' +
                    '<div class="w-7 h-7 md:w-8 md:h-8 rounded-lg bg-pink-50 border border-pink-100 flex items-center justify-center overflow-hidden shrink-0 p-0.5">' +
                        logoHTML +
                    '</div>' +
                    '<p class="text-[11px] md:text-xs font-black text-gray-800 truncate">' + escapeHTML(item.appName) + '</p>' +
                '</div>' +
                '<p class="text-[9px] md:text-[10px] text-gray-400 font-bold truncate">' + escapeHTML(item.category) + ' • ' + escapeHTML(item.duration) + '</p>' +
                '<div class="mt-2 flex items-end gap-1.5">' +
                    '<span class="text-[9px] md:text-[10px] text-gray-400 line-through font-bold">' + escapeHTML(item.price) + '</span>' +
                    '<span class="text-sm md:text-base font-black text-pink-600 leading-none">' + escapeHTML(item.flash_price) + '</span>' +
                '</div>' +
                '<button data-fs-app="' + escapeHTML(item.appName) + '" data-fs-cat="' + escapeHTML(item.category) + '" data-fs-dur="' + escapeHTML(item.duration) + '" data-fs-price="' + escapeHTML(item.flash_price) + '" class="fs-add-btn mt-2.5 w-full py-1.5 md:py-2 text-[9px] md:text-[10px] font-bold rounded-lg border transition-all outline-none ' + btnClass + '" ' + disabledAttr + '>' +
                    btnHTML +
                '</button>' +
            '</div>';
        }

        scroll.innerHTML = html;

        scroll.querySelectorAll('.fs-add-btn:not([disabled])').forEach(function(btn) {
            btn.addEventListener('click', function() {
                var appName = this.getAttribute('data-fs-app');
                var cat = this.getAttribute('data-fs-cat');
                var dur = this.getAttribute('data-fs-dur');
                var price = this.getAttribute('data-fs-price');
                var pkgId = 'fs-' + appName.replace(/[^a-zA-Z0-9]/g, '') + '-' + cat.replace(/[^a-zA-Z0-9]/g, '');
                quickAdd(appName, cat, dur, price, pkgId);
                updateFsButton(this, appName, cat, dur);
            });
        });
    },

    hideItems: function() {
        var section = document.getElementById('flashSaleItemsSection');
        if (section) section.classList.add('hidden');
    },

    updateItemButtons: function() {
        this.renderItems();
    }
};

function updateFsButton(btn, appName, cat, dur) {
    if (typeof cart === 'undefined') return;
    var cartItem = null;
    for (var i = 0; i < cart.length; i++) {
        if (cart[i].app === appName && cart[i].cat === cat && cart[i].dur === dur) {
            cartItem = cart[i];
            break;
        }
    }
    var qty = cartItem ? cartItem.qty : 0;
    if (qty > 0) {
        btn.innerText = qty + ' pcs ✓';
        btn.classList.remove('bg-white', 'text-pink-500', 'border-pink-200');
        btn.classList.add('bg-pink-400', 'text-white', 'border-pink-400');
    } else {
        btn.innerText = '+ Tambah';
        btn.classList.remove('bg-pink-400', 'text-white', 'border-pink-400');
        btn.classList.add('bg-white', 'text-pink-500', 'border-pink-200');
    }
}
