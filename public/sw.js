/* JELLY LAND 서비스 워커
   - "홈 화면에 앱 추가(설치)"를 가능하게 함 (캐시는 하지 않아 항상 최신 버전)
   - 🔔 푸시 알림: 조젤리 입장 · 새 쪽지 */
self.addEventListener("install", () => self.skipWaiting());
self.addEventListener("activate", (e) => e.waitUntil(self.clients.claim()));
self.addEventListener("fetch", () => {});
self.addEventListener("push", (e) => {
  let d = {};
  try { d = e.data ? e.data.json() : {}; } catch { d = { title: "JELLY LAND", body: e.data ? e.data.text() : "" }; }
  e.waitUntil(self.registration.showNotification(d.title || "JELLY LAND", {
    body: d.body || "", icon: "img/icon-192.png", badge: "img/icon-192.png", tag: d.tag || "jelly", renotify: true,
    vibrate: [120, 60, 120], data: { url: d.url || "/" },
  }));
});
self.addEventListener("notificationclick", (e) => {
  e.notification.close();
  const url = new URL((e.notification.data && e.notification.data.url) || "/", self.location.origin).href;
  e.waitUntil(self.clients.matchAll({ type: "window", includeUncontrolled: true }).then((list) => {
    for (const c of list) if (c.url.startsWith(self.location.origin) && "focus" in c) return c.focus();
    return self.clients.openWindow(url);
  }));
});
