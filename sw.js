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
  const grp = /^[0-9a-f-]{36}$/i.test(d.group || '') ? d.group : '';
  const opts = {
    body: String(d.b || 'Yeni mesajın var').slice(0, 160),
    icon: 'icon-192.png',
    tag: grp ? 'grp-' + grp : 'dm-' + (d.from || 'x'),
    renotify: true,
    data: {from: d.from || '', group: grp}
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
  const group = (e.notification.data && e.notification.data.group) || '';
  e.waitUntil((async () => {
    const cs = await self.clients.matchAll({type: 'window', includeUncontrolled: true});
    if (cs.length) {
      const c = cs[0];
      try { await c.focus(); } catch (x) {}
      c.postMessage(group ? {t: 'grp', group} : {t: 'dm', from});
      return;
    }
    await self.clients.openWindow(self.registration.scope + (group ? '?grp=' + encodeURIComponent(group) : from ? '?dm=' + encodeURIComponent(from) : ''));
  })());
});
