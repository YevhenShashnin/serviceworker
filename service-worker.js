const staticCacheName = 's-app-v1';
const urlsToCache = [
    '/offline.html',
    '/img/logo.png',
    '/img/refresh.svg'
];

// Install a service worker
self.addEventListener('install', event => {
    event.waitUntil(
        caches.open(staticCacheName)
            .then(cache => cache.addAll(urlsToCache))
            .then(() => self.skipWaiting())
            .catch (e => {
                console.log(e)
            })
    );
});

// Cache and return requests
self.addEventListener('fetch',  event => {
    const {request} = event;
    const url = new URL (request.url);
    if (url.origin === location.origin) {
        if (request.mode === 'navigate') {
            event.respondWith(isOnline(request, event.preloadResponse))
        } else if (request.destination === 'image' || request.destination === 'font'){
            event.respondWith(imgFntCache(request))
        }
    }
});

// Update a service worker
self.addEventListener('activate', event => {
    event.waitUntil(
        caches.keys()
            .then(cashNames => Promise.all(
                cashNames
                    .filter (name => name !== staticCacheName)
                    .map(name => caches.delete(name))
            ))
            .then(() => self.clients.claim())
            .then(() => {
                if (self.registration.navigationPreload) self.registration.navigationPreload.enable()
            })
            .catch(e => {
                console.log(e)
            })
    );
});

async function isOnline(request, preloadResponse) {
    try {
        const response = await preloadResponse;
        return response || await fetch(request);
    } catch (e) {
        return await caches.match('/offline.html');
    }
}

async function imgFntCache(request) {
    const cache = await caches.open(staticCacheName);
    const cached = await caches.match(request);
    if(cached) return cached;
    try {
        const response = await fetch(request);
        if(response.status === 200) await cache.put(request, response.clone());
        return response;
    } catch (e) {
        console.log(e)
    }
}

