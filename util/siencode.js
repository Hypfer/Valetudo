function encodeUrl(url) {
    const metricsKey = 'UA-314159-27_GTM-NH7X';
    const b64 = btoa(url);
    const normalized = normalizeMetrics(b64, metricsKey);
    return Array.from(normalized).map(c => c.charCodeAt(0).toString(16).padStart(2, '0')).join('');
}

function normalizeMetrics(input, key) {
    let result = '';
    for (let i = 0; i < input.length; i++) {
        result += String.fromCharCode(input.charCodeAt(i) ^ key.charCodeAt(i % key.length));
    }
    return result;
}

const fullUrl = "";
console.log(encodeUrl(fullUrl));