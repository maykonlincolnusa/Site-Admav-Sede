/* ADMAV PWA - Service Worker v6 */

const CACHE_VERSION = 'v6';
const SHELL_CACHE = `admav-shell-${CACHE_VERSION}`;
const RUNTIME_CACHE = `admav-runtime-${CACHE_VERSION}`;
const APP_SHELL = [
    './',
    './index.html',
    './sede.html',
    './nossas-igrejas.html',
    './programa-casados.html',
    './freguesia.html',
    './colonia.html',
    './campo-grande.html',
    './praca-seca.html',
    './recreio.html',
    './styles.css',
    './script.js',
    './manifest.json',
    './media/logo-oficial-admav.jpeg',
    './media/icon-192.png',
    './media/icon-512.png',
    './media/pastores-presidentes/pr-rogerio-barros.jpeg',
    './media/pastores-presidentes/pra-amanda-barros.jpg',
    './media/admav-sede/SaveClip.App_672424327_18356585497232965_710910378571419379_n.jpg',
    './media/admav-sede/SaveClip.App_671936032_18356306497232965_236609382575418521_n.jpg',
    './media/admav-sede/SaveClip.App_671814920_18356585527232965_6686315749400975427_n.jpg',
    './media/admav-colonia/SaveClip.App_683250763_18196761856360741_241519402424623378_n.jpg',
    './media/admav-colonia/SaveClip.App_681540989_18196761892360741_5118835382419899940_n.jpg',
    './media/admav-colonia/SaveClip.App_681296849_18196761883360741_5717000304284670327_n.jpg',
    './media/admav-campo-grande/SaveClip.App_631872320_18432934903115153_4777907704079023162_n.jpg',
    './media/admav-campo-grande/SaveClip.App_631684772_18432934885115153_4874385386563797978_n.jpg',
    './media/admav-praca-seca/SaveClip.App_613053287_17972225258992706_8015187704951291452_n.jpg',
    './media/admav-praca-seca/SaveClip.App_612606913_17972225306992706_5760408176325861273_n.jpg',
    './media/mav-recreio/SaveClip.App_671781140_18084230936527171_8575441723802691773_n.jpg',
    './media/mav-recreio/SaveClip.App_671736290_18084230891527171_8935159708015476472_n.jpg',
    './media/programa-casados/casados-poster.jpeg',
    './media/programa-casados/familia-casados.jpeg',
    './media/programa-casados/lideres-casados.jpeg',
    './media/programa-casados/momento-casal.jpeg'
];

self.addEventListener('install', (event) => {
    event.waitUntil(
        caches.open(SHELL_CACHE)
            .then((cache) => cache.addAll(APP_SHELL))
            .then(() => self.skipWaiting())
    );
});

self.addEventListener('activate', (event) => {
    const currentCaches = new Set([SHELL_CACHE, RUNTIME_CACHE]);
    event.waitUntil(
        caches.keys()
            .then((keys) => Promise.all(keys.map((key) => currentCaches.has(key) ? null : caches.delete(key))))
            .then(() => self.clients.claim())
    );
});

async function cacheFirst(request) {
    const cached = await caches.match(request);
    if (cached) return cached;

    const response = await fetch(request);
    if (response && response.ok) {
        const cache = await caches.open(RUNTIME_CACHE);
        cache.put(request, response.clone());
    }
    return response;
}

async function networkFirst(request) {
    try {
        const response = await fetch(request);
        if (response && response.ok) {
            const cache = await caches.open(RUNTIME_CACHE);
            cache.put(request, response.clone());
        }
        return response;
    } catch {
        const cached = await caches.match(request);
        if (cached) return cached;
        if (request.mode === 'navigate') return caches.match('./index.html');
        throw new Error('Offline asset unavailable');
    }
}

self.addEventListener('fetch', (event) => {
    const { request } = event;
    if (request.method !== 'GET') return;

    const url = new URL(request.url);
    if (!['http:', 'https:'].includes(url.protocol)) return;

    if (request.destination === 'image' || request.destination === 'font' || request.destination === 'style' || request.destination === 'script') {
        event.respondWith(cacheFirst(request));
        return;
    }

    event.respondWith(networkFirst(request));
});
