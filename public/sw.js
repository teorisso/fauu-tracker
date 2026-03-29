/* global self, clients */
self.addEventListener('push', function (event) {
  let data = { title: 'FAUU Tracker', body: '', url: '/' }
  try {
    if (event.data) {
      const t = event.data.text()
      data = { ...data, ...JSON.parse(t) }
    }
  } catch (_) {
    /* ignore */
  }
  event.waitUntil(
    self.registration.showNotification(data.title || 'FAUU Tracker', {
      body: data.body || '',
      data: data.url || '/',
    })
  )
})

self.addEventListener('notificationclick', function (event) {
  event.notification.close()
  const url = event.notification.data || '/'
  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clientList) => {
      for (const c of clientList) {
        if (c.url.includes(self.location.origin) && 'focus' in c) return c.focus()
      }
      if (clients.openWindow) return clients.openWindow(url)
    })
  )
})
