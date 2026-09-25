/* JELLY LAND 서비스 워커 — "홈 화면에 앱 추가(설치)"를 가능하게 하기 위한 최소 버전.
   캐시는 하지 않아서 항상 최신 버전이 열려요. */
self.addEventListener("install", () => self.skipWaiting());
self.addEventListener("activate", (e) => e.waitUntil(self.clients.claim()));
self.addEventListener("fetch", () => {});
