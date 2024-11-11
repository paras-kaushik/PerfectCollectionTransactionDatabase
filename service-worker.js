const CACHE_NAME = "invoice-app-cache-v1";
const urlsToCache = [
  "/",
  "/css/pdf.css",
  "/js/pdf.js",
  "https://stackpath.bootstrapcdn.com/bootstrap/4.5.0/css/bootstrap.min.css",
  "https://cdnjs.cloudflare.com/ajax/libs/html2pdf.js/0.9.2/html2pdf.bundle.js",
  "https://ajax.googleapis.com/ajax/libs/jquery/3.5.1/jquery.min.js",
  "https://code.jquery.com/jquery-3.6.0.js",
  "https://code.jquery.com/ui/1.13.0/jquery-ui.js",
  // Add other resources you want to cache
];

// Install the service worker and cache resources
self.addEventListener("install", function (event) {
  event.waitUntil(
    caches.open(CACHE_NAME).then(function (cache) {
      return cache.addAll(urlsToCache);
    })
  );
});

// Fetch event to handle network requests
self.addEventListener("fetch", function (event) {
  event.respondWith(
    caches.match(event.request).then(function (response) {
      // Cache hit - return the cached response
      if (response) {
        return response;
      }
      // Clone the request to fetch it from the network
      var fetchRequest = event.request.clone();

      return fetch(fetchRequest)
        .then(function (networkResponse) {
          // Check if we received a valid response
          if (
            !networkResponse ||
            networkResponse.status !== 200 ||
            networkResponse.type !== "basic"
          ) {
            return networkResponse;
          }

          // Clone the response to cache it
          var responseToCache = networkResponse.clone();

          caches.open(CACHE_NAME).then(function (cache) {
            cache.put(event.request, responseToCache);
          });

          return networkResponse;
        })
        .catch(function () {
          // Handle the error when the network is unavailable
          return caches.match("/").then(function (response) {
            return response || fetch("/");
          });
          return new Response(
            "You are offline. Please check your internet connection."
          );
        });
    })
  );
});

// Activate the service worker and remove old caches
self.addEventListener("activate", function (event) {
  var cacheWhitelist = [CACHE_NAME];

  event.waitUntil(
    caches.keys().then(function (cacheNames) {
      return Promise.all(
        cacheNames.map(function (cacheName) {
          if (cacheWhitelist.indexOf(cacheName) === -1) {
            return caches.delete(cacheName);
          }
        })
      );
    })
  );
});
