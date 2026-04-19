import { NextResponse } from 'next/server';

// Forçamos a geração estática no build para que a versão seja fixada por build
export const dynamic = 'force-static';
export const revalidate = false;

export async function GET() {
  // Usa a versão do app gerada no build via next.config.mjs
  const appVersion = process.env.NEXT_PUBLIC_APP_VERSION || Date.now().toString(36);
  const cacheName = `minhas-financas-${appVersion}`;

  const swCode = `
const CACHE_NAME = '${cacheName}';
const APP_VERSION = '${appVersion}';
const ASSETS_TO_CACHE = [
  '/',
  '/manifest.json',
  '/icon-192x192.png',
  '/icon-512x512.png',
  '/apple-touch-icon.png',
  '/favicon.png',
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(ASSETS_TO_CACHE);
    })
  );
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames
          .filter((name) => name !== CACHE_NAME && name.startsWith('minhas-financas-'))
          .map((name) => caches.delete(name))
      );
    })
  );
  self.clientsClaim();
});

self.addEventListener('fetch', (event) => {
  // Only handle GET requests
  if (event.request.method !== 'GET') return;

  // Let browser handling of Clerk/Auth URLs and static internal assets that might change
  // We avoid caching sign-in/up and clerk to prevent auth issues
  const url = event.request.url;
  if (
    url.includes('clerk') || 
    url.includes('sign-in') || 
    url.includes('sign-up') ||
    url.includes('/_next/') || // Let Next.js handle its own chunks/hot reload
    url.includes('/api/')     // Don't cache API calls
  ) {
      return;
  }

  event.respondWith(
    caches.match(event.request).then((cachedResponse) => {
      if (cachedResponse) {
        return cachedResponse;
      }
      return fetch(event.request).then((response) => {
        // Don't cache non-successful responses or external origins (except some assets)
        if (!response || response.status !== 200 || response.type !== 'basic') {
          return response;
        }

        const responseToCache = response.clone();
        caches.open(CACHE_NAME).then((cache) => {
          cache.put(event.request, responseToCache);
        });

        return response;
      });
    })
  );
});

// Listener para forçar o reload quando uma nova versão é ativada
self.addEventListener('message', (event) => {
  if (event.data === 'SKIP_WAITING') {
    self.skipWaiting();
  }
});
`;

  return new NextResponse(swCode, {
    headers: {
      'Content-Type': 'application/javascript',
      'Cache-Control': 'no-cache, no-store, must-revalidate',
      'Service-Worker-Allowed': '/',
    },
  });
}
