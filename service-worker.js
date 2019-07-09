/*
 Service worker file for Disc Golf Scoring PWA
*/


// TODO: add versioin number to cache name.
//       delete old caches from the browser.
var cache_name = 'dg-pwa';
var files_to_cache = [
	'/',
	'/index.html',
	'/style.css',
	'/script.js',
	'/images/icon-dg-128.png',
        '/images/icon-dg-144.png',
        '/images/icon-dg-152.png',
        '/images/icon-dg-192.png',
        '/images/icon-dg-256.png',
	'/images/icon-dg-512.png'
];

self.addEventListener('install',	 function(event){
	event.waitUntil(
		caches.open(cache_name).then(function(cache){
                    return cache.addAll(files_to_cache);
		}).catch(function(error){
                    console.log('Service Worker Error' + error);
                })
	);
});

self.addEventListener('fetch', function(event){
	event.respondWith(
		caches.match(event.request).then(function(response){
			return response || fetch(event.request);
		})
	);
});