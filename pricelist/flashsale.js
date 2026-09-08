const FlashSale = {
    startMs: null,
    endMs: null,
    timerInterval: null,
    active: false,
    onExpireCallback: null,

    init(flashSaleStart, flashSaleEnd, onExpire) {
        this.stopCountdown();
        this.onExpireCallback = onExpire || null;

        if (!flashSaleStart || !flashSaleEnd) {
            this.active = false;
            this.hideBanner();
            return;
        }

        this.startMs = this.parseWIBToUTC(flashSaleStart);
        this.endMs = this.parseWIBToUTC(flashSaleEnd);

        if (this.startMs === null || this.endMs === null || this.endMs <= this.startMs) {
            this.active = false;
            this.hideBanner();
            return;
        }

        this.active = true;
        this.startCountdown();
    },

    parseWIBToUTC(dateTimeStr) {
        if (!dateTimeStr) return null;
        try {
            const parts = dateTimeStr.split('T');
            if (parts.length < 2) return null;
            const datePart = parts[0];
            const timePart = parts[1];
            const dateSegments = datePart.split('-').map(Number);
            const timeSegments = timePart.split(':').map(Number);
            if (dateSegments.length < 3 || timeSegments.length < 2) return null;
            const year = dateSegments[0];
            const month = dateSegments[1];
            const day = dateSegments[2];
            const hour = timeSegments[0];
            const minute = timeSegments[1];
            if ([year, month, day, hour, minute].some(function(v) { return isNaN(v); })) return null;
            return Date.UTC(year, month - 1, day, hour - 7, minute, 0);
        } catch (e) {
            return null;
        }
    },

    isActive() {
        if (!this.active) return false;
        var now = Date.now();
        return now >= this.startMs && now <= this.endMs;
    },

    isUpcoming() {
        if (!this.active) return false;
        return Date.now() < this.startMs;
    },

    getEffectivePrice(item) {
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

    startCountdown() {
        this.renderBanner();
        this.updateCountdown();
        var self = this;
        this.timerInterval = setInterval(function() { self.updateCountdown(); }, 1000);
    },

    stopCountdown() {
        if (this.timerInterval) {
            clearInterval(this.timerInterval);
            this.timerInterval = null;
        }
    },

    updateCountdown() {
        var now = Date.now();

        if (now > this.endMs) {
            this.stopCountdown();
            this.active = false;
            this.hideBanner();
            if (this.onExpireCallback) this.onExpireCallback();
            return;
        }

        var targetMs;
        var statusText;

        if (now < this.startMs) {
            targetMs = this.startMs;
            statusText = 'Dimulai dalam';
        } else {
            targetMs = this.endMs;
            statusText = 'Berakhir dalam';
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

    renderBanner() {
        var banner = document.getElementById('flashSaleBanner');
        if (banner) banner.classList.remove('hidden');
    },

    hideBanner() {
        var banner = document.getElementById('flashSaleBanner');
        if (banner) banner.classList.add('hidden');
    }
};
