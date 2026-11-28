// Meruchat servis çalışanı: uygulama kapalıyken gelen bildirimleri gösterir.
self.addEventListener('install', () => self.skipWaiting());
self.addEventListener('activate', e => e.waitUntil(self.clients.claim()));

// Safari (iPhone/Mac) her push için görünür bildirim ister; diğerlerinde uygulama ekrandayken tekrar göstermeyiz.
const webkit = () => (/AppleWebKit/.test(self.navigator.userAgent) && !/Chrome|Chromium|CriOS|Edg|Firefox|FxiOS/.test(self.navigator.userAgent))
  || /iPhone|iPad|iPod/.test(self.navigator.userAgent);

self.addEventListener('push', e => {
  let d = {};
  try { d = e.data ? e.data.json() : {}; } catch (x) { d = {t: 'Meruchat', b: e.data ? e.data.text() : ''}; }
  const title = String(d.t || 'Meruchat').slice(0, 60);
  const opts = {
    body: String(d.b || 'Yeni mesajın var').slice(0, 160),
    icon: 'icon-192.png',
    tag: 'dm-' + (d.from || 'x'),
    renotify: true,
    data: {from: d.from || ''}
  };
  e.waitUntil((async () => {
    if (!webkit()) {
      const cs = await self.clients.matchAll({type: 'window', includeUncontrolled: true});
      if (cs.some(c => c.visibilityState === 'visible' && c.focused)) return;
    }
    await self.registration.showNotification(title, opts);
  })());
});

self.addEventListener('notificationclick', e => {
  e.notification.close();
  const from = (e.notification.data && e.notification.data.from) || '';
  e.waitUntil((async () => {
    const cs = await self.clients.matchAll({type: 'window', includeUncontrolled: true});
    if (cs.length) {
      const c = cs[0];
      try { await c.focus(); } catch (x) {}
      c.postMessage({t: 'dm', from});
      return;
    }
    await self.clients.openWindow(self.registration.scope + (from ? '?dm=' + encodeURIComponent(from) : ''));
  })());
});
