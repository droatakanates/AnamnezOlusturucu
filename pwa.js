/* Service Worker kaydı — çevrimdışı/uygulama deneyimi için. */
if ("serviceWorker" in navigator) {
  window.addEventListener("load", () => {
    navigator.serviceWorker.register("sw.js").catch(() => {
      /* kayıt başarısız olsa bile uygulama normal çalışır */
    });
  });
}
